import { proxyPublicErp } from "@/lib/erp-proxy";

export async function POST(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return proxyPublicErp({ path: `/public/order-requests/${encodeURIComponent(token)}/approve`, method: "POST", body: {} });
}
