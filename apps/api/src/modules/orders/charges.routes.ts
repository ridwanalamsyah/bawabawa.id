import { Router } from "express";
import { z } from "zod";
import { authGuard } from "../../common/middleware/auth";
import { idempotency } from "../../common/middleware/idempotency";
import { logAudit } from "../../common/audit/audit-log";
import { withTransaction } from "../../infrastructure/db/transaction-manager";
import {
  DEFAULT_PPN_RATE,
  applyCharges,
  computeTotals
} from "./charges.service";

/**
 * Scoped under /api/v1/orders with mergeParams so we can inline `:id` into
 * the route and share the order authorization path.
 */
const chargesRouter = Router({ mergeParams: true });

const applySchema = z.object({
  serviceChargeRate: z.number().min(0).max(1).optional(),
  taxRate: z.number().min(0).max(1).optional(),
  taxInclusive: z.boolean().optional()
});

chargesRouter.post(
  "/:id/charges",
  authGuard,
  idempotency(),
  (req, res, next) => {
    applySchema
      .parseAsync(req.body)
      .then(async (input) => {
        const orderId = String(req.params.id);
        const result = await withTransaction((client) =>
          applyCharges(client, { orderId, ...input })
        );
        await logAudit({
          actorId: req.user?.sub,
          action: "orders.apply_charges",
          moduleName: "orders",
          entityId: orderId,
          afterData: result
        });
        res.status(200).json({ success: true, data: result });
      })
      .catch(next);
  }
);

const previewSchema = z.object({
  subtotal: z.number().nonnegative(),
  discountAmount: z.number().nonnegative().optional(),
  serviceChargeRate: z.number().min(0).max(1).optional(),
  taxRate: z.number().min(0).max(1).optional(),
  taxInclusive: z.boolean().optional()
});

/**
 * Preview the breakdown without touching the DB. Useful for checkout UI so
 * the customer sees subtotal / discount / service / tax / total before
 * committing an order.
 */
chargesRouter.post("/charges/preview", authGuard, (req, res, next) => {
  previewSchema
    .parseAsync(req.body)
    .then((input) => {
      const result = computeTotals(input);
      res.json({ success: true, data: result });
    })
    .catch(next);
});

chargesRouter.get("/charges/defaults", authGuard, (_req, res) => {
  res.json({
    success: true,
    data: {
      taxRate: DEFAULT_PPN_RATE,
      taxRatePercent: DEFAULT_PPN_RATE * 100,
      serviceChargeRate: 0,
      taxInclusive: false,
      label: "PPN 11%"
    }
  });
});

export { chargesRouter };
