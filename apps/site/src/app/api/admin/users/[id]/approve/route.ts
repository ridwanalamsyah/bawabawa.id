import { callErpAsAdmin } from "@/lib/admin-bff";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { division?: string };
  const result = await callErpAsAdmin<unknown>({
    path: `/admin/users/${encodeURIComponent(id)}/approve`,
    method: "POST",
    body: body.division ? { division: body.division } : {},
  });
  if (!result.ok) return result.response;
  return Response.json({ data: result.data });
}
