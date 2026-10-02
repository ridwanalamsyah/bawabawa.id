/**
 * Server-side jastip pricing. Mirrors `apps/site/src/lib/pricing.ts` — keep
 * the constants in sync. The site shows this as an *estimate*; the binding
 * price is the quote the team sends (or the fixed catalog price).
 *
 * Two corrections versus the original site formula:
 *   1. PPN is OFF unless `PPN_ENABLED=true`, because the business is not yet
 *      a PKP. When enabled it applies to the service portion (jastip fee +
 *      shipping), not to the price of the goods bought on the customer's
 *      behalf.
 *   2. `recommendTier` picks the cheaper service for the cart's weight, so a
 *      1 kg order is no longer defaulted to the 200rb flat cargo slot.
 */

export type TierId = "fast" | "batch";

export const FAST_TRACK_PER_KG = 43_000;
export const BATCH_FLAT_FEE = 200_000;
export const BATCH_CAPACITY_KG = 50;
export const PPN_RATE = 0.11;
export const JASTIP_FEE_RATE = 0.08;
export const JASTIP_FEE_MIN = 20_000;

export function ppnEnabled(): boolean {
  const raw = process.env.PPN_ENABLED;
  return raw === "true" || raw === "1";
}

export function billingWeight(actualKg: number): number {
  return Math.max(0.5, Math.ceil(actualKg * 2) / 2);
}

export function shippingFeeFor(tier: TierId, totalKg: number): number {
  const kg = billingWeight(totalKg);
  if (tier === "fast") return FAST_TRACK_PER_KG * kg;
  return kg <= BATCH_CAPACITY_KG
    ? BATCH_FLAT_FEE
    : BATCH_FLAT_FEE + FAST_TRACK_PER_KG * (kg - BATCH_CAPACITY_KG);
}

export function recommendTier(totalKg: number): TierId {
  return shippingFeeFor("fast", totalKg) <= shippingFeeFor("batch", totalKg) ? "fast" : "batch";
}

export type PricingBreakdown = {
  itemsTotal: number;
  jastipFee: number;
  shippingFee: number;
  ppn: number;
  total: number;
  billingKg: number;
  tier: TierId;
};

export function computePricing(input: {
  itemsTotal: number;
  totalKg: number;
  tier: TierId;
  withPpn?: boolean;
}): PricingBreakdown {
  const itemsTotal = Math.max(0, Math.round(input.itemsTotal));
  const jastipFee = itemsTotal > 0 ? Math.max(JASTIP_FEE_MIN, Math.round(itemsTotal * JASTIP_FEE_RATE)) : 0;
  const shippingFee = shippingFeeFor(input.tier, input.totalKg);
  const withPpn = input.withPpn ?? ppnEnabled();
  const ppn = withPpn ? Math.round((jastipFee + shippingFee) * PPN_RATE) : 0;
  return {
    itemsTotal,
    jastipFee,
    shippingFee,
    ppn,
    total: itemsTotal + jastipFee + shippingFee + ppn,
    billingKg: billingWeight(input.totalKg),
    tier: input.tier
  };
}
