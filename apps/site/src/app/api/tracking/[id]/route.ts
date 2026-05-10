import { erpSafe } from "@/lib/erp-client";

/**
 * Live shipment tracking for a single order — proxies the ERP shipping
 * module (Biteship-backed in production). Useful for the dashboard tracking
 * timeline; falls back to the order's stored timeline when the courier API
 * is unreachable.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const erp = await erpSafe<unknown>({
    path: `/shipping/orders/${encodeURIComponent(id)}/tracking`,
    timeoutMs: 4000,
    next: { tags: ["tracking"] },
  });
  if (erp.ok) return Response.json({ data: erp.data, source: "erp" });

  // Fallback skeleton — clients can rely on /api/orders/:id timeline instead.
  return Response.json({
    data: {
      orderId: id,
      events: [],
      hint: "ERP shipping module unreachable — show order.timeline instead.",
    },
    source: "fallback",
    error: erp.error,
  });
}
