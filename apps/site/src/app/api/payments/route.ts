import { erpSafe } from "@/lib/erp-client";

/**
 * Initiate a Midtrans charge for an order. The ERP encapsulates the actual
 * server-to-server call (apps/api/src/modules/payments/midtrans.routes.ts).
 * The site only forwards the request and returns whatever the ERP responds
 * with so the front-end can redirect to Snap or render the VA number.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const erp = await erpSafe<unknown>({
    path: "/payments/midtrans/charge",
    method: "POST",
    body: JSON.stringify(body),
    timeoutMs: 6000,
  });
  if (erp.ok) {
    return Response.json({ data: erp.data, source: "erp" });
  }
  return Response.json(
    {
      error: "ERP payments unreachable",
      detail: erp.error,
      source: "fallback",
    },
    { status: 502 },
  );
}
