import { proxyPublicErp } from "@/lib/erp-proxy";

/**
 * POST /api/orders — submit a jastip request or catalog checkout. Forwards
 * to the ERP's public order-requests endpoint, which validates, prices and
 * stores it, then notifies the team on WhatsApp.
 *
 * (The old GET handler listed every order without authentication and fell
 * back to mock data; it has been removed.)
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ error: { code: "INVALID_BODY", message: "Data pesanan tidak valid" } }, { status: 400 });
  }
  return proxyPublicErp({ path: "/public/order-requests", method: "POST", body, timeoutMs: 10000, successStatus: 201 });
}
