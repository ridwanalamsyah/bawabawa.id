import { cookies } from "next/headers";
import { signToken, audit, type AuthRole } from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/auth-edge";
import { erpSafe } from "@/lib/erp-client";

const MOCK_ACCOUNTS: Record<string, { id: string; password: string; role: AuthRole; name: string }> = {
  "aulia.putri@example.com": { id: "c-1", password: "password", role: "customer", name: "Aulia Putri" },
  "indra@bawabawa.id": { id: "u-1", password: "password", role: "owner", name: "Indra Permana" },
  "salsa@bawabawa.id": { id: "u-2", password: "password", role: "operations", name: "Salsa Aprilia" },
  "yoga@bawabawa.id": { id: "u-3", password: "password", role: "finance", name: "Yoga Mahendra" },
  "rani@bawabawa.id": { id: "u-5", password: "password", role: "shopper", name: "Rani Maharani" },
};

const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8h

type ErpLoginResponse = {
  accessToken?: string;
  refreshToken?: string;
  user?: { id: string; name?: string; email?: string; role?: string };
};

async function setSessionCookie(token: string) {
  const jar = await cookies();
  jar.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

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
    // ERP tokens are signed with the ERP's secret. The Edge middleware in
    // this site only inspects the unsigned `payload` for routing decisions,
    // so we issue a parallel mock-signed token whose payload matches the
    // ERP user. Server-side calls back to the ERP still use the original
    // ERP `accessToken` — exposed to the client via the response body.
    const erpUser: NonNullable<ErpLoginResponse["user"]> = erp.data.user ?? {
      id: email,
    };
    const role = ((erpUser.role ?? "customer") as AuthRole);
    const sessionToken = signToken({
      userId: erpUser.id ?? email,
      role,
    }, SESSION_TTL_SECONDS);
    await setSessionCookie(sessionToken);
    return Response.json({
      token: erp.data.accessToken,
      refreshToken: erp.data.refreshToken,
      user: erpUser,
      expiresIn: SESSION_TTL_SECONDS,
      source: "erp",
    });
  }

  const account = MOCK_ACCOUNTS[email];
  if (!account || account.password !== body.password) {
    return Response.json({ error: "invalid credentials", source: "fallback" }, { status: 401 });
  }
  const token = signToken({ userId: account.id, role: account.role }, SESSION_TTL_SECONDS);
  audit.log(account.id, "auth.login", account.id);
  await setSessionCookie(token);
  return Response.json({
    token,
    user: { id: account.id, name: account.name, role: account.role },
    expiresIn: SESSION_TTL_SECONDS,
    source: "fallback",
  });
}
