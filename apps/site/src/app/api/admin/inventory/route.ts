import { callErpAsAdmin } from "@/lib/admin-bff";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const qs = url.searchParams.toString();
  const result = await callErpAsAdmin<unknown[]>({
    path: `/inventory/items${qs ? `?${qs}` : ""}`,
  });
  if (!result.ok) return result.response;
  return Response.json(result.data);
}
