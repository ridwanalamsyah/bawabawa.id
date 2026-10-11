import { erpLocalOrigin } from "@/lib/erp-internal";

/**
 * `/api/v1/*` — the ERP API (formerly the separate bawabawa-id-api project),
 * served from this deployment. Requests are relayed unchanged to the
 * in-process Express app, so every Express route, middleware (auth, rate
 * limit, validation), multipart upload and signed webhook keeps working.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Connection-level headers belong to each hop, not to the relayed message.
const HOP_HEADERS = ["host", "connection", "keep-alive", "transfer-encoding", "upgrade", "content-length", "expect"];

async function relay(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const headers = new Headers(req.headers);
  for (const name of HOP_HEADERS) headers.delete(name);
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? url.host;
  headers.set("x-forwarded-host", host);
  if (!headers.has("x-forwarded-proto")) headers.set("x-forwarded-proto", url.protocol.replace(":", ""));
  // Same-origin calls need no CORS; dropping Origin keeps the Express CORS
  // allowlist from rejecting the site's own pages.
  const origin = headers.get("origin");
  if (origin && URL.canParse(origin) && new URL(origin).host === host) headers.delete("origin");

  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  let upstream: Response;
  try {
    upstream = await fetch(`${await erpLocalOrigin()}${url.pathname}${url.search}`, {
      method: req.method,
      headers,
      // Buffered so webhook signatures are checked over the exact bytes.
      body: hasBody ? await req.arrayBuffer() : undefined,
      redirect: "manual",
      cache: "no-store",
    });
  } catch (error) {
    console.error("[api/v1] ERP app unavailable", error);
    return Response.json(
      { success: false, error: { code: "ERP_UNAVAILABLE", message: "Server sedang tidak bisa dihubungi." } },
      { status: 502 },
    );
  }

  const out = new Headers(upstream.headers);
  // fetch already decoded the body.
  for (const name of ["content-encoding", "content-length", "transfer-encoding", "connection", "keep-alive"]) {
    out.delete(name);
  }
  const noBody = req.method === "HEAD" || [101, 204, 205, 304].includes(upstream.status);
  return new Response(noBody ? null : upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: out,
  });
}

export { relay as GET, relay as POST, relay as PUT, relay as PATCH, relay as DELETE, relay as OPTIONS, relay as HEAD };
