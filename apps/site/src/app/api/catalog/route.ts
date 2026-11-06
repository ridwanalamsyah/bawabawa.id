import { erpSafe } from "@/lib/erp-client";
import { VIRAL_BANDUNG_CATALOG } from "@/lib/viral-bandung-data";

export type CatalogProduct = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  originStore: string | null;
  price: number;
  weightKg: number | null;
  category: string | null;
  variants: string[];
  tripId: string | null;
  shelfLife?: string;
  allowedZones?: string[];
  isViralBadge?: string;
  readyAtSamarinda?: boolean;
};

/**
 * Public catalog endpoint.
 * Returns database-backed catalog products when present, and falls back to the
 * seeded Viral Bandung catalog (`VIRAL_BANDUNG_CATALOG`) if the DB has not been
 * migrated yet or is running on a fresh local SQLite instance.
 */
export async function GET(req: Request) {
  const tripId = new URL(req.url).searchParams.get("tripId");
  const qs = tripId ? `?tripId=${encodeURIComponent(tripId)}` : "";
  const erp = await erpSafe<CatalogProduct[]>({
    path: `/catalog${qs}`,
    timeoutMs: 5000,
    cache: "force-cache",
    next: { revalidate: 60, tags: ["inventory", "catalog"] },
  });

  if (erp.ok && Array.isArray(erp.data) && erp.data.length > 0) {
    return Response.json({ data: erp.data, source: erp.source });
  }

  return Response.json({
    data: VIRAL_BANDUNG_CATALOG,
    source: "seed-viral-bandung",
  });
}
