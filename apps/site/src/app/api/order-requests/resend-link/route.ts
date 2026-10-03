import { proxyPublicErp } from "@/lib/erp-proxy";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  return proxyPublicErp({ path: "/public/order-requests/resend-link", method: "POST", body });
}
