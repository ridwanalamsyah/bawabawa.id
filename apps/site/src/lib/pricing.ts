/**
 * Shared pricing logic for the /request flow.
 *
 * Two shipping tiers (per Bawabawa.id operations):
 *
 * 1. **Reguler** — pengiriman ekspedisi reguler (JNE / SiCepat / J&T),
 *    3–4 hari kerja Bandung→Samarinda. Tarif Rp 43.000 / kg, dibulatkan
 *    ke atas per 0.5 kg.
 *
 * 2. **Kargo** — gabungan dengan trip kargo terjadwal (min. 50kg per
 *    container). Customer membayar flat Rp 200.000 untuk slot ≤50kg;
 *    di atas 50kg, ditagih per-kg dengan tarif reguler. Estimasi 10
 *    hari kerja.
 *
 * Plus PPN 11% (PMK 131/2024). Jastip fee tetap 8% dari subtotal barang,
 * dengan minimum Rp 20.000.
 */

// TierId values are stable across the codebase: `fast` = the faster
// reguler-ekspedisi tier; `batch` = the cheaper kargo-sharing tier.
// We keep the keys to avoid migrating stored orders; only labels & ETA
// strings shown to users were corrected.
export type TierId = "fast" | "batch";

export const TIERS: Record<TierId, {
  id: TierId;
  label: string;
  tagline: string;
  eta: string;
}> = {
  fast: {
    id: "fast",
    label: "Reguler",
    tagline: "Ekspedisi reguler 43rb/kg, sampai 3–4 hari kerja.",
    eta: "3–4 hari kerja",
  },
  batch: {
    id: "batch",
    label: "Kargo",
    tagline: "Gabung kargo terjadwal, flat 200rb untuk slot ≤50kg.",
    eta: "10 hari kerja",
  },
};

export const FAST_TRACK_PER_KG = 43_000;
export const BATCH_FLAT_FEE = 200_000;
export const BATCH_CAPACITY_KG = 50;
export const PPN_RATE = 0.11;
export const JASTIP_FEE_RATE = 0.08;
export const JASTIP_FEE_MIN = 20_000;

/**
 * Average per-unit weight in kg by category. Used to auto-estimate
 * shipping weight when the customer doesn't know the exact weight.
 * Values are intentionally conservative (rounded up) so the quote
 * doesn't undershoot real cost.
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

/** Round up to nearest 0.5 kg for billing purposes. */
export function billingWeight(actualKg: number): number {
  return Math.ceil(actualKg * 2) / 2;
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
  subtotal: number;
  ppn: number;
  total: number;
  billingKg: number;
  tier: TierId;
};

export function computePricing({ itemsTotal, totalKg, tier }: PricingInput): PricingBreakdown {
  const billingKg = billingWeight(totalKg);
  const jastipFee = Math.max(JASTIP_FEE_MIN, Math.round(itemsTotal * JASTIP_FEE_RATE));

  let shippingFee: number;
  if (tier === "fast") {
    shippingFee = FAST_TRACK_PER_KG * billingKg;
  } else {
    // Kargo: flat for ≤50kg, per-kg reguler rate beyond that.
    shippingFee =
      billingKg <= BATCH_CAPACITY_KG
        ? BATCH_FLAT_FEE
        : BATCH_FLAT_FEE + FAST_TRACK_PER_KG * (billingKg - BATCH_CAPACITY_KG);
  }

  const subtotal = itemsTotal + jastipFee + shippingFee;
  const ppn = Math.round(subtotal * PPN_RATE);
  const total = subtotal + ppn;

  return {
    itemsTotal,
    jastipFee,
    shippingFee,
    subtotal,
    ppn,
    total,
    billingKg,
    tier,
  };
}
