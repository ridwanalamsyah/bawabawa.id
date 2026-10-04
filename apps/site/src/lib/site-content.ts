import { erp } from "@/lib/erp-client";

/**
 * Homepage copy and FAQ that staff edit in Admin → Kontak & tampilan
 * (CMS settings `homepage` and `faq`). Defaults keep the site complete when
 * nothing is set or the ERP is unreachable.
 */
export const DEFAULT_HERO_WORDS = ["sepatu lokal", "skincare", "oleh-oleh", "baju distro", "buku"];
export const DEFAULT_HERO_SUBTITLE = "Kami cek harga di toko, kamu bayar setelah setuju.";

export type FaqItem = { q: string; a: string };

async function settings(): Promise<Array<{ key: string; value: unknown }>> {
  try {
    return await erp.cmsSettingsPublic();
  } catch {
    return [];
  }
}

const str = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);

export async function getHomepageContent(): Promise<{ words: string[]; subtitle: string }> {
  const row = (await settings()).find((s) => s.key === "homepage")?.value as Record<string, unknown> | undefined;
  const words = Array.isArray(row?.heroWords)
    ? (row!.heroWords as unknown[]).map((w) => str(w, 24)).filter((w): w is string => !!w).slice(0, 5)
    : [];
  return {
    words: words.length >= 2 ? words : DEFAULT_HERO_WORDS,
    subtitle: str(row?.heroSubtitle, 140) ?? DEFAULT_HERO_SUBTITLE,
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
