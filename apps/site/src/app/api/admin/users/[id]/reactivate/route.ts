import { callErpAsAdmin } from "@/lib/admin-bff";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await callErpAsAdmin<unknown>({
    path: `/admin/users/${encodeURIComponent(id)}/reactivate`,
    method: "POST",
    body: {},
  });
  if (!result.ok) return result.response;
  return Response.json({ data: result.data });
}
