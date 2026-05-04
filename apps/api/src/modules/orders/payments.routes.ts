import { Router } from "express";
import { z } from "zod";
import { authGuard } from "../../common/middleware/auth";
import { idempotency } from "../../common/middleware/idempotency";
import { logAudit } from "../../common/audit/audit-log";
import { withTransaction } from "../../infrastructure/db/transaction-manager";
import { getPool } from "../../infrastructure/db/pool";
import {
  ALLOWED_METHODS,
  listPaymentsForOrder,
  listSplitsForOrder,
  recordPayment,
  splitOrderBill
} from "./payments.service";

const paymentsRouter = Router();

const splitSchema = z.object({
  splits: z
    .array(
      z.object({
        customerId: z.string().uuid().optional(),
        label: z.string().max(80).optional(),
        amount: z.number().positive()
      })
    )
    .min(2)
});

paymentsRouter.post(
  "/:id/splits",
  authGuard,
  idempotency(),
  (req, res, next) => {
    splitSchema
      .parseAsync(req.body)
      .then(async (input) => {
        const orderId = String(req.params.id);
        const result = await withTransaction((client) =>
          splitOrderBill(client, orderId, input.splits)
        );
        await logAudit({
          actorId: req.user?.sub,
          action: "orders.split",
          moduleName: "orders",
          entityId: orderId,
          afterData: result
        });
        res.status(201).json({ success: true, data: result });
      })
      .catch(next);
  }
);

paymentsRouter.get("/:id/splits", authGuard, async (req, res, next) => {
  try {
    const orderId = String(req.params.id);
    const splits = await listSplitsForOrder(await getPool(), orderId);
    res.json({ success: true, data: splits });
  } catch (error) {
    next(error);
  }
});

const tenderSchema = z.object({
  amount: z.number().positive(),
  method: z.enum(ALLOWED_METHODS as [string, ...string[]]),
  splitId: z.string().uuid().optional(),
  reference: z.string().max(120).optional()
});

paymentsRouter.post(
  "/:id/tenders",
  authGuard,
  idempotency(),
  (req, res, next) => {
    tenderSchema
      .parseAsync(req.body)
      .then(async (input) => {
        const orderId = String(req.params.id);
        const result = await withTransaction((client) =>
          recordPayment(client, {
            orderId,
            amount: input.amount,
            method: input.method as any,
            splitId: input.splitId,
            reference: input.reference
          })
        );
        await logAudit({
          actorId: req.user?.sub,
          action: "orders.record_payment",
          moduleName: "orders",
          entityId: orderId,
          afterData: result
        });
        res.status(201).json({ success: true, data: result });
      })
      .catch(next);
  }
);

paymentsRouter.get("/:id/tenders", authGuard, async (req, res, next) => {
  try {
    const orderId = String(req.params.id);
    const payments = await listPaymentsForOrder(await getPool(), orderId);
    res.json({ success: true, data: payments });
  } catch (error) {
    next(error);
  }
});

export { paymentsRouter };
