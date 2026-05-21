import { callErpAsAdmin } from "@/lib/admin-bff";

type ProfitShareSettings = {
  rules?: Array<{
    role?: string;
    percentage?: number;
    label?: string;
    description?: string;
  }>;
  reservePercentage?: number;
};

export async function GET() {
  const result = await callErpAsAdmin<ProfitShareSettings>({
    path: "/finance/profit-share",
  });
  if (!result.ok) return result.response;
  return Response.json(result.data ?? { rules: [], reservePercentage: 0 });
}

export async function PUT(req: Request) {
  const body = (await req.json().catch(() => null)) as ProfitShareSettings | null;
  if (!body) {
    return Response.json({ error: "invalid_body" }, { status: 400 });
  }
  const result = await callErpAsAdmin({
    path: "/finance/profit-share",
    method: "PUT",
    body,
  });
  if (!result.ok) return result.response;
  return Response.json({ success: true });
}
