/**
 * ERP Integration Client
 * ----------------------
 * Lightweight HTTP client for the Bawabawa ERP API (apps/api in this monorepo).
 *
 * The site renders both server-side (RSC, route handlers) and client-side, so
 * we expose two flavours:
 *   - `erpFetch<T>()` — generic, returns parsed JSON (or throws ErpError)
 *   - `erpSafe<T>()`  — never throws; returns `{ ok: true, data }` or
 *                       `{ ok: false, error }` so the caller can fall back to
 *                       mock data when the ERP API is unreachable.
 *
 * Server-side calls go to the ERP API running inside this deployment (see
 * `erp-internal.ts`); browser-side calls use the same-origin `/api/v1`.
 *
 * Optional environment variables:
 *   ERP_API_BASE_URL  — call a separately running API instead (e.g.
 *                       http://localhost:4000 in local dev)
 *   ERP_API_TOKEN     — optional bearer token for server-side requests
 */

import { erpApiBase } from "@/lib/erp-internal";

export type ErpFetchOptions = RequestInit & {
  /** Path beneath the ERP API base URL, e.g. `/orders` (leading slash optional). */
  path: string;
  /** Optional override of the per-request token. */
  token?: string;
  /** Number of milliseconds before the request is aborted. Defaults to 6000ms. */
  timeoutMs?: number;
  /**
   * Cache strategy passed through to fetch. Defaults to `no-store` so we always
   * see fresh data on dashboards. Override for marketing/CMS calls that can
   * tolerate revalidation windows.
   */
  cache?: RequestCache;
  /** Tag used by Next.js for on-demand revalidation. */
  next?: { revalidate?: number; tags?: string[] };
};

export class ErpError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "ErpError";
    this.status = status;
    this.body = body;
  }
}

async function buildUrl(path: string): Promise<string> {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  // The ERP mounts everything under `/api/v1`. If the caller already includes
  // it we don't double-prefix.
  const base = typeof window === "undefined" ? await erpApiBase() : "/api/v1";
  return suffix.startsWith("/api/") ? `${base.replace(/\/api\/v1$/, "")}${suffix}` : `${base}${suffix}`;
}

export async function erpFetch<T>(opts: ErpFetchOptions): Promise<T> {
  const { path, token, timeoutMs = 6000, cache, next, ...init } = opts;
  const url = await buildUrl(path);
  const headers = new Headers(init.headers);
  headers.set("accept", "application/json");
  if (init.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  const bearer = token ?? process.env.ERP_API_TOKEN;
  if (bearer && !headers.has("authorization")) {
    headers.set("authorization", `Bearer ${bearer}`);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...init,
      headers,
      cache: cache ?? "no-store",
      next,
      signal: controller.signal,
    });
    let parsed: unknown;
    const text = await res.text();
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      parsed = text;
    }
    if (!res.ok) {
      throw new ErpError(
        `ERP request failed: ${res.status} ${res.statusText}`,
        res.status,
        parsed,
      );
    }
    if (parsed && typeof parsed === "object" && "data" in (parsed as Record<string, unknown>)) {
      return (parsed as { data: T }).data;
    }
    return parsed as T;
  } finally {
    clearTimeout(timer);
  }
}

export type ErpSafeResult<T> =
  | { ok: true; data: T; source: "erp" }
  | { ok: false; error: string; source: "fallback" };

/**
 * Run an ERP request without throwing. Use this on pages where we want to fall
 * back to local mock data when the ERP API is offline (e.g. demo previews).
 */
export async function erpSafe<T>(opts: ErpFetchOptions): Promise<ErpSafeResult<T>> {
  try {
    const data = await erpFetch<T>(opts);
    return { ok: true, data, source: "erp" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    return { ok: false, error: message, source: "fallback" };
  }
}

/**
 * Convenience helpers for the most-used routes. Add more as integrations grow.
 */
export const erp = {
  health: () => erpFetch<{ status: string }>({ path: "/health" }),
  cmsSettingsPublic: () =>
    erpFetch<Array<{ key: string; value: unknown }>>({
      path: "/cms/settings/public",
      cache: "force-cache",
      next: { revalidate: 60, tags: ["cms-public"] },
    }),
  listOrders: (params?: { status?: string; limit?: number }) => {
    const search = new URLSearchParams();
    if (params?.status) search.set("status", params.status);
    if (params?.limit) search.set("limit", String(params.limit));
    const query = search.toString() ? `?${search.toString()}` : "";
    return erpFetch<unknown[]>({ path: `/orders${query}` });
  },
  login: (email: string, password: string) =>
    erpFetch<{ accessToken: string; refreshToken?: string; user: unknown }>({
      path: "/auth/login",
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
};
