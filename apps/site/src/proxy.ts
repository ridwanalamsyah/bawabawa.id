import { NextResponse, type NextRequest } from "next/server";
import {
  isAdminRole,
  SESSION_COOKIE,
  verifyTokenEdge,
} from "@/lib/auth-edge";

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
export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const session = verifyTokenEdge(req.cookies.get(SESSION_COOKIE)?.value);

  if (pathname.startsWith("/admin")) {
    if (!session) {
      return redirectToLogin(req, pathname, search);
    }
    if (!isAdminRole(session.role)) {
      return redirectToLogin(req, pathname, search, "forbidden");
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/dashboard")) {
    if (!session) {
      return redirectToLogin(req, pathname, search);
    }
    return NextResponse.next();
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
  matcher: ["/admin/:path*", "/dashboard/:path*"],
};
