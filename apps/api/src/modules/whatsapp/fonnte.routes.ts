import { Router, json, urlencoded } from "express";
import { z } from "zod";
import { authGuard } from "../../common/middleware/auth";
import { idempotency } from "../../common/middleware/idempotency";
import { logAudit } from "../../common/audit/audit-log";
import { loadEnv } from "../../config/env";
import { withTransaction } from "../../infrastructure/db/transaction-manager";
import { getPool } from "../../infrastructure/db/pool";
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
  return { deviceToken: env.FONNTE_DEVICE_TOKEN, baseUrl: env.FONNTE_BASE_URL };
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

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

const sendSchema = z.object({
  to: z.string().min(8).max(40),
  message: z.string().min(1).max(4096),
  templateKey: z.string().max(60).optional(),
  relatedEntity: z.string().max(60).optional(),
  relatedId: z.string().uuid().optional()
});

const fonnteRouter = Router();

/**
 * POST /api/v1/whatsapp/fonnte/send — enqueue + immediate send.
 *
 * Mirrors the Resend `/emails/send` contract: the row is persisted
 * before the provider call so that even if Fonnte rejects the request,
 * the outbox row exists and the next `flush` can retry.
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
 * POST /api/v1/whatsapp/fonnte/flush — flush a batch of pending rows.
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
 * POST /api/v1/webhooks/fonnte — Fonnte delivery-status receiver.
 *
 * Fonnte does not sign webhook bodies (they recommend a private URL
 * token), same shape as the BiteShip webhook. We require a separate
 * `FONNTE_WEBHOOK_TOKEN` and accept it in `Authorization: Bearer …`
 * or `?token=` for dashboards that prefer URL-embedded tokens.
 *
 * Fonnte uses `application/x-www-form-urlencoded` for delivery
 * webhooks but JSON for some incoming-message variants — accept both.
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
            message: "Fonnte webhook token tidak diset"
          }
        });
        return;
      }
      const auth = req.header("authorization") ?? "";
      const bearer = auth.match(/^Bearer\s+(.+)$/i);
      const presentedRaw = bearer
        ? bearer[1].trim()
        : typeof req.query?.token === "string"
          ? req.query.token
          : "";
      if (
        !presentedRaw ||
        !constantTimeEqual(presentedRaw, env.FONNTE_WEBHOOK_TOKEN)
      ) {
        await logAudit({
          action: "whatsapp.webhook.unauthorized",
          moduleName: "whatsapp",
          afterData: { ip: req.ip ?? null, hasToken: Boolean(presentedRaw) }
        });
        res.status(401).json({
          success: false,
          error: { code: "INVALID_WEBHOOK_TOKEN", message: "Token webhook tidak valid" }
        });
        return;
      }
      const event = req.body as FonnteWebhookEvent;
      const result = await applyWhatsAppWebhook(await getPool(), event);
      await logAudit({
        action: result.updated ? "whatsapp.webhook.update" : "whatsapp.webhook.unknown",
        moduleName: "whatsapp",
        entityId: result.whatsappId,
        afterData: { id: event?.id, status: result.status }
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

export { fonnteRouter, fonnteWebhookRouter };
