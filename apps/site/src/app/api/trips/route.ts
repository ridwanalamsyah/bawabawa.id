import { erpSafe } from "@/lib/erp-client";

/**
 * Public-facing Open Trip list. Calls the ERP `/trips` endpoint (which itself
 * returns only `is_published = true AND status != 'closed'` rows), so the
 * marketing /open-trip page and /request flow both see exactly what the admin
 * has explicitly published. No mock-data fallback — if the API is unreachable
 * we return an empty list so the UI shows its empty-state instead of
 * mock trip codes that don't actually exist.
 */
export async function GET() {
  const erp = await erpSafe<unknown[]>({
    path: "/trips",
    timeoutMs: 3000,
    cache: "no-store",
  });
  if (erp.ok && Array.isArray(erp.data)) {
    return Response.json({ success: true, data: erp.data });
  }
  return Response.json({ success: true, data: [] });
}
