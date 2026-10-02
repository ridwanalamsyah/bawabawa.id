import { callErpAsAdmin } from "@/lib/admin-bff";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const status = new URL(req.url).searchParams.get("status");
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  const result = await callErpAsAdmin<unknown>({ path: `/admin/orders/requests${qs}` });
  if (!result.ok) return result.response;
  return Response.json(result.data);
}
