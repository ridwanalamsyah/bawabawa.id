import { callErpAsAdmin } from "@/lib/admin-bff";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const result = await callErpAsAdmin<unknown>({
    path: `/admin/orders/requests/${encodeURIComponent(id)}/quote`,
    method: "POST",
    body,
  });
  if (!result.ok) return result.response;
  return Response.json(result.data);
}
