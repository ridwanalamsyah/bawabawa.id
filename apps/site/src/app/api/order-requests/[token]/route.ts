import { proxyPublicErp } from "@/lib/erp-proxy";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return proxyPublicErp({ path: `/public/order-requests/${encodeURIComponent(token)}` });
}
