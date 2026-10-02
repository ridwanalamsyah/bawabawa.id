import { NextResponse, type NextRequest } from "next/server";
import {
  isAdminRole,
  SESSION_COOKIE,
  verifyTokenEdge,
} from "@/lib/auth-edge";
import {
  ERP_REFRESH_COOKIE,
  ERP_TOKEN_COOKIE,
  erpCookieOptions,
  refreshErpTokens,
  tokenExpiresWithin,
} from "@/lib/erp-session";

/**
 * Server components under /admin and /dashboard call the ERP with the
 * access-token cookie but cannot write cookies. Refresh here, before they
 * render: the new tokens go onto the forwarded request (so this render
 * sees them) and onto the response (so the browser keeps them).
 */
async function continueWithFreshErpToken(req: NextRequest): Promise<NextResponse> {
  const access = req.cookies.get(ERP_TOKEN_COOKIE)?.value;
  const refresh = req.cookies.get(ERP_REFRESH_COOKIE)?.value;
  if (!refresh || !tokenExpiresWithin(access, 60)) return NextResponse.next();

  const pair = await refreshErpTokens(refresh);
  if (!pair) return NextResponse.next();

  req.cookies.set(ERP_TOKEN_COOKIE, pair.accessToken);
  req.cookies.set(ERP_REFRESH_COOKIE, pair.refreshToken);
  const res = NextResponse.next({ request: { headers: req.headers } });
  res.cookies.set({ name: ERP_TOKEN_COOKIE, value: pair.accessToken, ...erpCookieOptions });
  res.cookies.set({ name: ERP_REFRESH_COOKIE, value: pair.refreshToken, ...erpCookieOptions });
  return res;
}

/**
 * Auth gate for `/admin/*` and `/dashboard/*`. Next.js 16 renamed
 * the `middleware.ts` convention to `proxy.ts` (nodejs runtime), so
 * this file lives under `src/proxy.ts` and exports a `proxy` function.
 *
 * - `/admin/*` requires a session cookie with an admin-class role
 *   (owner | operations | finance | support | admin). Non-admins are
 *   redirected to `/login?next=<path>&reason=forbidden`. Unauthenticated
 *   visitors see `/login?next=<path>`.
 * - `/dashboard/*` requires any authenticated session.
 *
 * The admin link is also hidden from the public navbar in
 * `components/marketing/nav.tsx` so casual visitors don't even know the
 * route exists — but the server-side gate is what actually keeps it
 * locked down.
 */
export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const session = await verifyTokenEdge(req.cookies.get(SESSION_COOKIE)?.value);

  if (pathname.startsWith("/admin")) {
    if (!session) {
      return redirectToLogin(req, pathname, search);
    }
    if (!isAdminRole(session.role)) {
      return redirectToLogin(req, pathname, search, "forbidden");
    }
    return continueWithFreshErpToken(req);
  }

  if (pathname.startsWith("/dashboard")) {
    if (!session) {
      return redirectToLogin(req, pathname, search);
    }
    return continueWithFreshErpToken(req);
  }

  return NextResponse.next();
}

function redirectToLogin(
  req: NextRequest,
  pathname: string,
  search: string,
  reason?: string,
): NextResponse {
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  const next = `${pathname}${search}`;
  url.search = "";
  url.searchParams.set("next", next);
  if (reason) url.searchParams.set("reason", reason);
  const res = NextResponse.redirect(url);
  if (reason === "forbidden") {
    // Drop the bad session so the user can log back in cleanly.
    res.cookies.delete(SESSION_COOKIE);
  }
  return res;
}

export const config = {
  // /api/admin/* BFF routes do their own session check + 401 retry.
  matcher: ["/admin/:path*", "/dashboard/:path*"],
};
