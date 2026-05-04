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
   * on top. Service charge is applied on the *net* (pre-tax) post-discount
   * amount in this mode, then re-added to the tax-inclusive total — see the
   * formulas in the docstring below.
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
 *   tax-exclusive (default):
 *     post_discount       = subtotal - discount
 *     service_charge_amt  = round(post_discount * service_charge_rate)
 *     taxable_base        = post_discount + service_charge_amt
 *     tax_amount          = round(taxable_base * tax_rate)
 *     total_amount        = taxable_base + tax_amount
 *
 *   tax-inclusive (subtotal already contains PPN):
 *     post_discount_gross = subtotal - discount
 *     net_post_discount   = round(post_discount_gross / (1 + tax_rate))
 *     service_charge_amt  = round(net_post_discount * service_charge_rate)  ← on NET
 *     net_taxable_base    = net_post_discount + service_charge_amt
 *     tax_amount          = round(net_taxable_base * tax_rate)
 *     total_amount        = round(net_taxable_base + tax_amount)
 *     (taxable_base in the result is the gross-equivalent for display.)
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

  const taxInclusive = Boolean(input.taxInclusive);
  const postDiscountGross = round2(input.subtotal - discountAmount);

  // Compute service charge on the NET (pre-tax) post-discount basis so the
  // tax-inclusive flag doesn't double-count tax inside the service charge.
  // For tax-exclusive mode netPostDiscount === postDiscountGross.
  const netPostDiscount =
    taxInclusive && taxRate > 0
      ? round2(postDiscountGross / (1 + taxRate))
      : postDiscountGross;
  const serviceChargeAmount = round2(netPostDiscount * serviceChargeRate);
  const netTaxableBase = round2(netPostDiscount + serviceChargeAmount);

  let taxAmount: number;
  let totalAmount: number;
  let taxableBase: number;
  if (taxInclusive && taxRate > 0) {
    taxAmount = round2(netTaxableBase * taxRate);
    totalAmount = round2(netTaxableBase + taxAmount);
    // Expose the gross-equivalent base for display parity with exclusive mode.
    taxableBase = totalAmount;
  } else {
    taxableBase = netTaxableBase;
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
 *
 * Optional rate fields are *partial-update* friendly: omitting a field
 * preserves the value already stored on the order. Pass `0` (or `false`
 * for taxInclusive) to explicitly clear a previously applied rate.
 */
export async function applyCharges(client: QueryClient, input: ApplyChargesInput) {
  const row = await client.query<{
    subtotal: string;
    total_amount: string;
    discount_amount: string;
    service_charge_rate: string | number | null;
    tax_rate: string | number | null;
    tax_inclusive: boolean | number | null;
  }>(
    `SELECT subtotal, total_amount, discount_amount,
            service_charge_rate, tax_rate, tax_inclusive
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

  // Preserve any previously-applied rates when the caller omits them.
  // Explicit `0` / `false` from the caller still wins (clearing semantics).
  const storedServiceRate = Number(row.rows[0].service_charge_rate ?? 0);
  const storedTaxRate = Number(row.rows[0].tax_rate ?? 0);
  const storedTaxInclusive = Boolean(row.rows[0].tax_inclusive);

  const totals = computeTotals({
    subtotal,
    discountAmount,
    serviceChargeRate: input.serviceChargeRate ?? storedServiceRate,
    taxRate: input.taxRate ?? storedTaxRate,
    taxInclusive: input.taxInclusive ?? storedTaxInclusive
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
