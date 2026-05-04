import { Router, json, urlencoded } from "express";
import { z } from "zod";
import { authGuard } from "../../common/middleware/auth";
import { idempotency } from "../../common/middleware/idempotency";
import { logAudit } from "../../common/audit/audit-log";
import { loadEnv } from "../../config/env";
import { withTransaction } from "../../infrastructure/db/transaction-manager";
import {
  applyWhatsAppWebhook,
  enqueueWhatsApp,
  flushWhatsAppOutbox,
  sendQueuedWhatsApp,
  type FonnteConfig,
  type FonnteWebhookEvent
} from "./fonnte.service";

function configFromEnv(): FonnteConfig | null {
  const env = loadEnv();
  if (!env.FONNTE_DEVICE_TOKEN) return null;
  return {
    deviceToken: env.FONNTE_DEVICE_TOKEN,
    baseUrl: env.FONNTE_BASE_URL
  };
}

function notConfigured(res: import("express").Response) {
  res.status(503).json({
    success: false,
    error: {
      code: "FONNTE_NOT_CONFIGURED",
      message: "FONNTE_DEVICE_TOKEN belum diset"
    }
  });
}

const sendSchema = z.object({
  to: z.string().min(1),
  message: z.string().min(1).max(4096),
  templateKey: z.string().max(60).optional(),
  relatedEntity: z.string().max(60).optional(),
  relatedId: z.string().uuid().optional()
});

const fonnteRouter = Router();

/**
 * POST /api/v1/whatsapp/fonnte/send — enqueue + immediately try to
 * send. The two-step (enqueue then send) preserves the outbox
 * guarantee: even if Fonnte fails, the row exists and the next flush
 * will retry.
 */
fonnteRouter.post(
  "/send",
  authGuard,
  idempotency(),
  json({ limit: "16kb" }),
  (req, res, next) => {
    sendSchema
      .parseAsync(req.body)
      .then(async (input) => {
        const config = configFromEnv();
        if (!config) return notConfigured(res);
        // Two-phase commit pattern (mirrors resend.routes): the row
        // MUST be persisted before we hit Fonnte, otherwise a crash
        // between INSERT and UPDATE-after-send leaves a delivered
        // message with no audit trail. Phase 1 commits the pending
        // row; phase 2 attempts the send. If phase 2 throws, the
        // row remains `pending` and the next flush will retry it.
        const { whatsappId } = await withTransaction((client) =>
          enqueueWhatsApp(client, input)
        );
        const result = await withTransaction((client) =>
          sendQueuedWhatsApp(client, config, whatsappId)
        );
        await logAudit({
          actorId: req.user?.sub,
          action: result.delivered ? "whatsapp.send" : "whatsapp.send.failed",
          moduleName: "whatsapp",
          entityId: whatsappId,
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
          data: { whatsappId, ...result }
        });
      })
      .catch(next);
  }
);

/**
 * POST /api/v1/whatsapp/fonnte/flush — batch-send pending outbox
 * messages. Intended for cron / scheduler. Authenticated and
 * permission-gated so an attacker can't spam the gateway.
 */
fonnteRouter.post(
  "/flush",
  authGuard,
  json({ limit: "1kb" }),
  async (req, res, next) => {
    try {
      const config = configFromEnv();
      if (!config) return notConfigured(res);
      const limit = Math.min(100, Math.max(1, Number(req.body?.limit ?? 25)));
      const result = await withTransaction((client) =>
        flushWhatsAppOutbox(client, config, limit)
      );
      await logAudit({
        actorId: req.user?.sub,
        action: "whatsapp.flush",
        moduleName: "whatsapp",
        afterData: result
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

const fonnteWebhookRouter = Router();

/**
 * Constant-time string comparison. Using a length-based early-exit
 * leaks length but length is not secret here (the configured token
 * length is fixed and known once `FONNTE_WEBHOOK_TOKEN` is set).
 */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/**
 * Pull the webhook token from either the Authorization Bearer header
 * or the `?token=` query parameter (Fonnte's dashboard offers both
 * options, and some operators prefer URL-embedded tokens).
 */
function extractWebhookToken(req: import("express").Request): string {
  const auth = req.header("authorization") ?? "";
  const bearerMatch = auth.match(/^Bearer\s+(.+)$/i);
  if (bearerMatch) return bearerMatch[1].trim();
  const query = req.query?.token;
  if (typeof query === "string") return query.trim();
  return "";
}

/**
 * POST /api/v1/webhooks/fonnte — Fonnte webhook receiver.
 *
 * Fonnte does NOT sign webhook bodies, so we authenticate the caller
 * with a pre-shared `FONNTE_WEBHOOK_TOKEN` configured in the dashboard
 * (Bearer header or `?token=`). Constant-time compare.
 *
 * Returns:
 *   * 503 if `FONNTE_WEBHOOK_TOKEN` is unset (fail-closed — refuse to
 *     accept anything, since misconfigured deployments would otherwise
 *     accept forged delivery-status updates).
 *   * 401 on invalid/missing token.
 *   * 200 even for unknown event types / unknown message ids so
 *     Fonnte stops retrying.
 *
 * Accepts both `application/json` and `application/x-www-form-urlencoded`
 * since Fonnte sends different content types depending on the dashboard
 * configuration.
 */
fonnteWebhookRouter.post(
  "/fonnte",
  json({ limit: "32kb" }),
  urlencoded({ extended: false, limit: "32kb" }),
  async (req, res, next) => {
    try {
      const env = loadEnv();
      if (!env.FONNTE_WEBHOOK_TOKEN) {
        res.status(503).json({
          success: false,
          error: {
            code: "FONNTE_WEBHOOK_NOT_CONFIGURED",
            message: "FONNTE_WEBHOOK_TOKEN belum diset"
          }
        });
        return;
      }
      const presented = extractWebhookToken(req);
      if (!presented || !constantTimeEqual(presented, env.FONNTE_WEBHOOK_TOKEN)) {
        await logAudit({
          action: "whatsapp.webhook.unauthorized",
          moduleName: "whatsapp",
          afterData: { ip: req.ip ?? null, hasToken: Boolean(presented) }
        });
        res.status(401).json({
          success: false,
          error: { code: "INVALID_WEBHOOK_TOKEN", message: "Token webhook tidak valid" }
        });
        return;
      }
      const event = req.body as FonnteWebhookEvent | null | undefined;
      // Reject malformed bodies early — same shape as the BiteShip /
      // Resend webhooks (mismatched Content-Type, empty body, etc.
      // should yield 400 not 500). At minimum we need a message id;
      // without it the lookup in applyWhatsAppWebhook is trivially
      // a no-op anyway.
      if (!event || (!event.id && !event.messageid)) {
        res.status(400).json({
          success: false,
          error: { code: "INVALID_PAYLOAD", message: "id atau messageid wajib diisi" }
        });
        return;
      }
      // Wrap in a transaction so the SELECT ... FOR UPDATE inside
      // applyWhatsAppWebhook actually holds the row lock end-to-end
      // (otherwise each pool.query would run in its own implicit tx
      // and the lock would release immediately — same bug fixed in
      // PR #33 for BiteShip).
      const result = await withTransaction((client) =>
        applyWhatsAppWebhook(client, event)
      );
      await logAudit({
        action: result.updated ? "whatsapp.webhook.update" : "whatsapp.webhook.unknown",
        moduleName: "whatsapp",
        entityId: result.whatsappId,
        afterData: { status: result.status, fonnteStatus: event.status }
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

export { fonnteRouter, fonnteWebhookRouter };
