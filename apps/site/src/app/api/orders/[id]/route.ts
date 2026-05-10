import { orders } from "@/lib/mock/orders";
import { erpSafe } from "@/lib/erp-client";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const erp = await erpSafe<unknown>({ path: `/orders/${encodeURIComponent(id)}`, timeoutMs: 3000 });
  if (erp.ok && erp.data) {
    return Response.json({ data: erp.data, source: "erp" });
  }
  const order = orders.find((o) => o.id === id || o.code === id);
  if (!order) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json({ data: order, source: "fallback" });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const erp = await erpSafe<unknown>({
    path: `/orders/${encodeURIComponent(id)}`,
    method: "PATCH",
    body: JSON.stringify(body),
    timeoutMs: 4000,
  });
  if (erp.ok) return Response.json({ data: erp.data, source: "erp" });

  const order = orders.find((o) => o.id === id || o.code === id);
  if (!order) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json({ data: { ...order, ...body }, source: "fallback" });
}
