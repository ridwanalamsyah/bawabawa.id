import { callErpAsAdmin } from "@/lib/admin-bff";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await callErpAsAdmin<unknown[]>({ path: "/admin/partner-inquiries" });
  if (!result.ok) return result.response;
  return Response.json(result.data);
}
