import { revenueLast14Days, ordersByCategory, topShoppers } from "@/lib/mock/analytics";

export async function GET() {
  return Response.json({
    revenueMonth: 1_842_000_000,
    activeOrders: 137,
    activeCustomers: 12_483,
    activeTrips: 4,
    revenueLast14Days,
    ordersByCategory,
    topShoppers,
  });
}
