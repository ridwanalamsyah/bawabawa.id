import { Router, json } from "express";
import { z } from "zod";
import { loadEnv } from "../../config/env";
import { withTransaction } from "../../infrastructure/db/transaction-manager";
import { logAudit } from "../../common/audit/audit-log";
import {
  processMidtransNotification,
  verifyMidtransSignature,
  type MidtransNotification
} from "./midtrans.service";

const notificationSchema = z.object({
  order_id: z.string().min(1),
  status_code: z.string().min(1),
  gross_amount: z.string().min(1),
  signature_key: z.string().min(1),
  transaction_id: z.string().min(1),
  transaction_status: z.string().min(1),
  fraud_status: z.string().optional(),
  payment_type: z.string().optional(),
  transaction_time: z.string().optional(),
  settlement_time: z.string().optional()
});

const midtransRouter = Router();

/**
 * POST /api/v1/webhooks/midtrans — Midtrans HTTP Notification handler.
 *
 * The endpoint is unauthenticated (Midtrans doesn't sign-in to call us);
 * authenticity is enforced by SHA512 signature verification using the
 * server key. We always return 200 quickly for valid-but-no-op cases (e.g.
 * unknown order, duplicate webhook) so Midtrans stops retrying. Genuine
 * 5xx is reserved for our own bugs.
 *
 * Important: don't mount this under `apiRouter.use(authGuard)` etc. The
 * route is intentionally public — signature verification is the auth.
 */
midtransRouter.post("/midtrans", json({ limit: "100kb" }), async (req, res, next) => {
  try {
    const env = loadEnv();
    if (!env.MIDTRANS_SERVER_KEY) {
      res.status(503).json({
        success: false,
        error: { code: "MIDTRANS_NOT_CONFIGURED", message: "Midtrans server key tidak diset" }
      });
      return;
    }

    const parsed = notificationSchema.safeParse(req.body);
    if (!parsed.success) {
      // Return 400 so Midtrans logs it; don't 200 invalid bodies because
      // that hides misconfiguration during integration testing.
      res.status(400).json({
        success: false,
        error: { code: "INVALID_NOTIFICATION", message: "Body notifikasi tidak valid" }
      });
      return;
    }
    const notification = parsed.data as MidtransNotification;

    if (!verifyMidtransSignature(notification, env.MIDTRANS_SERVER_KEY)) {
      // Forged or replayed notification — 401 stops Midtrans from retrying
      // (a genuine notification with a bad signature implies key rotation,
      // which the operator must fix manually anyway).
      res.status(401).json({
        success: false,
        error: { code: "INVALID_SIGNATURE", message: "Signature tidak valid" }
      });
      return;
    }

    const result = await withTransaction((client) =>
      processMidtransNotification(client, notification)
    );

    await logAudit({
      action: "payments.midtrans.notification",
      moduleName: "orders",
      entityId: result.orderId,
      afterData: {
        status: result.status,
        duplicated: result.duplicated,
        transactionId: notification.transaction_id
      }
    });

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/payments/config — non-secret payment config for the
 * frontend (Snap client key + sandbox flag). Server key never exposed.
 */
const paymentsConfigRouter = Router();
paymentsConfigRouter.get("/config", (_req, res) => {
  const env = loadEnv();
  res.json({
    success: true,
    data: {
      midtrans: {
        enabled: Boolean(env.MIDTRANS_CLIENT_KEY),
        clientKey: env.MIDTRANS_CLIENT_KEY ?? null,
        isProduction: env.MIDTRANS_IS_PRODUCTION ?? false
      }
    }
  });
});

export { midtransRouter, paymentsConfigRouter };
