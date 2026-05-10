import { orders } from "@/lib/mock/orders";
import { audit } from "@/lib/auth";
import { erpSafe } from "@/lib/erp-client";
import type { Order, OrderStatus } from "@/lib/types";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const status = url.searchParams.get("status") as OrderStatus | null;
  const customerId = url.searchParams.get("customerId");

  // Try the ERP first so the site shows real data when the API is online.
  const search = new URLSearchParams();
  if (status) search.set("status", status);
  if (customerId) search.set("customerId", customerId);
  const query = search.toString() ? `?${search.toString()}` : "";
  const erp = await erpSafe<unknown[]>({ path: `/orders${query}`, timeoutMs: 3000 });
  if (erp.ok) {
    return Response.json({
      data: erp.data,
      total: Array.isArray(erp.data) ? erp.data.length : 0,
      source: "erp",
    });
  }

  const filtered = orders.filter((o) => {
    if (status && o.status !== status) return false;
    if (customerId && o.customer.id !== customerId) return false;
    return true;
  });
  return Response.json({ data: filtered, total: filtered.length, source: "fallback" });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Partial<Order>;
  const code = `BWB-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const newOrder: Partial<Order> = {
    id: code.toLowerCase(),
    code,
    status: "request_received",
    createdAt: new Date().toISOString(),
    timeline: [{ status: "request_received", at: new Date().toISOString(), note: "Request diterima — menunggu shopper." }],
    ...body,
  };
  audit.log("system", "order.created", code, { itemCount: body.items?.length ?? 0 });
  return Response.json({ data: newOrder }, { status: 201 });
}
