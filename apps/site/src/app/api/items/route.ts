import { erpSafe } from "@/lib/erp-client";

/**
 * Items / inventory listing for the public site.
 *
 * The ERP source of truth lives in `apps/api/src/modules/inventory`.
 * Adding an item there automatically appears here once the ERP fires the
 * `inventory.item_upserted` webhook (handled by /api/webhooks/erp), which
 * invalidates the `inventory` cache tag and re-renders any RSC that depends
 * on it.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const search = new URLSearchParams();
  for (const key of ["q", "category", "page", "limit", "active"]) {
    const value = url.searchParams.get(key);
    if (value !== null) search.set(key, value);
  }
  const query = search.toString() ? `?${search.toString()}` : "";

  const erp = await erpSafe<unknown[]>({
    path: `/inventory/items${query}`,
    timeoutMs: 4000,
    next: { revalidate: 60, tags: ["inventory", "items"] },
  });
  if (erp.ok && Array.isArray(erp.data)) {
    return Response.json({ data: erp.data, total: erp.data.length, source: "erp" });
  }

  return Response.json({ data: [], total: 0, source: "fallback", error: erp.ok ? null : erp.error });
}
