/**
 * Google sign-in handler. Receives a Google Identity Services `credential`
 * (ID token) from the browser, exchanges it for an ERP session via the API's
 * `POST /api/v1/auth/google`, then mints a same-origin session cookie so the
 * Edge middleware can route the user.
 *
 * The ERP access/refresh tokens are stored only in httpOnly cookies — never
 * returned to browser JavaScript — and forwarded by the BFF routes.
 */

import { cookies } from "next/headers";
import { signToken, audit, type AuthRole } from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/auth-edge";
import { erpSafe } from "@/lib/erp-client";
import {
  ERP_REFRESH_COOKIE,
  ERP_TOKEN_COOKIE,
  SESSION_TTL_SECONDS,
  erpCookieOptions,
} from "@/lib/erp-session";

type ErpGoogleResponse = {
  accessToken?: string;
  refreshToken?: string;
  user?: {
    id: string;
    email?: string;
    fullName?: string;
    division?: string;
    roles?: string[];
    permissions?: string[];
    pictureUrl?: string | null;
  };
};

const ADMIN_ROLES: ReadonlySet<string> = new Set([
  "owner",
  "admin",
  "operations",
  "finance",
  "support",
]);

function mapRolesToAuthRole(roles: readonly string[] | undefined): AuthRole {
  if (!roles || roles.length === 0) return "customer";
  for (const role of roles) {
    if (ADMIN_ROLES.has(role)) return role as AuthRole;
  }
  if (roles.includes("shopper")) return "shopper";
  return "customer";
}

async function setSessionCookies(sessionToken: string, erpAccessToken: string, erpRefreshToken?: string) {
  const jar = await cookies();
  jar.set({ name: SESSION_COOKIE, value: sessionToken, ...erpCookieOptions });
  jar.set({ name: ERP_TOKEN_COOKIE, value: erpAccessToken, ...erpCookieOptions });
  if (erpRefreshToken) {
    jar.set({ name: ERP_REFRESH_COOKIE, value: erpRefreshToken, ...erpCookieOptions });
  }
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { credential?: string };
  const credential = body.credential?.trim();
  if (!credential || credential.length < 20) {
    return Response.json({ error: "Google credential required" }, { status: 400 });
  }

  const erp = await erpSafe<ErpGoogleResponse>({
    path: "/auth/google",
    method: "POST",
    body: JSON.stringify({ idToken: credential }),
    timeoutMs: 6000,
  });

  if (!erp.ok) {
    return Response.json({ error: erp.error || "Google sign-in ditolak.", source: "erp" }, { status: 502 });
  }
  if (!erp.data.accessToken || !erp.data.user) {
    return Response.json({ error: "Google sign-in ditolak.", source: "erp" }, { status: 401 });
  }

  const user = erp.data.user;
  const role = mapRolesToAuthRole(user.roles);
  const sessionToken = await signToken(
    { userId: user.id, role },
    SESSION_TTL_SECONDS,
  );
  await setSessionCookies(sessionToken, erp.data.accessToken, erp.data.refreshToken);
  audit.log(user.id, "auth.login.google", user.email ?? user.id);

  // Tokens stay in httpOnly cookies; the browser only needs the profile.
  return Response.json({
    user: {
      id: user.id,
      name: user.fullName,
      email: user.email,
      role,
      roles: user.roles ?? [],
      pictureUrl: user.pictureUrl ?? null,
    },
    expiresIn: SESSION_TTL_SECONDS,
    source: "erp",
  });
}
