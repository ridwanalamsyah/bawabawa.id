import { callErpAsAdmin } from "@/lib/admin-bff";

type CmsSetting = {
  setting_key: string;
  value: Record<string, unknown> | unknown[] | null;
  description: string | null;
  updated_at: string;
};

export async function GET() {
  const result = await callErpAsAdmin<CmsSetting[]>({ path: "/cms/settings" });
  if (!result.ok) return result.response;
  return Response.json(result.data);
}
