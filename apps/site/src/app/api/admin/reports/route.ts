import { callErpAsAdmin } from "@/lib/admin-bff";

export const dynamic = "force-dynamic";

/** GET /api/admin/reports — CSV export of real orders (staff with reports:export). */
export async function GET() {
  const result = await callErpAsAdmin<string>({ path: "/reports/sales.csv" });
  if (!result.ok) return result.response;
  return new Response(typeof result.data === "string" ? result.data : "", {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="bawabawa-sales-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
