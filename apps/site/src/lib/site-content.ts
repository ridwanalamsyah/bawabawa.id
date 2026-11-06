import { erp } from "@/lib/erp-client";
import {
  DEFAULT_HUB_SAMARINDA_STOCK,
  DEFAULT_LIVE_STATUS,
  DEFAULT_PAYMENT_INFO,
  DEFAULT_ZONE_RATES,
  type HubSamarindaStockItem,
  type LiveShopperStatusConfig,
  type PaymentInfoConfig,
  type ZoneRateConfig,
} from "@/lib/viral-bandung-data";

/**
 * Homepage copy, FAQ, Live Shopper Status, Payment Info (BCA/Mandiri/QRIS),
 * 3-Zone Delivery Rates, and Hub Samarinda Ready Stock edited in Admin.
 * Defaults keep the site complete when nothing is set or the ERP is unreachable.
 */
export const DEFAULT_HERO_WORDS = [
  "Roti Macan & Merak",
  "Bolu Pisang Tjilaki 9",
  "Rochi & Studio Bolen",
  "Kopi Makjay & Soes",
  "In Parfume & Basreng",
];
export const DEFAULT_HERO_SUBTITLE =
  "Tim kami antrekan langsung di toko viral Bandung — kirim Instant se-Bandung Raya, Sameday Travel ke Jawa Barat & Jakarta, atau Kloter ke Hub Samarinda.";

export type FaqItem = { q: string; a: string };

async function settings(): Promise<Array<{ key: string; value: unknown }>> {
  try {
    return await erp.cmsSettingsPublic();
  } catch {
    return [];
  }
}

const str = (v: unknown, max: number) =>
  typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;

export async function getHomepageContent(): Promise<{ words: string[]; subtitle: string }> {
  const row = (await settings()).find((s) => s.key === "homepage")?.value as
    | Record<string, unknown>
    | undefined;
  const words = Array.isArray(row?.heroWords)
    ? (row!.heroWords as unknown[])
        .map((w) => str(w, 32))
        .filter((w): w is string => !!w)
        .slice(0, 5)
    : [];
  return {
    words: words.length >= 2 ? words : DEFAULT_HERO_WORDS,
    subtitle: str(row?.heroSubtitle, 220) ?? DEFAULT_HERO_SUBTITLE,
  };
}

export async function getFaq(fallback: FaqItem[]): Promise<FaqItem[]> {
  const row = (await settings()).find((s) => s.key === "faq")?.value as { items?: unknown } | undefined;
  const items = Array.isArray(row?.items)
    ? (row!.items as Array<Record<string, unknown>>)
        .map((i) => ({ q: str(i?.q, 200), a: str(i?.a, 1200) }))
        .filter((i): i is FaqItem => !!i.q && !!i.a)
    : [];
  return items.length ? items : fallback;
}

export async function getLiveShopperStatus(): Promise<LiveShopperStatusConfig> {
  const row = (await settings()).find((s) => s.key === "live_status")?.value as
    | Partial<LiveShopperStatusConfig>
    | undefined;
  if (!row || typeof row !== "object") return DEFAULT_LIVE_STATUS;
  return {
    active: typeof row.active === "boolean" ? row.active : DEFAULT_LIVE_STATUS.active,
    headline: str(row.headline, 200) ?? DEFAULT_LIVE_STATUS.headline,
    currentLocation: str(row.currentLocation, 140) ?? DEFAULT_LIVE_STATUS.currentLocation,
    nextZoneCutoff: str(row.nextZoneCutoff, 180) ?? DEFAULT_LIVE_STATUS.nextZoneCutoff,
    hubSamarindaStatus: str(row.hubSamarindaStatus, 180) ?? DEFAULT_LIVE_STATUS.hubSamarindaStatus,
  };
}

export async function getPaymentInfo(): Promise<PaymentInfoConfig> {
  const row = (await settings()).find((s) => s.key === "payment_info")?.value as
    | Partial<PaymentInfoConfig>
    | undefined;
  if (!row || typeof row !== "object") return DEFAULT_PAYMENT_INFO;
  return {
    bcaNumber: str(row.bcaNumber, 60) ?? DEFAULT_PAYMENT_INFO.bcaNumber,
    bcaHolder: str(row.bcaHolder, 80) ?? DEFAULT_PAYMENT_INFO.bcaHolder,
    mandiriNumber: str(row.mandiriNumber, 60) ?? DEFAULT_PAYMENT_INFO.mandiriNumber,
    mandiriHolder: str(row.mandiriHolder, 80) ?? DEFAULT_PAYMENT_INFO.mandiriHolder,
    seabankNumber: str(row.seabankNumber, 60) ?? DEFAULT_PAYMENT_INFO.seabankNumber,
    seabankHolder: str(row.seabankHolder, 80) ?? DEFAULT_PAYMENT_INFO.seabankHolder,
    qrisMerchantName: str(row.qrisMerchantName, 100) ?? DEFAULT_PAYMENT_INFO.qrisMerchantName,
    qrisNmid: str(row.qrisNmid, 60) ?? DEFAULT_PAYMENT_INFO.qrisNmid,
    qrisImageUrl: str(row.qrisImageUrl, 500) ?? DEFAULT_PAYMENT_INFO.qrisImageUrl,
    whatsappAdmin: str(row.whatsappAdmin, 30) ?? DEFAULT_PAYMENT_INFO.whatsappAdmin,
    whatsappHubSamarinda: str(row.whatsappHubSamarinda, 30) ?? DEFAULT_PAYMENT_INFO.whatsappHubSamarinda,
    paymentNote: str(row.paymentNote, 300) ?? DEFAULT_PAYMENT_INFO.paymentNote,
  };
}

export async function getZoneRates(): Promise<ZoneRateConfig[]> {
  const row = (await settings()).find((s) => s.key === "zone_rates")?.value as
    | { zones?: ZoneRateConfig[] }
    | undefined;
  if (Array.isArray(row?.zones) && row.zones.length >= 2) {
    return row.zones;
  }
  return DEFAULT_ZONE_RATES;
}

export async function getHubSamarindaStock(): Promise<HubSamarindaStockItem[]> {
  const row = (await settings()).find((s) => s.key === "hub_samarinda_stock")?.value as
    | { items?: HubSamarindaStockItem[] }
    | undefined;
  if (Array.isArray(row?.items) && row.items.length > 0) {
    return row.items;
  }
  return DEFAULT_HUB_SAMARINDA_STOCK;
}
