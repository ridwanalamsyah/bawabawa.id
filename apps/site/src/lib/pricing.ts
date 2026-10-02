/**
 * Bawabawa jastip pricing — client-side ESTIMATE. The binding price is the
 * quote the team sends (free-form requests) or the fixed catalog price; the
 * ERP recomputes this server-side (`apps/api/src/modules/order-requests/
 * pricing.ts`), so keep the constants in sync.
 *
 * Two services:
 *  1. **Reguler** (`fast`) — ekspedisi reguler (JNE / SiCepat / J&T),
 *     Rp43.000/kg, 3–4 hari kerja.
 *  2. **Kargo** (`batch`) — slot di Open Trip terjadwal, flat Rp200.000
 *     untuk ≤50 kg, ~10 hari kerja. Only cheaper from ≈5 kg upward, which is
 *     why `recommendTier` picks the service for the customer.
 *
 * Jastip fee: 8% of the goods (min Rp20.000). PPN is off unless
 * NEXT_PUBLIC_PPN_ENABLED=true and, when on, applies to the service portion
 * (jastip fee + ongkir) — never to the price of the goods themselves.
 */

// `fast` / `batch` keys kept for stored-order compatibility.
// `air` = Kilat: kargo udara Bandung (Husein) → Balikpapan, lanjut darat ke
// Samarinda. Shown only when NEXT_PUBLIC_KILAT_PER_KG is set.
export type TierId = "fast" | "batch" | "air";

export const TIERS: Record<TierId, {
  id: TierId;
  label: string;
  tagline: string;
  eta: string;
}> = {
  fast: {
    id: "fast",
    label: "Reguler",
    tagline: "Ekspedisi reguler Rp43rb/kg, sampai 3–4 hari kerja.",
    eta: "3–4 hari kerja",
  },
  batch: {
    id: "batch",
    label: "Kargo",
    tagline: "Gabung Open Trip terjadwal, flat Rp200rb untuk ≤50 kg.",
    eta: "±10 hari kerja",
  },
  air: {
    id: "air",
    label: "Kilat",
    tagline: "Pesawat Bandung → Balikpapan, lanjut darat ke Samarinda.",
    eta: "1–2 hari kerja",
  },
};

const kilatPerKg = Number(process.env.NEXT_PUBLIC_KILAT_PER_KG);
const kilatMinKg = Number(process.env.NEXT_PUBLIC_KILAT_MIN_KG);
export const KILAT =
  Number.isFinite(kilatPerKg) && kilatPerKg > 0
    ? { perKg: kilatPerKg, minKg: Number.isFinite(kilatMinKg) && kilatMinKg > 0 ? kilatMinKg : 1 }
    : null;

/** Lithium batteries can't fly. Keep in sync with the API. */
export const KILAT_BLOCKED_CATEGORIES = ["Elektronik"];

/** Tiers offered to customers, in display order. */
export function availableTiers(): TierId[] {
  return KILAT ? ["fast", "batch", "air"] : ["fast", "batch"];
}

export const FAST_TRACK_PER_KG = 43_000;
export const BATCH_FLAT_FEE = 200_000;
export const BATCH_CAPACITY_KG = 50;
export const PPN_RATE = 0.11;
export const JASTIP_FEE_RATE = 0.08;
export const JASTIP_FEE_MIN = 20_000;

export const PPN_ENABLED = process.env.NEXT_PUBLIC_PPN_ENABLED === "true";

/**
 * Average per-unit weight in kg by category, used when the customer doesn't
 * know the weight. Rounded up so the estimate doesn't undershoot.
 */
export const CATEGORY_WEIGHTS_KG: Record<string, number> = {
  Fashion: 0.4,
  Skincare: 0.3,
  "Snack Bandung": 0.6,
  Sepatu: 1.2,
  Tas: 0.8,
  Hijab: 0.2,
  Elektronik: 1.0,
  Aksesoris: 0.15,
  Lainnya: 0.5,
};

export function estimateItemWeightKg(category: string, qty: number): number {
  const per = CATEGORY_WEIGHTS_KG[category] ?? CATEGORY_WEIGHTS_KG.Lainnya;
  return Math.max(0.1, per * Math.max(1, qty));
}

/** Round up to the nearest 0.5 kg (minimum 0.5 kg) for billing. */
export function billingWeight(actualKg: number): number {
  return Math.max(0.5, Math.ceil(actualKg * 2) / 2);
}

export function shippingFeeFor(tier: TierId, totalKg: number): number {
  const kg = billingWeight(totalKg);
  if (tier === "fast") return FAST_TRACK_PER_KG * kg;
  if (tier === "air") return KILAT ? KILAT.perKg * Math.max(kg, KILAT.minKg) : FAST_TRACK_PER_KG * kg;
  return kg <= BATCH_CAPACITY_KG
    ? BATCH_FLAT_FEE
    : BATCH_FLAT_FEE + FAST_TRACK_PER_KG * (kg - BATCH_CAPACITY_KG);
}

/** The cheaper of Reguler vs Kargo (ties go to Reguler). Kilat is an opt-in upgrade. */
export function recommendTier(totalKg: number): TierId {
  return shippingFeeFor("fast", totalKg) <= shippingFeeFor("batch", totalKg) ? "fast" : "batch";
}

export type PricingInput = {
  itemsTotal: number;
  totalKg: number;
  tier: TierId;
};

export type PricingBreakdown = {
  itemsTotal: number;
  jastipFee: number;
  shippingFee: number;
  ppn: number;
  total: number;
  billingKg: number;
  tier: TierId;
};

export function computePricing({ itemsTotal, totalKg, tier }: PricingInput): PricingBreakdown {
  const goods = Math.max(0, Math.round(itemsTotal));
  const jastipFee = goods > 0 ? Math.max(JASTIP_FEE_MIN, Math.round(goods * JASTIP_FEE_RATE)) : 0;
  const shippingFee = shippingFeeFor(tier, totalKg);
  const ppn = PPN_ENABLED ? Math.round((jastipFee + shippingFee) * PPN_RATE) : 0;
  return {
    itemsTotal: goods,
    jastipFee,
    shippingFee,
    ppn,
    total: goods + jastipFee + shippingFee + ppn,
    billingKg: billingWeight(totalKg),
    tier,
  };
}
