import { callErpAsCustomer } from "@/lib/customer-bff";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await callErpAsCustomer<unknown[]>({ path: "/order-requests/mine" });
  return Response.json({ data: data ?? [] });
}
