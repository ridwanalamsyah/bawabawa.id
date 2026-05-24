/**
 * Shared helpers for `/api/admin/*` BFF routes. Centralizes:
 *   - Site session check (must be admin role, otherwise 401/403).
 *   - ERP bearer-token forwarding (read from httpOnly cookie set on Google
 *     sign-in).
 *   - Consistent error responses.
 */

import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { ERP_TOKEN_COOKIE, SESSION_COOKIE } from "@/lib/auth-edge";
import { erpFetch, ErpError } from "@/lib/erp-client";

const ADMIN_ROLES: ReadonlySet<string> = new Set([
  "owner",
  "admin",
  "operations",
  "finance",
  "support",
]);

export type AdminContext = {
  userId: string;
  role: string;
  erpToken: string;
};

export async function requireAdminContext(): Promise<
  { ok: true; ctx: AdminContext } | { ok: false; response: Response }
> {
  const jar = await cookies();
  const session = await verifyToken(jar.get(SESSION_COOKIE)?.value);
  if (!session) {
    return {
      ok: false,
      response: Response.json({ error: "unauthorized" }, { status: 401 }),
    };
  }
  if (!ADMIN_ROLES.has(session.role)) {
    return {
      ok: false,
      response: Response.json({ error: "forbidden" }, { status: 403 }),
    };
  }
  const erpToken = jar.get(ERP_TOKEN_COOKIE)?.value;
  if (!erpToken) {
    return {
      ok: false,
      response: Response.json(
        { error: "Sesi kamu kedaluwarsa. Silakan logout dan login ulang." },
        { status: 401 },
      ),
    };
  }
  return { ok: true, ctx: { userId: session.userId, role: session.role, erpToken } };
}

/**
 * Forward an ERP call using the signed-in user's bearer token. Maps
 * ErpError to a JSON response without leaking internal details.
 */
export async function callErpAsAdmin<T>(opts: {
  path: string;
  method?: string;
  body?: unknown;
}): Promise<{ ok: true; data: T } | { ok: false; response: Response }> {
  const ctxResult = await requireAdminContext();
  if (!ctxResult.ok) return ctxResult;
  try {
    const data = await erpFetch<T>({
      path: opts.path,
      method: opts.method ?? "GET",
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      token: ctxResult.ctx.erpToken,
      timeoutMs: 8000,
    });
    return { ok: true, data };
  } catch (error) {
    if (error instanceof ErpError) {
      // Pass through the ERP error body when it's safe JSON, otherwise a
      // generic message keyed to the upstream status.
      const upstream =
        error.body && typeof error.body === "object"
          ? (error.body as { error?: unknown })
          : null;
      return {
        ok: false,
        response: Response.json(
          { error: upstream?.error ?? error.message, status: error.status },
          { status: error.status },
        ),
      };
    }
    return {
      ok: false,
      response: Response.json({ error: "Permintaan gagal. Coba lagi sebentar." }, { status: 502 }),
    };
  }
}
