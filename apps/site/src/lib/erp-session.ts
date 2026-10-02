/**
 * ERP token lifecycle for the site. ERP access tokens live 15 minutes while
 * the site session lasts 8 hours, so the httpOnly refresh cookie is used to
 * mint new access tokens:
 *
 *   - `proxy.ts` refreshes proactively before /admin and /dashboard render
 *     (server components can't write cookies themselves).
 *   - BFF route handlers retry once after an upstream 401.
 *
 * Tokens never reach browser JavaScript: they are only stored in httpOnly
 * cookies and forwarded server-side.
 */

import { ERP_REFRESH_COOKIE, ERP_TOKEN_COOKIE } from "@/lib/auth-edge";

export const SESSION_TTL_SECONDS = 60 * 60 * 8;

export const erpCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_TTL_SECONDS,
};

export { ERP_REFRESH_COOKIE, ERP_TOKEN_COOKIE };

/** Reads `exp` without verifying — only used to decide whether to refresh. */
export function tokenExpiresWithin(token: string | undefined | null, seconds: number): boolean {
  if (!token) return true;
  const part = token.split(".")[1];
  if (!part) return true;
  try {
    const json = JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/"))) as { exp?: number };
    if (typeof json.exp !== "number") return true;
    return json.exp - Math.floor(Date.now() / 1000) < seconds;
  } catch {
    return true;
  }
}

function apiBase(): string {
  const base = (process.env.ERP_API_BASE_URL ?? process.env.NEXT_PUBLIC_ERP_API_URL ?? "").replace(/\/$/, "");
  if (!base) return "/api/v1";
  return base.endsWith("/api/v1") ? base : `${base}/api/v1`;
}

export type ErpTokenPair = { accessToken: string; refreshToken: string };

export async function refreshErpTokens(refreshToken: string | undefined | null): Promise<ErpTokenPair | null> {
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${apiBase()}/auth/refresh`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: Partial<ErpTokenPair> };
    if (!json.data?.accessToken || !json.data?.refreshToken) return null;
    return { accessToken: json.data.accessToken, refreshToken: json.data.refreshToken };
  } catch {
    return null;
  }
}

export async function revokeErpRefreshToken(refreshToken: string | undefined | null): Promise<void> {
  if (!refreshToken) return;
  try {
    await fetch(`${apiBase()}/auth/logout`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
  } catch {
    // Logging out locally still succeeds; the refresh token expires anyway.
  }
}
