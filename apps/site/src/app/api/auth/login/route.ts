import { signToken, audit, type AuthRole } from "@/lib/auth";
import { erpSafe } from "@/lib/erp-client";

const MOCK_ACCOUNTS: Record<string, { id: string; password: string; role: AuthRole; name: string }> = {
  "aulia.putri@example.com": { id: "c-1", password: "password", role: "customer", name: "Aulia Putri" },
  "indra@bawabawa.id": { id: "u-1", password: "password", role: "owner", name: "Indra Permana" },
  "salsa@bawabawa.id": { id: "u-2", password: "password", role: "operations", name: "Salsa Aprilia" },
  "yoga@bawabawa.id": { id: "u-3", password: "password", role: "finance", name: "Yoga Mahendra" },
  "rani@bawabawa.id": { id: "u-5", password: "password", role: "shopper", name: "Rani Maharani" },
};

type ErpLoginResponse = {
  accessToken?: string;
  refreshToken?: string;
  user?: { id: string; name?: string; email?: string; role?: string };
};

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { email?: string; password?: string };
  const email = body.email?.toLowerCase();
  if (!email || !body.password) {
    return Response.json({ error: "email & password required" }, { status: 400 });
  }

  // Try ERP first; fall back to mock accounts so the site is usable in demo
  // mode when the ERP API is offline.
  const erp = await erpSafe<ErpLoginResponse>({
    path: "/auth/login",
    method: "POST",
    body: JSON.stringify({ email, password: body.password }),
    timeoutMs: 4000,
  });
  if (erp.ok && erp.data.accessToken) {
    audit.log(erp.data.user?.id ?? email, "auth.login", "erp");
    return Response.json({
      token: erp.data.accessToken,
      refreshToken: erp.data.refreshToken,
      user: erp.data.user,
      expiresIn: 3600,
      source: "erp",
    });
  }

  const account = MOCK_ACCOUNTS[email];
  if (!account || account.password !== body.password) {
    return Response.json({ error: "invalid credentials", source: "fallback" }, { status: 401 });
  }
  const token = signToken({ userId: account.id, role: account.role });
  audit.log(account.id, "auth.login", account.id);
  return Response.json({
    token,
    user: { id: account.id, name: account.name, role: account.role },
    expiresIn: 3600,
    source: "fallback",
  });
}
