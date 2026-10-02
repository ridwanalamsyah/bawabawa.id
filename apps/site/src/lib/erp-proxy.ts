import { cookies, headers } from "next/headers";
import { erpFetch, ErpError } from "@/lib/erp-client";
import { ERP_TOKEN_COOKIE } from "@/lib/auth-edge";

/**
 * Forward a public request to the ERP and relay its status + error body,
 * so validation messages ("Kode pos harus 5 digit") reach the form instead
 * of a generic failure. When the visitor is signed in, their ERP token is
 * attached so the ERP can link the order to their account.
 */
export async function proxyPublicErp(opts: {
  path: string;
  method?: string;
  body?: unknown;
  timeoutMs?: number;
  successStatus?: number;
}): Promise<Response> {
  const jar = await cookies();
  const token = jar.get(ERP_TOKEN_COOKIE)?.value;
  // Let the API rate-limit per shopper instead of per site server.
  const incoming = await headers();
  const clientIp =
    incoming.get("x-forwarded-for")?.split(",")[0]?.trim() || incoming.get("x-real-ip") || "";
  const forward: Record<string, string> = {};
  if (process.env.SITE_PROXY_SECRET && clientIp) {
    forward["x-bawabawa-proxy-secret"] = process.env.SITE_PROXY_SECRET;
    forward["x-bawabawa-client-ip"] = clientIp;
  }
  try {
    const data = await erpFetch<unknown>({
      headers: forward,
      path: opts.path,
      method: opts.method ?? "GET",
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      token,
      timeoutMs: opts.timeoutMs ?? 8000,
    });
    return Response.json({ data }, { status: opts.successStatus ?? 200 });
  } catch (error) {
    if (error instanceof ErpError) {
      const upstream = error.body && typeof error.body === "object" ? (error.body as { error?: unknown }) : null;
      return Response.json(
        { error: upstream?.error ?? { code: "UPSTREAM_ERROR", message: "Permintaan ditolak server." } },
        { status: error.status },
      );
    }
    return Response.json(
      { error: { code: "ERP_UNREACHABLE", message: "Server sedang tidak bisa dihubungi. Coba lagi sebentar lagi." } },
      { status: 502 },
    );
  }
}
