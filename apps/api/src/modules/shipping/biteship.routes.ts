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
 * POST /api/v1/webhooks/biteship — BiteShip status update.
 *
 * Like Midtrans, this is unauthenticated by design — BiteShip authenticates
 * itself via a shared secret in a header. We only verify the body payload
 * structure and idempotently apply status updates. Returns 200 even for
 * unknown shipments (no retries are useful in that case).
 */
shippingWebhookRouter.post("/biteship", json({ limit: "100kb" }), async (req, res, next) => {
  try {
    const payload = req.body as BiteshipWebhookPayload;
    if (!payload?.order_id) {
      res.status(400).json({
        success: false,
        error: { code: "INVALID_PAYLOAD", message: "order_id wajib diisi" }
      });
      return;
    }
    const result = await applyShipmentWebhook(await getPool(), payload);
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
