import { createHmac, timingSafeEqual } from "crypto";
import { Router, json } from "express";
import { z } from "zod";
import { authGuard } from "../../common/middleware/auth";
import { idempotency } from "../../common/middleware/idempotency";
import { logAudit } from "../../common/audit/audit-log";
import { loadEnv } from "../../config/env";
import { withTransaction } from "../../infrastructure/db/transaction-manager";
import {
  applyEmailWebhook,
  enqueueEmail,
  flushOutbox,
  sendQueuedEmail,
  type ResendConfig,
  type ResendWebhookEvent
} from "./resend.service";

function configFromEnv(): ResendConfig | null {
  const env = loadEnv();
  if (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL) return null;
  return {
    apiKey: env.RESEND_API_KEY,
    baseUrl: env.RESEND_BASE_URL,
    fromEmail: env.RESEND_FROM_EMAIL,
    replyTo: env.RESEND_REPLY_TO
  };
}

function notConfigured(res: import("express").Response) {
  res.status(503).json({
    success: false,
    error: {
      code: "RESEND_NOT_CONFIGURED",
      message: "RESEND_API_KEY / RESEND_FROM_EMAIL belum diset"
    }
  });
}

const sendSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1).max(255),
  html: z.string().min(1),
  text: z.string().optional(),
  templateKey: z.string().max(60).optional(),
  relatedEntity: z.string().max(60).optional(),
  relatedId: z.string().uuid().optional()
});

const emailsRouter = Router();

/**
 * POST /api/v1/emails/send — enqueue + immediately try to send.
 *
 * The two-step (enqueue then send) preserves the outbox guarantee:
 * even if the Resend call fails, the row exists and `flushOutbox` /
 * a future `/flush` call will retry. Returns the email id + provider
 * message id (when available) so the caller can correlate webhook
 * events later.
 */
emailsRouter.post(
  "/send",
  authGuard,
  idempotency(),
  json({ limit: "256kb" }),
  (req, res, next) => {
    sendSchema
      .parseAsync(req.body)
      .then(async (input) => {
        const config = configFromEnv();
        if (!config) return notConfigured(res);
        const { emailId } = await withTransaction((client) => enqueueEmail(client, input));
        const result = await withTransaction((client) =>
          sendQueuedEmail(client, config, emailId)
        );
        await logAudit({
          actorId: req.user?.sub,
          action: result.delivered ? "email.send" : "email.send.failed",
          moduleName: "email",
          entityId: emailId,
          afterData: {
            to: input.to,
            templateKey: input.templateKey,
            ...(result.delivered
              ? { providerMessageId: result.providerMessageId }
              : { reason: result.reason, error: result.error })
          }
        });
        res.status(result.delivered ? 200 : 202).json({
          success: true,
          data: { emailId, ...result }
        });
      })
      .catch(next);
  }
);

/**
 * POST /api/v1/emails/flush — flush a batch of pending outbox emails.
 *
 * Intended to be invoked from a cron job or the in-process scheduler.
 * Authenticated and permission-gated so an attacker can't trigger
 * a flood of provider calls; default batch size is 25 to keep p95
 * latency bounded.
 */
emailsRouter.post(
  "/flush",
  authGuard,
  json({ limit: "1kb" }),
  async (req, res, next) => {
    try {
      const config = configFromEnv();
      if (!config) return notConfigured(res);
      const limit = Math.min(100, Math.max(1, Number(req.body?.limit ?? 25)));
      const result = await withTransaction((client) =>
        flushOutbox(client, config, limit)
      );
      await logAudit({
        actorId: req.user?.sub,
        action: "email.flush",
        moduleName: "email",
        afterData: result
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

const emailsWebhookRouter = Router();

/**
 * Verify a Svix-style webhook signature. Resend (built on Svix) sends:
 *   svix-id:        unique message id
 *   svix-timestamp: unix seconds (rejected if older than 5 minutes to
 *                   block replay attacks)
 *   svix-signature: space-separated `v1,<base64>` entries — we accept
 *                   if any one matches.
 *
 * The signed payload is `${svix-id}.${svix-timestamp}.${rawBody}`
 * HMAC-SHA256'd with the base64-decoded portion of the
 * `whsec_<base64secret>` from the Resend dashboard. Constant-time
 * compare guards against timing oracles.
 */
function verifyResendSignature(
  rawBody: string,
  headers: Record<string, string | undefined>,
  whsecKey: string
): boolean {
  const svixId = headers["svix-id"];
  const svixTimestamp = headers["svix-timestamp"];
  const svixSignature = headers["svix-signature"];
  if (!svixId || !svixTimestamp || !svixSignature) return false;

  // Reject replays older than 5 minutes (Svix recommendation).
  const ts = Number(svixTimestamp);
  if (!Number.isFinite(ts)) return false;
  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - ts) > 5 * 60) return false;

  const secret = whsecKey.startsWith("whsec_") ? whsecKey.slice(6) : whsecKey;
  const secretBytes = Buffer.from(secret, "base64");
  const expected = createHmac("sha256", secretBytes)
    .update(`${svixId}.${svixTimestamp}.${rawBody}`)
    .digest();

  const presented = svixSignature.split(" ");
  for (const entry of presented) {
    const [, sig] = entry.split(",");
    if (!sig) continue;
    let candidate: Buffer;
    try {
      candidate = Buffer.from(sig, "base64");
    } catch {
      continue;
    }
    if (
      candidate.length === expected.length &&
      timingSafeEqual(candidate, expected)
    ) {
      return true;
    }
  }
  return false;
}

/**
 * POST /api/v1/webhooks/resend — Resend webhook receiver.
 *
 * Authenticates via Svix-style HMAC-SHA256 over the raw body using
 * `RESEND_WEBHOOK_SECRET`. Returns 503 if the secret is unset (so a
 * misconfigured deployment fails closed instead of accepting forged
 * status updates), 401 if the signature is wrong, and 200 even for
 * unknown event types / unknown email ids so Resend stops retrying.
 */
emailsWebhookRouter.post(
  "/resend",
  json({
    limit: "100kb",
    verify: (req: any, _res, buf) => {
      // Capture the raw body so the signature check sees the exact
      // bytes Resend signed (express's body-parser would otherwise
      // re-serialize and break the comparison).
      req.rawBody = buf.toString("utf8");
    }
  }),
  async (req, res, next) => {
    try {
      const env = loadEnv();
      if (!env.RESEND_API_KEY || !env.RESEND_WEBHOOK_SECRET) {
        res.status(503).json({
          success: false,
          error: {
            code: "RESEND_WEBHOOK_NOT_CONFIGURED",
            message:
              "RESEND_API_KEY / RESEND_WEBHOOK_SECRET belum diset"
          }
        });
        return;
      }
      const rawBody = ((req as any).rawBody as string | undefined) ?? "";
      const headerMap: Record<string, string | undefined> = {
        "svix-id": req.header("svix-id"),
        "svix-timestamp": req.header("svix-timestamp"),
        "svix-signature": req.header("svix-signature")
      };
      if (!verifyResendSignature(rawBody, headerMap, env.RESEND_WEBHOOK_SECRET)) {
        await logAudit({
          action: "email.webhook.unauthorized",
          moduleName: "email",
          afterData: {
            ip: req.ip ?? null,
            hasSignature: Boolean(headerMap["svix-signature"])
          }
        });
        res.status(401).json({
          success: false,
          error: { code: "INVALID_WEBHOOK_SIGNATURE", message: "Signature webhook tidak valid" }
        });
        return;
      }
      const event = req.body as ResendWebhookEvent;
      if (!event?.type) {
        res.status(400).json({
          success: false,
          error: { code: "INVALID_PAYLOAD", message: "type wajib diisi" }
        });
        return;
      }
      // Wrap in a transaction so any future row-level locking inside
      // applyEmailWebhook (e.g. SELECT ... FOR UPDATE) actually holds.
      const result = await withTransaction((client) =>
        applyEmailWebhook(client, event)
      );
      await logAudit({
        action: result.updated ? "email.webhook.update" : "email.webhook.unknown",
        moduleName: "email",
        entityId: result.emailId,
        afterData: { type: event.type, status: result.status }
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

export { emailsRouter, emailsWebhookRouter, verifyResendSignature };
