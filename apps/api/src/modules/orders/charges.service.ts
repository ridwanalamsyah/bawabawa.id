import { AppError } from "../../common/errors/app-error";

type QueryClient = {
  query: <Row = any>(sql: string, params?: any[]) => Promise<{ rows: Row[]; rowCount: number }>;
};

/**
 * Default Indonesian VAT rate (PPN 11% since 2022). Exposed so the route
 * layer can use it when the caller doesn't supply an explicit rate.
 */
export const DEFAULT_PPN_RATE = 0.11;

export type ComputeTotalsInput = {
  subtotal: number;
  discountAmount?: number;
  serviceChargeRate?: number;
  taxRate?: number;
  /**
   * When true, the `subtotal` already includes tax (harga sudah termasuk
   * PPN) and we back-solve `tax_amount` out of it rather than stacking it
   * on top. Service charge is still applied on the net (pre-tax) basis.
   */
  taxInclusive?: boolean;
};

export type ComputeTotalsResult = {
  subtotal: number;
  discountAmount: number;
  serviceChargeAmount: number;
  taxableBase: number;
  taxAmount: number;
  totalAmount: number;
  taxRate: number;
  serviceChargeRate: number;
  taxInclusive: boolean;
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Compute all order total fields from subtotal + optional discount + optional
 * service-charge rate + optional tax rate. Pure function — no DB access,
 * no side effects. Contract:
 *
 *   post_discount       = subtotal - discount
 *   service_charge_amt  = round(post_discount * service_charge_rate)
 *   taxable_base        = post_discount + service_charge_amt
 *   tax_amount          = round(taxable_base * tax_rate)      (tax exclusive)
 *                       = round(taxable_base - taxable_base / (1+tax_rate))  (tax inclusive)
 *   total_amount        = taxable_base + tax_amount            (tax exclusive)
 *                       = taxable_base                          (tax inclusive, tax already inside)
 *
 * All monetary outputs are rounded to 2 decimal places.
 */
export function computeTotals(input: ComputeTotalsInput): ComputeTotalsResult {
  if (!Number.isFinite(input.subtotal) || input.subtotal < 0) {
    throw new AppError(422, "INVALID_SUBTOTAL", "Subtotal harus >= 0");
  }
  const discountAmount = Math.max(0, input.discountAmount ?? 0);
  if (discountAmount > input.subtotal) {
    throw new AppError(
      422,
      "DISCOUNT_EXCEEDS_SUBTOTAL",
      "Discount tidak boleh melebihi subtotal"
    );
  }
  const serviceChargeRate = Math.max(0, input.serviceChargeRate ?? 0);
  const taxRate = Math.max(0, input.taxRate ?? 0);
  if (serviceChargeRate > 1) {
    throw new AppError(422, "INVALID_SERVICE_RATE", "Service rate harus 0-1 (contoh 0.05)");
  }
  if (taxRate > 1) {
    throw new AppError(422, "INVALID_TAX_RATE", "Tax rate harus 0-1 (contoh 0.11)");
  }

  const postDiscount = round2(input.subtotal - discountAmount);
  const serviceChargeAmount = round2(postDiscount * serviceChargeRate);
  const taxableBase = round2(postDiscount + serviceChargeAmount);

  let taxAmount: number;
  let totalAmount: number;
  const taxInclusive = Boolean(input.taxInclusive);
  if (taxInclusive && taxRate > 0) {
    // Back-solve: taxableBase already contains the tax, so separate it out.
    const pretax = round2(taxableBase / (1 + taxRate));
    taxAmount = round2(taxableBase - pretax);
    totalAmount = taxableBase;
  } else {
    taxAmount = round2(taxableBase * taxRate);
    totalAmount = round2(taxableBase + taxAmount);
  }

  return {
    subtotal: round2(input.subtotal),
    discountAmount: round2(discountAmount),
    serviceChargeAmount,
    taxableBase,
    taxAmount,
    totalAmount,
    taxRate,
    serviceChargeRate,
    taxInclusive
  };
}

export type ApplyChargesInput = {
  orderId: string;
  serviceChargeRate?: number;
  taxRate?: number;
  taxInclusive?: boolean;
};

/**
 * Apply tax + service charge to an existing order atomically. Locks the
 * order row, re-reads `subtotal` (or `total_amount` if subtotal is zero),
 * plus any existing `discount_amount`, computes the full breakdown, and
 * writes back all charge columns + the new `total_amount`.
 */
export async function applyCharges(client: QueryClient, input: ApplyChargesInput) {
  const row = await client.query<{
    subtotal: string;
    total_amount: string;
    discount_amount: string;
  }>(
    `SELECT subtotal, total_amount, discount_amount
       FROM orders WHERE id = $1 FOR UPDATE`,
    [input.orderId]
  );
  if (!row.rowCount) {
    throw new AppError(404, "ORDER_NOT_FOUND", "Order tidak ditemukan");
  }

  // subtotal may be 0 on legacy orders predating migration 011 — fall back
  // to total_amount and treat it as the pre-charge subtotal.
  const storedSubtotal = Number(row.rows[0].subtotal);
  const subtotal = storedSubtotal > 0 ? storedSubtotal : Number(row.rows[0].total_amount);
  const discountAmount = Number(row.rows[0].discount_amount);

  const totals = computeTotals({
    subtotal,
    discountAmount,
    serviceChargeRate: input.serviceChargeRate,
    taxRate: input.taxRate,
    taxInclusive: input.taxInclusive
  });

  await client.query(
    `UPDATE orders
        SET subtotal = $1,
            discount_amount = $2,
            service_charge_amount = $3,
            service_charge_rate = $4,
            tax_amount = $5,
            tax_rate = $6,
            tax_inclusive = $7,
            total_amount = $8
      WHERE id = $9`,
    [
      totals.subtotal,
      totals.discountAmount,
      totals.serviceChargeAmount,
      totals.serviceChargeRate,
      totals.taxAmount,
      totals.taxRate,
      totals.taxInclusive,
      totals.totalAmount,
      input.orderId
    ]
  );

  return { orderId: input.orderId, ...totals };
}
