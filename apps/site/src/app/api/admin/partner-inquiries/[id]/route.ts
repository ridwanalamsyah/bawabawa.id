import { callErpAsAdmin } from "@/lib/admin-bff";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const result = await callErpAsAdmin<unknown>({
    path: `/admin/partner-inquiries/${encodeURIComponent(id)}`,
    method: "PATCH",
    body,
  });
  if (!result.ok) return result.response;
  return Response.json(result.data);
}
