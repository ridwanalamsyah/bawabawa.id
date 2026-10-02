import { erpSafe } from "@/lib/erp-client";

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
};

/** Public catalog. An empty list (ERP down or nothing listed) is a valid state. */
export async function GET(req: Request) {
  const tripId = new URL(req.url).searchParams.get("tripId");
  const qs = tripId ? `?tripId=${encodeURIComponent(tripId)}` : "";
  const erp = await erpSafe<CatalogProduct[]>({
    path: `/catalog${qs}`,
    timeoutMs: 5000,
    cache: "force-cache",
    next: { revalidate: 60, tags: ["inventory", "catalog"] },
  });
  return Response.json({ data: erp.ok && Array.isArray(erp.data) ? erp.data : [], source: erp.source });
}
