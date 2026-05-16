import { cookies } from "next/headers";
import { signToken, audit, type AuthRole } from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/auth-edge";
import { erpSafe } from "@/lib/erp-client";

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
    const sessionToken = await signToken({
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

  // No fallback. If ERP rejects, surface the same generic error to the user.
  // Demo/mock accounts have been removed from the site for production use.
  return Response.json(
    { error: "Email atau password salah.", source: "erp" },
    { status: 401 }
  );
}
