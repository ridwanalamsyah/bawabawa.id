import { callErpAsAdmin } from "@/lib/admin-bff";

type CmsSetting = {
  setting_key: string;
  value: Record<string, unknown> | unknown[] | null;
  description: string | null;
  updated_at: string;
};

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ key: string }> },
) {
  const { key } = await ctx.params;
  const result = await callErpAsAdmin<CmsSetting>({
    path: `/cms/settings/${encodeURIComponent(key)}`,
  });
  if (!result.ok) return result.response;
  return Response.json(result.data);
}

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ key: string }> },
) {
  const { key } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as {
    value?: unknown;
    description?: string | null;
  };
  const result = await callErpAsAdmin<CmsSetting>({
    path: `/cms/settings/${encodeURIComponent(key)}`,
    method: "PUT",
    body,
  });
  if (!result.ok) return result.response;
  return Response.json(result.data);
}
