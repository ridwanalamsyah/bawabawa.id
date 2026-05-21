import { callErpAsAdmin } from "@/lib/admin-bff";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const result = await callErpAsAdmin<{ id: string }>({
    path: `/admin/trips/${encodeURIComponent(id)}`,
    method: "PATCH",
    body,
  });
  if (!result.ok) return result.response;
  return Response.json(result.data);
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const result = await callErpAsAdmin<null>({
    path: `/admin/trips/${encodeURIComponent(id)}`,
    method: "DELETE",
  });
  if (!result.ok) return result.response;
  return new Response(null, { status: 204 });
}
