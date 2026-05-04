import { randomUUID } from "node:crypto";
import { AppError } from "../../common/errors/app-error";

type QueryClient = {
  query: <Row = any>(sql: string, params?: any[]) => Promise<{ rows: Row[]; rowCount: number }>;
};

export type DiscountType = "percentage" | "fixed";

export type VoucherInput = {
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  maxDiscount?: number;
  minOrderAmount?: number;
  maxUses?: number;
  perUserLimit?: number;
  startsAt?: string;
  endsAt?: string;
  createdBy?: string;
};

export type VoucherRow = {
  id: string;
  code: string;
  description: string | null;
  discount_type: DiscountType;
  discount_value: string;
  max_discount: string | null;
  min_order_amount: string;
  max_uses: number | null;
  per_user_limit: number | null;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean | number;
  used_count: number;
};

export async function createVoucher(client: QueryClient, input: VoucherInput) {
  if (input.discountValue <= 0) {
    throw new AppError(422, "INVALID_DISCOUNT_VALUE", "Discount value harus > 0");
  }
  if (input.discountType === "percentage" && input.discountValue > 100) {
    throw new AppError(
      422,
      "INVALID_PERCENTAGE",
      "Discount percentage tidak boleh > 100"
    );
  }
  const id = randomUUID();
  await client.query(
    `INSERT INTO vouchers
       (id, code, description, discount_type, discount_value, max_discount,
        min_order_amount, max_uses, per_user_limit, starts_at, ends_at,
        is_active, used_count, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, TRUE, 0, $12)`,
    [
      id,
      input.code.trim().toUpperCase(),
      input.description ?? null,
      input.discountType,
      input.discountValue,
      input.maxDiscount ?? null,
      input.minOrderAmount ?? 0,
      input.maxUses ?? null,
      input.perUserLimit ?? null,
      input.startsAt ?? null,
      input.endsAt ?? null,
      input.createdBy ?? null
    ]
  );
  return { id, code: input.code.trim().toUpperCase() };
}

/**
 * Calculate the discount that would apply to an order subtotal without
 * mutating any state. Used during checkout preview so the UI can show the
 * discount amount before the customer confirms.
 */
export function calculateDiscount(voucher: VoucherRow, orderSubtotal: number): number {
  const minOrder = Number(voucher.min_order_amount);
  if (orderSubtotal < minOrder) {
    throw new AppError(
      422,
      "MIN_ORDER_NOT_MET",
      `Voucher butuh minimal Rp ${minOrder.toLocaleString("id-ID")} untuk dipakai`
    );
  }
  const value = Number(voucher.discount_value);
  let discount: number;
  if (voucher.discount_type === "percentage") {
    discount = (orderSubtotal * value) / 100;
  } else {
    discount = value;
  }
  const maxDiscount = voucher.max_discount != null ? Number(voucher.max_discount) : null;
  if (maxDiscount != null && discount > maxDiscount) {
    discount = maxDiscount;
  }
  // Never discount more than the subtotal (avoid negative totals).
  if (discount > orderSubtotal) {
    discount = orderSubtotal;
  }
  return Math.round(discount * 100) / 100;
}

export async function getVoucherByCode(client: QueryClient, code: string): Promise<VoucherRow> {
  const result = await client.query<VoucherRow>(
    "SELECT * FROM vouchers WHERE code = $1 LIMIT 1",
    [code.trim().toUpperCase()]
  );
  if (!result.rowCount) {
    throw new AppError(404, "VOUCHER_NOT_FOUND", "Kode voucher tidak ditemukan");
  }
  return result.rows[0];
}

/**
 * Validate a voucher against all constraints — active flag, validity window,
 * total usage quota, per-user usage, minimum order amount. Throws on any
 * violation; returns the computed discount amount on success.
 */
export async function validateAndCompute(
  client: QueryClient,
  voucher: VoucherRow,
  context: { orderSubtotal: number; customerId?: string; now?: Date }
): Promise<number> {
  const now = context.now ?? new Date();

  if (!voucher.is_active) {
    throw new AppError(422, "VOUCHER_INACTIVE", "Voucher tidak aktif");
  }
  if (voucher.starts_at && new Date(voucher.starts_at).getTime() > now.getTime()) {
    throw new AppError(422, "VOUCHER_NOT_YET_VALID", "Voucher belum berlaku");
  }
  if (voucher.ends_at && new Date(voucher.ends_at).getTime() < now.getTime()) {
    throw new AppError(422, "VOUCHER_EXPIRED", "Voucher sudah kadaluarsa");
  }
  if (voucher.max_uses != null && voucher.used_count >= voucher.max_uses) {
    throw new AppError(422, "VOUCHER_EXHAUSTED", "Kuota voucher habis");
  }
  if (voucher.per_user_limit != null && context.customerId) {
    const usage = await client.query<{ count: string | number }>(
      "SELECT COUNT(*) AS count FROM voucher_redemptions WHERE voucher_id = $1 AND customer_id = $2",
      [voucher.id, context.customerId]
    );
    const used = Number(usage.rows[0]?.count ?? 0);
    if (used >= voucher.per_user_limit) {
      throw new AppError(
        422,
        "VOUCHER_PER_USER_LIMIT_REACHED",
        `Voucher sudah mencapai batas pemakaian per-user (${voucher.per_user_limit})`
      );
    }
  }
  return calculateDiscount(voucher, context.orderSubtotal);
}

/**
 * Apply (redeem) the voucher on an order. Atomic: increments used_count and
 * inserts a redemption ledger row. Caller is responsible for adjusting the
 * order's total_amount separately — this service just records the redemption
 * for audit + per-user tracking.
 */
export async function redeemVoucher(
  client: QueryClient,
  input: {
    voucherId: string;
    orderId: string;
    customerId?: string;
    discountApplied: number;
  }
) {
  // Atomic used_count increment guarded against over-redemption races.
  const update = await client.query(
    `UPDATE vouchers
        SET used_count = used_count + 1
      WHERE id = $1
        AND is_active = TRUE
        AND (max_uses IS NULL OR used_count < max_uses)`,
    [input.voucherId]
  );
  if (!update.rowCount) {
    throw new AppError(409, "VOUCHER_REDEEM_RACE", "Voucher tidak dapat di-redeem (mungkin habis)");
  }
  const redemptionId = randomUUID();
  await client.query(
    `INSERT INTO voucher_redemptions
       (id, voucher_id, order_id, customer_id, discount_applied)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      redemptionId,
      input.voucherId,
      input.orderId,
      input.customerId ?? null,
      input.discountApplied
    ]
  );
  return { redemptionId };
}
