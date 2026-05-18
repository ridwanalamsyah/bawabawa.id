import { callErpAsAdmin } from "@/lib/admin-bff";

type Branch = { id: string; code: string; name: string };

export async function GET() {
  const result = await callErpAsAdmin<Branch[]>({ path: "/branches" });
  if (!result.ok) return result.response;
  return Response.json(result.data);
}
