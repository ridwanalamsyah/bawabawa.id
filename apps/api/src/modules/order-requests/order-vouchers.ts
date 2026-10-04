import { AppError } from "../../common/errors/app-error";
type QueryClient = {
  query: <Row = any>(sql: string, params?: any[]) => Promise<{ rows: Row[]; rowCount: number }>;
};

/**
 * Promo codes on website orders. The discount only applies to our service
 * (jasa titip + ongkir), never to the shop price of the goods, and is
 * capped at that service total. Usage is counted when the order is placed
 * and released again if it is cancelled.
 */
export type VoucherSnapshot = {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  maxDiscount: number | null;
  minOrder: number;
  onePerCustomer: boolean;
};

type VoucherRow = {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: string | number;
  max_discount: string | number | null;
  min_order_amount: string | number | null;
  max_uses: number | null;
  used_count: number;
  per_user_limit: number | null;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
};

export function voucherDiscount(v: VoucherSnapshot | null | undefined, itemsTotal: number, serviceTotal: number): number {
  if (!v || itemsTotal < v.minOrder) return 0;
  let d = v.type === "percentage" ? (serviceTotal * v.value) / 100 : v.value;
  if (v.maxDiscount != null) d = Math.min(d, v.maxDiscount);
  return Math.max(0, Math.round(Math.min(d, serviceTotal)));
}

/** Validates a code for a new order; throws a customer-friendly message. */
export async function loadVoucher(
  qc: QueryClient,
  rawCode: string,
  ctx: { itemsTotal: number; phone?: string; now?: Date }
): Promise<{ id: string; snapshot: VoucherSnapshot }> {
  const code = rawCode.trim().toUpperCase();
  const { rows } = await qc.query<VoucherRow>("SELECT * FROM vouchers WHERE UPPER(code) = $1 LIMIT 1", [code]);
  const v = rows[0];
  const now = (ctx.now ?? new Date()).getTime();
  if (!v || !v.is_active) throw new AppError(422, "VOUCHER_INVALID", "Kode promo tidak ditemukan atau sudah tidak berlaku");
  if (v.starts_at && new Date(v.starts_at).getTime() > now) throw new AppError(422, "VOUCHER_NOT_YET_VALID", "Kode promo ini belum bisa dipakai");
  if (v.ends_at && new Date(v.ends_at).getTime() < now) throw new AppError(422, "VOUCHER_EXPIRED", "Kode promo ini sudah berakhir");
  if (v.max_uses != null && v.used_count >= v.max_uses) throw new AppError(422, "VOUCHER_EXHAUSTED", "Kuota kode promo ini sudah habis");
  const minOrder = Number(v.min_order_amount ?? 0);
  if (ctx.itemsTotal < minOrder) {
    throw new AppError(422, "VOUCHER_MIN_ORDER", `Kode ini berlaku untuk belanja minimal Rp${Math.round(minOrder).toLocaleString("id-ID")}`);
  }
  const onePerCustomer = v.per_user_limit != null;
  if (onePerCustomer && ctx.phone) {
    const used = await qc.query<{ n: string | number }>(
      `SELECT COUNT(*) AS n FROM order_requests
        WHERE voucher->>'code' = $1 AND customer_phone = $2 AND status <> 'cancelled'`,
      [v.code.toUpperCase(), ctx.phone]
    );
    if (Number(used.rows[0]?.n ?? 0) >= (v.per_user_limit ?? 1)) {
      throw new AppError(422, "VOUCHER_ALREADY_USED", "Kode promo ini sudah pernah kamu pakai");
    }
  }
  return {
    id: v.id,
    snapshot: {
      code: v.code.toUpperCase(),
      type: v.discount_type,
      value: Number(v.discount_value),
      maxDiscount: v.max_discount != null ? Number(v.max_discount) : null,
      minOrder,
      onePerCustomer
    }
  };
}

/** Counts one use; fails if the quota ran out in the meantime. */
export async function claimVoucher(qc: QueryClient, voucherId: string) {
  const res = await qc.query(
    `UPDATE vouchers SET used_count = used_count + 1
      WHERE id = $1 AND is_active = TRUE AND (max_uses IS NULL OR used_count < max_uses)`,
    [voucherId]
  );
  if (!res.rowCount) throw new AppError(422, "VOUCHER_EXHAUSTED", "Kuota kode promo ini sudah habis");
}

export async function releaseVoucher(qc: QueryClient, code: string) {
  await qc.query("UPDATE vouchers SET used_count = GREATEST(used_count - 1, 0) WHERE UPPER(code) = $1", [code.toUpperCase()]);
}
