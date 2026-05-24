import { Router, json } from "express";
import { z } from "zod";
import { loadEnv } from "../../config/env";
import { withTransaction } from "../../infrastructure/db/transaction-manager";
import { logAudit } from "../../common/audit/audit-log";
import {
  processDokuNotification,
  verifyDokuSignature,
  type DokuNotification
} from "./doku.service";

const notificationSchema = z.object({
  order: z.object({
    invoice_number: z.string().min(1),
    amount: z.union([z.string(), z.number()]),
    currency: z.string().optional()
  }),
  transaction: z.object({
    status: z.string().min(1),
    date: z.string().optional(),
    original_request_id: z.string().optional()
  }),
  channel: z
    .object({
      id: z.string().optional()
    })
    .optional(),
  acquirer: z
    .object({
      id: z.string().optional()
    })
    .optional()
});

/**
 * Webhook delivery — DOKU calls this URL after each payment-state change.
 *
 * Note: `express.json` ordinarily drops the raw bytes once it has parsed
 * them, but DOKU's HMAC binds to the exact wire bytes. We capture them
 * via the `verify` hook into `req.rawBody` so `verifyDokuSignature` can
 * recompute the digest without depending on whatever shape JSON.stringify
 * would produce.
 */
const jsonWithRawBody = json({
  limit: "100kb",
  verify: (req: any, _res, buf) => {
    req.rawBody = buf.toString("utf8");
  }
});

const dokuRouter = Router();

/**
 * POST /api/v1/webhooks/doku — DOKU Payment Notification handler.
 *
 * The endpoint is unauthenticated (DOKU doesn't sign-in to call us);
 * authenticity is enforced by HMAC-SHA256 header signature + SHA-256 body
 * digest validation. We always return 200 quickly for valid-but-no-op
 * cases (unknown order, duplicate webhook) so DOKU stops retrying —
 * genuine 5xx is reserved for our own bugs.
 *
 * Important: don't mount this under `apiRouter.use(authGuard)` etc. The
 * route is intentionally public — signature verification is the auth.
 */
dokuRouter.post("/doku", jsonWithRawBody, async (req, res, next) => {
  try {
    const env = loadEnv();
    if (!env.DOKU_SECRET_KEY) {
      res.status(503).json({
        success: false,
        error: { code: "DOKU_NOT_CONFIGURED", message: "DOKU secret key tidak diset" }
      });
      return;
    }

    const parsed = notificationSchema.safeParse(req.body);
    if (!parsed.success) {
      // Return 400 so DOKU logs it; don't 200 invalid bodies because that
      // hides misconfiguration during integration testing.
      res.status(400).json({
        success: false,
        error: { code: "INVALID_NOTIFICATION", message: "Body notifikasi tidak valid" }
      });
      return;
    }
    const notification = parsed.data as DokuNotification;

    // DOKU sends header names in `Client-Id` casing; Express normalises
    // to lowercase. Optional `client-id` header lets the operator wire
    // their own DOKU client id when running multiple stores from the
    // same secret key.
    const headerStr = (name: string): string => {
      const value = req.header(name);
      return typeof value === "string" ? value : "";
    };
    const headers = {
      clientId: headerStr("Client-Id") || env.DOKU_CLIENT_ID || "",
      requestId: headerStr("Request-Id"),
      requestTimestamp: headerStr("Request-Timestamp"),
      // DOKU's HMAC binds the signature to `Request-Target` — what they
      // POSTed to. Use the originalUrl so any mounted prefix
      // (`/api/v1/webhooks/doku`) is included rather than just `/doku`.
      requestTarget: req.originalUrl,
      signature: headerStr("Signature"),
      digest: headerStr("Digest")
    };

    // `verify` populated this; fall back to JSON.stringify for tests that
    // POST through supertest with a plain object body.
    const rawBody: string = (req as unknown as { rawBody?: string }).rawBody ?? JSON.stringify(req.body);

    if (!verifyDokuSignature({ rawBody, headers, secretKey: env.DOKU_SECRET_KEY })) {
      res.status(401).json({
        success: false,
        error: { code: "INVALID_SIGNATURE", message: "Signature tidak valid" }
      });
      return;
    }

    const result = await withTransaction((client) =>
      processDokuNotification(client, notification)
    );

    if (result.ignored) {
      await logAudit({
        action: "payments.doku.notification.ignored",
        moduleName: "orders",
        afterData: {
          reason: result.reason,
          orderRef: result.orderRef,
          requestId: headers.requestId
        }
      });
      res.json({ success: true, data: { ignored: true, reason: result.reason } });
      return;
    }

    await logAudit({
      action: "payments.doku.notification",
      moduleName: "orders",
      entityId: result.orderId,
      afterData: {
        status: result.status,
        duplicated: result.duplicated,
        requestId: headers.requestId
      }
    });

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/payments/config — non-secret payment config for the
 * frontend (DOKU client id + sandbox flag). Secret key never exposed.
 */
const paymentsConfigRouter = Router();
paymentsConfigRouter.get("/config", (_req, res) => {
  const env = loadEnv();
  res.json({
    success: true,
    data: {
      doku: {
        enabled: Boolean(env.DOKU_CLIENT_ID && env.DOKU_SECRET_KEY),
        clientId: env.DOKU_CLIENT_ID ?? null,
        isProduction: env.DOKU_IS_PRODUCTION ?? false
      }
    }
  });
});

export { dokuRouter, paymentsConfigRouter };
