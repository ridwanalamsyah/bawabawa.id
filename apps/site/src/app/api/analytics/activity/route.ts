import { erpSafe } from "@/lib/erp-client";

type ErpActivityItem = {
  id: string;
  text: string;
  status: string;
  at: string;
};

/**
 * Anonymized recent activity feed proxied from the ERP. The ERP returns
 * the last N orders with the customer's name already masked to first name
 * + last initial, so this route just passes the payload through.
 *
 * Empty array when no data — the UI renders an honest empty state.
 */
export async function GET() {
  const erp = await erpSafe<ErpActivityItem[]>({
    path: "/reports/activity",
    timeoutMs: 4000,
  });
  if (erp.ok && Array.isArray(erp.data)) {
    return Response.json({ items: erp.data, source: "erp" });
  }
  return Response.json({ items: [], source: "fallback" });
}
