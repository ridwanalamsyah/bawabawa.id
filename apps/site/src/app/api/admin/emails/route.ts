import { callErpAsAdmin } from "@/lib/admin-bff";

export async function GET() {
  const result = await callErpAsAdmin<unknown[]>({ path: "/emails" });
  if (!result.ok) return result.response;
  return Response.json(result.data);
}
