import { customers } from "@/lib/mock/customers";
import { erpSafe } from "@/lib/erp-client";

export async function GET() {
  const erp = await erpSafe<unknown[]>({ path: "/crm/contacts", timeoutMs: 3000 });
  if (erp.ok && Array.isArray(erp.data)) {
    return Response.json({ data: erp.data, total: erp.data.length, source: "erp" });
  }
  return Response.json({ data: customers, total: customers.length, source: "fallback" });
}
