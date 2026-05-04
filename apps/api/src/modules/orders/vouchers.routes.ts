import { Router } from "express";
import { z } from "zod";
import { authGuard } from "../../common/middleware/auth";
import { idempotency } from "../../common/middleware/idempotency";
import { logAudit } from "../../common/audit/audit-log";
import { withTransaction } from "../../infrastructure/db/transaction-manager";
import { getPool } from "../../infrastructure/db/pool";
import { AppError } from "../../common/errors/app-error";
import {
  createVoucher,
  getVoucherByCode,
  redeemVoucher,
  validateAndCompute
} from "./vouchers.service";

const vouchersRouter = Router();

const createVoucherSchema = z.object({
  code: z.string().min(2).max(40),
  description: z.string().max(200).optional(),
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: z.number().positive(),
  maxDiscount: z.number().positive().optional(),
  minOrderAmount: z.number().nonnegative().optional(),
  maxUses: z.number().int().positive().optional(),
  perUserLimit: z.number().int().positive().optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional()
});

vouchersRouter.post("/", authGuard, idempotency(), (req, res, next) => {
  createVoucherSchema
    .parseAsync(req.body)
    .then(async (input) => {
      const result = await withTransaction((client) =>
        createVoucher(client, { ...input, createdBy: req.user?.sub })
      );
      await logAudit({
        actorId: req.user?.sub,
        action: "vouchers.create",
        moduleName: "orders",
        entityId: result.id,
        afterData: { code: result.code }
      });
      res.status(201).json({ success: true, data: result });
    })
    .catch(next);
});

vouchersRouter.get("/", authGuard, async (_req, res, next) => {
  try {
    const db = await getPool();
    const result = await db.query(
      `SELECT id, code, description, discount_type, discount_value, max_discount,
              min_order_amount, max_uses, per_user_limit, starts_at, ends_at,
              is_active, used_count, created_at
         FROM vouchers ORDER BY created_at DESC LIMIT 200`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
});

vouchersRouter.get("/:code", authGuard, async (req, res, next) => {
  try {
    const voucher = await getVoucherByCode(await getPool(), String(req.params.code));
    res.json({ success: true, data: voucher });
  } catch (err) {
    next(err);
  }
});

const previewSchema = z.object({
  code: z.string().min(2).max(40),
  orderSubtotal: z.number().positive(),
  customerId: z.string().uuid().optional()
});

vouchersRouter.post("/preview", authGuard, (req, res, next) => {
  previewSchema
    .parseAsync(req.body)
    .then(async (input) => {
      const db = await getPool();
      const voucher = await getVoucherByCode(db, input.code);
      const discount = await validateAndCompute(db, voucher, {
        orderSubtotal: input.orderSubtotal,
        customerId: input.customerId
      });
      res.json({
        success: true,
        data: {
          code: voucher.code,
          discountType: voucher.discount_type,
          discountValue: Number(voucher.discount_value),
          discountApplied: discount,
          finalAmount: Math.max(0, input.orderSubtotal - discount)
        }
      });
    })
    .catch(next);
});

const applySchema = z.object({ code: z.string().min(2).max(40) });

/**
 * Apply a voucher to an existing order. Atomic: locks the order row, validates
 * + computes discount, redeems (which atomically bumps used_count), then
 * updates orders.total_amount and records the redemption. Rejects if the
 * order already has a redemption — voucher stacking is a separate feature.
 */
const applyVoucherRouter = Router({ mergeParams: true });
applyVoucherRouter.post("/:id/voucher", authGuard, idempotency(), (req, res, next) => {
  applySchema
    .parseAsync(req.body)
    .then(async (input) => {
      const orderId = String(req.params.id);
      const result = await withTransaction(async (client) => {
        const orderRow = await client.query<{
          subtotal: string;
          total_amount: string;
          discount_amount: string | null;
          customer_id: string | null;
        }>(
          `SELECT subtotal, total_amount, discount_amount, customer_id
             FROM orders WHERE id = $1 FOR UPDATE`,
          [orderId]
        );
        if (!orderRow.rowCount) {
          throw new AppError(404, "ORDER_NOT_FOUND", "Order tidak ditemukan");
        }

        const existing = await client.query<{ count: string | number }>(
          "SELECT COUNT(*) AS count FROM voucher_redemptions WHERE order_id = $1",
          [orderId]
        );
        if (Number(existing.rows[0]?.count ?? 0) > 0) {
          throw new AppError(
            409,
            "VOUCHER_ALREADY_APPLIED",
            "Order sudah memakai voucher"
          );
        }

        const voucher = await getVoucherByCode(client, input.code);
        // PR E (charges) introduced orders.subtotal as the pre-discount /
        // pre-tax / pre-service-charge base. Always discount against subtotal
        // so the discount math stays correct even if applyCharges already
        // ran and inflated total_amount with PPN/service. Legacy orders pre-
        // migration 011 have subtotal=0 → fall back to total_amount.
        const storedSubtotal = Number(orderRow.rows[0].subtotal);
        const subtotal =
          storedSubtotal > 0 ? storedSubtotal : Number(orderRow.rows[0].total_amount);
        const discount = await validateAndCompute(client, voucher, {
          orderSubtotal: subtotal,
          customerId: orderRow.rows[0].customer_id ?? undefined
        });
        const newTotal = Math.max(0, subtotal - discount);

        const redemption = await redeemVoucher(client, {
          voucherId: voucher.id,
          orderId,
          customerId: orderRow.rows[0].customer_id ?? undefined,
          discountApplied: discount,
          perUserLimit: voucher.per_user_limit
        });

        // Update both subtotal-side discount tracking and total_amount.
        // applyCharges (PR E) is the authoritative source for total_amount
        // when tax/service charge is present; if charges are applied AFTER
        // the voucher, that path will recompute total = (subtotal - discount)
        // + service + tax. If charges were applied BEFORE, we still write
        // newTotal = subtotal - discount here so unchanged callers see the
        // discounted base; charges should be re-applied to recompose.
        await client.query(
          `UPDATE orders
              SET total_amount = $1,
                  discount_amount = $2
            WHERE id = $3`,
          [newTotal, discount, orderId]
        );
        return {
          orderId,
          voucherCode: voucher.code,
          discountApplied: discount,
          newTotal,
          redemptionId: redemption.redemptionId
        };
      });
      await logAudit({
        actorId: req.user?.sub,
        action: "orders.apply_voucher",
        moduleName: "orders",
        entityId: orderId,
        afterData: result
      });
      res.status(201).json({ success: true, data: result });
    })
    .catch(next);
});

export { vouchersRouter, applyVoucherRouter };
