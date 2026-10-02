import { proxyPublicErp } from "@/lib/erp-proxy";

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const body = await req.json().catch(() => ({}));
  return proxyPublicErp({
    path: `/public/order-requests/${encodeURIComponent(token)}/review`,
    method: "POST",
    body,
    successStatus: 201,
  });
}
