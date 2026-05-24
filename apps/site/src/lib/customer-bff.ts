/**
 * Helpers for /dashboard server components and /api/customer/* routes.
 * Mirrors `admin-bff.ts` but allows any signed-in role (customer or
 * admin) — the back-office staff sometimes peek at /dashboard too.
 */

import { cookies } from "next/headers";
import { verifyToken, type AuthSession } from "@/lib/auth";
import { ERP_TOKEN_COOKIE, SESSION_COOKIE } from "@/lib/auth-edge";
import { erpFetch, ErpError } from "@/lib/erp-client";

export type CustomerContext = {
  userId: string;
  role: string;
  erpToken: string | null;
};

export async function readSession(): Promise<AuthSession | null> {
  const jar = await cookies();
  return await verifyToken(jar.get(SESSION_COOKIE)?.value);
}

export async function requireCustomerContext(): Promise<
  { ok: true; ctx: CustomerContext } | { ok: false; response: Response }
> {
  const jar = await cookies();
  const session = await verifyToken(jar.get(SESSION_COOKIE)?.value);
  if (!session) {
    return {
      ok: false,
      response: Response.json({ error: "unauthorized" }, { status: 401 }),
    };
  }
  const erpToken = jar.get(ERP_TOKEN_COOKIE)?.value ?? null;
  return {
    ok: true,
    ctx: { userId: session.userId, role: session.role, erpToken },
  };
}

/**
 * Customer-scoped ERP fetch. Errors return null instead of throwing so
 * dashboard pages can render an empty state when the API is unreachable.
 */
export async function callErpAsCustomer<T>(opts: {
  path: string;
  method?: string;
  body?: unknown;
}): Promise<T | null> {
  const ctxResult = await requireCustomerContext();
  if (!ctxResult.ok) return null;
  if (!ctxResult.ctx.erpToken) return null;
  try {
    return await erpFetch<T>({
      path: opts.path,
      method: opts.method ?? "GET",
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      token: ctxResult.ctx.erpToken,
      timeoutMs: 6000,
    });
  } catch (error) {
    if (error instanceof ErpError) {
      // Most likely 401 / 403 / 404 — caller treats as empty.
      return null;
    }
    return null;
  }
}
