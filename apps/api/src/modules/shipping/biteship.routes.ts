import { Router, json } from "express";
import { z } from "zod";
import { authGuard } from "../../common/middleware/auth";
import { idempotency } from "../../common/middleware/idempotency";
import { logAudit } from "../../common/audit/audit-log";
import { loadEnv } from "../../config/env";
import { withTransaction } from "../../infrastructure/db/transaction-manager";
import { getPool } from "../../infrastructure/db/pool";
import {
  applyShipmentWebhook,
  bookShipment,
  quoteRates,
  type BiteshipConfig,
  type BiteshipWebhookPayload
} from "./biteship.service";

function configFromEnv(): BiteshipConfig | null {
  const env = loadEnv();
  if (!env.BITESHIP_API_KEY) return null;
  return { apiKey: env.BITESHIP_API_KEY, baseUrl: env.BITESHIP_BASE_URL };
}

const quoteSchema = z.object({
  origin: z.object({ postalCode: z.string().min(1) }),
  destination: z.object({ postalCode: z.string().min(1) }),
  couriers: z.array(z.string().min(1)).min(1),
  items: z
    .array(
      z.object({
        name: z.string().min(1),
        value: z.number().nonnegative(),
        weight: z.number().positive(),
        quantity: z.number().int().positive()
      })
    )
    .min(1)
});

const bookSchema = z.object({
  orderId: z.string().min(1),
  courierCompany: z.string().min(1),
  courierType: z.string().min(1),
  origin: z.object({
    contactName: z.string().min(1),
    contactPhone: z.string().min(1),
    address: z.string().min(1),
    postalCode: z.string().min(1)
  }),
  destination: z.object({
    contactName: z.string().min(1),
    contactPhone: z.string().min(1),
    address: z.string().min(1),
    postalCode: z.string().min(1)
  }),
  items: z
    .array(
      z.object({
        name: z.string().min(1),
        value: z.number().nonnegative(),
        weight: z.number().positive(),
        quantity: z.number().int().positive()
      })
    )
    .min(1),
  totalWeight: z.number().positive().optional(),
  referenceId: z.string().optional()
});

const shippingRouter = Router();

shippingRouter.post("/quote", authGuard, json({ limit: "100kb" }), (req, res, next) => {
  quoteSchema
    .parseAsync(req.body)
    .then(async (input) => {
      const config = configFromEnv();
      if (!config) {
        res.status(503).json({
          success: false,
          error: { code: "BITESHIP_NOT_CONFIGURED", message: "BiteShip API key tidak diset" }
        });
        return;
      }
      const rates = await quoteRates(config, input);
      res.json({ success: true, data: { rates } });
    })
    .catch(next);
});

shippingRouter.post(
  "/book",
  authGuard,
  idempotency(),
  json({ limit: "100kb" }),
  (req, res, next) => {
    bookSchema
      .parseAsync(req.body)
      .then(async (input) => {
        const config = configFromEnv();
        if (!config) {
          res.status(503).json({
            success: false,
            error: { code: "BITESHIP_NOT_CONFIGURED", message: "BiteShip API key tidak diset" }
          });
          return;
        }
        const result = await withTransaction((client) => bookShipment(client, config, input));
        await logAudit({
          actorId: req.user?.sub,
          action: "shipping.book",
          moduleName: "orders",
          entityId: input.orderId,
          afterData: {
            shipmentId: result.shipmentId,
            externalId: result.externalId,
            courier: `${input.courierCompany}-${input.courierType}`,
            price: result.price
          }
        });
        res.status(201).json({ success: true, data: result });
      })
      .catch(next);
  }
);

const shippingWebhookRouter = Router();

/**
 * Constant-time comparison helper. Same pattern as
 * `verifyMidtransSignature` — guards against timing oracles even though
 * the secret is short.
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
 * Extract the webhook token from either `Authorization: Bearer <token>`
 * or a `?token=` query string parameter (BiteShip dashboard supports
 * embedding the token in the webhook URL).
 */
function extractWebhookToken(req: import("express").Request): string {
  const auth = req.header("authorization") ?? "";
  const bearerMatch = auth.match(/^Bearer\s+(.+)$/i);
  if (bearerMatch) return bearerMatch[1].trim();
  const query = req.query?.token;
  if (typeof query === "string" && query) return query;
  return "";
}

/**
 * POST /api/v1/webhooks/biteship — BiteShip status update.
 *
 * BiteShip does not sign webhook bodies, so we authenticate the caller
 * using a pre-shared `BITESHIP_WEBHOOK_TOKEN` configured in the dashboard
 * (either as a Bearer header or `?token=` URL parameter). Comparison is
 * constant-time. Returns 503 if the token is not configured (so a
 * misconfigured deployment fails closed instead of accepting forged
 * payloads), 401 if the token is wrong, and 200 even for unknown
 * shipments (no retries are useful in that case).
 */
shippingWebhookRouter.post("/biteship", json({ limit: "100kb" }), async (req, res, next) => {
  try {
    const env = loadEnv();
    if (!env.BITESHIP_WEBHOOK_TOKEN) {
      res.status(503).json({
        success: false,
        error: {
          code: "BITESHIP_WEBHOOK_NOT_CONFIGURED",
          message: "BiteShip webhook token tidak diset"
        }
      });
      return;
    }
    const presented = extractWebhookToken(req);
    if (!presented || !constantTimeEqual(presented, env.BITESHIP_WEBHOOK_TOKEN)) {
      await logAudit({
        action: "shipping.webhook.unauthorized",
        moduleName: "orders",
        afterData: { ip: req.ip ?? null, hasToken: Boolean(presented) }
      });
      res.status(401).json({
        success: false,
        error: { code: "INVALID_WEBHOOK_TOKEN", message: "Token webhook tidak valid" }
      });
      return;
    }
    const payload = req.body as BiteshipWebhookPayload;
    if (!payload?.order_id) {
      res.status(400).json({
        success: false,
        error: { code: "INVALID_PAYLOAD", message: "order_id wajib diisi" }
      });
      return;
    }
    // Must run inside a transaction — otherwise the SELECT ... FOR
    // UPDATE in applyShipmentWebhook releases the row lock immediately
    // (each pool.query() is its own implicit transaction), defeating
    // the rank-guard race protection.
    const result = await withTransaction((client) =>
      applyShipmentWebhook(client, payload)
    );
    await logAudit({
      action: result.updated ? "shipping.webhook.update" : "shipping.webhook.unknown",
      moduleName: "orders",
      entityId: result.shipmentId || undefined,
      afterData: { status: result.status, externalId: payload.order_id }
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

export { shippingRouter, shippingWebhookRouter };
