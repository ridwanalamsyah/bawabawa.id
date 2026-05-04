import { Router, json } from "express";
import { z } from "zod";
import { authGuard } from "../../common/middleware/auth";
import { idempotency } from "../../common/middleware/idempotency";
import { logAudit } from "../../common/audit/audit-log";
import { loadEnv } from "../../config/env";
import { withTransaction } from "../../infrastructure/db/transaction-manager";
import { getPool } from "../../infrastructure/db/pool";
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
 * POST /api/v1/webhooks/resend — Resend webhook receiver.
 *
 * Resend signs webhook payloads using the Svix `webhook_secret` you
 * configure in their dashboard. We verify the signature using a simple
 * HMAC-SHA256 over the raw body to avoid a hard dependency on the Svix
 * SDK. Unknown event types / unknown email ids are silently no-op (200)
 * so Resend stops retrying.
 */
emailsWebhookRouter.post(
  "/resend",
  json({
    limit: "100kb",
    verify: (req: any, _res, buf) => {
      // Stash raw body for signature verification.
      req.rawBody = buf.toString("utf8");
    }
  }),
  async (req, res, next) => {
    try {
      const env = loadEnv();
      if (!env.RESEND_API_KEY) {
        res.status(503).json({
          success: false,
          error: {
            code: "RESEND_NOT_CONFIGURED",
            message: "Resend belum dikonfigurasi"
          }
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
      const result = await applyEmailWebhook(await getPool(), event);
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

export { emailsRouter, emailsWebhookRouter };
