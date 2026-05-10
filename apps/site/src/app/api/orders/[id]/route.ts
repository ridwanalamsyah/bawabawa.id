import { orders } from "@/lib/mock/orders";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const order = orders.find((o) => o.id === id || o.code === id);
  if (!order) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json({ data: order });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const order = orders.find((o) => o.id === id || o.code === id);
  if (!order) return Response.json({ error: "not found" }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  // Mock immutable response — production would persist via Prisma/Supabase.
  return Response.json({ data: { ...order, ...body } });
}
