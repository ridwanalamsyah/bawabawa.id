import { callErpAsAdmin } from "@/lib/admin-bff";
import { getHubSamarindaStock } from "@/lib/site-content";
import { HubSamarindaClient } from "./hub-samarinda-client";
import type { OrderRequestRow } from "../orders/orders-client";

export const dynamic = "force-dynamic";

export default async function HubSamarindaPage() {
  const [ordersRes, hubStock] = await Promise.all([
    callErpAsAdmin<{ items: OrderRequestRow[] }>({ path: "/admin/orders/requests?limit=100" }),
    getHubSamarindaStock(),
  ]);

  const allOrders = ordersRes.ok && Array.isArray(ordersRes.data?.items) ? ordersRes.data.items : [];

  return <HubSamarindaClient initialOrders={allOrders} initialStock={hubStock} />;
}
