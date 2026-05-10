import { trips } from "@/lib/mock/trips";
import { erpSafe } from "@/lib/erp-client";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const status = url.searchParams.get("status");

  // Open Trip schedules live alongside shipping in the ERP. We attempt the
  // ERP first; if it isn't available we fall back to the bundled mock dataset
  // so the Open Trip page keeps rendering for marketing previews.
  const search = new URLSearchParams();
  if (status) search.set("status", status);
  const query = search.toString() ? `?${search.toString()}` : "";
  const erp = await erpSafe<unknown[]>({
    path: `/shipping/trips${query}`,
    timeoutMs: 3000,
  });
  if (erp.ok && Array.isArray(erp.data)) {
    return Response.json({ data: erp.data, total: erp.data.length, source: "erp" });
  }

  const filtered = status ? trips.filter((t) => t.status === status) : trips;
  return Response.json({ data: filtered, total: filtered.length, source: "fallback" });
}
