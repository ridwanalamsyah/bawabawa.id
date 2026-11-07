export type TierId = "fast" | "batch" | "air";

export const TIERS: Record<
  TierId,
  {
    id: TierId;
    label: string;
    tagline: string;
    eta: string;
  }
> = {
  air: {
    id: "air",
    label: "Bandung Instant",
    tagline: "Kurir instan Bandung Raya (Kota Bandung, Cimahi, Lembang, Hotel/Whoosh).",
    eta: "Hari ini (2–4 jam)",
  },
  fast: {
    id: "fast",
    label: "Travel Jabar & JKT",
    tagline: "Shuttle travel sameday (Cititrans/DayTrans/Arnes) ke Jakarta, Bodetabek & Jabar.",
    eta: "Sameday (4–8 jam)",
  },
  batch: {
    id: "batch",
    label: "Kloter Samarinda",
    tagline: "Kloter rutin Bandung → Hub Bawabawa Samarinda (pickup / kurir lokal).",
    eta: "Jadwal Open Trip",
  },
};

export const KILAT = { perKg: 18_000, minKg: 1 };

export const KILAT_BLOCKED_CATEGORIES: string[] = [];

export function availableTiers(): TierId[] {
  return ["air", "fast", "batch"];
}

export const FAST_TRACK_PER_KG = 35_000;
export const BATCH_FLAT_FEE = 45_000;
export const BATCH_CAPACITY_KG = 50;
export const PPN_RATE = 0.11;
export const JASTIP_FEE_RATE = 0.08;
export const JASTIP_FEE_MIN = 20_000;

export const PPN_ENABLED = process.env.NEXT_PUBLIC_PPN_ENABLED === "true";

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

export function billingWeight(actualKg: number): number {
  return Math.max(0.5, Math.ceil(actualKg * 2) / 2);
}

export function shippingFeeFor(tier: TierId, totalKg: number): number {
  const kg = billingWeight(totalKg);
  if (tier === "air") return KILAT.perKg * Math.max(1, Math.ceil(kg));
  if (tier === "fast") return FAST_TRACK_PER_KG * Math.max(1, Math.ceil(kg));
  return BATCH_FLAT_FEE * Math.max(1, Math.ceil(kg));
}

export function recommendTier(totalKg: number): TierId {
  void totalKg;
  return "fast";
}

export type PricingInput = {
  itemsTotal: number;
  totalKg: number;
  tier: TierId;
  discount?: number;
  voucherCode?: string | null;
};

export type PricingBreakdown = {
  itemsTotal: number;
  jastipFee: number;
  shippingFee: number;
  ppn: number;
  total: number;
  billingKg: number;
  tier: TierId;
  discount?: number;
  voucherCode?: string | null;
};

export type VoucherSnapshot = {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  maxDiscount: number | null;
  minOrder: number;
};

export function voucherDiscount(v: VoucherSnapshot | null, itemsTotal: number, serviceTotal: number): number {
  if (!v || itemsTotal < v.minOrder) return 0;
  let d = v.type === "percentage" ? (serviceTotal * v.value) / 100 : v.value;
  if (v.maxDiscount != null) d = Math.min(d, v.maxDiscount);
  return Math.max(0, Math.round(Math.min(d, serviceTotal)));
}

export function computePricing({ itemsTotal, totalKg, tier, discount: rawDiscount, voucherCode }: PricingInput): PricingBreakdown {
  const goods = Math.max(0, Math.round(itemsTotal));
  const jastipFee = goods > 0 ? Math.max(JASTIP_FEE_MIN, Math.round(goods * JASTIP_FEE_RATE)) : 0;
  const shippingFee = shippingFeeFor(tier, totalKg);
  const ppn = PPN_ENABLED ? Math.round((jastipFee + shippingFee) * PPN_RATE) : 0;
  const discount = Math.max(0, Math.min(Math.round(rawDiscount ?? 0), jastipFee + shippingFee));
  return {
    itemsTotal: goods,
    jastipFee,
    shippingFee,
    ppn,
    total: goods + jastipFee + shippingFee + ppn - discount,
    billingKg: billingWeight(totalKg),
    tier,
    ...(discount > 0 ? { discount, voucherCode: voucherCode ?? null } : {}),
  };
}
