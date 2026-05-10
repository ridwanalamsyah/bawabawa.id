import { revenueLast14Days, ordersByCategory, topShoppers } from "@/lib/mock/analytics";
import { erpSafe } from "@/lib/erp-client";

type ErpReportSummary = {
  revenueMonth?: number;
  activeOrders?: number;
  activeCustomers?: number;
  activeTrips?: number;
  revenueLast14Days?: { date: string; value: number }[];
  ordersByCategory?: { name: string; value: number }[];
  topShoppers?: { name: string; orders: number; rating: number }[];
};

export async function GET() {
  const erp = await erpSafe<ErpReportSummary>({
    path: "/reports/summary",
    timeoutMs: 4000,
  });
  if (erp.ok && erp.data) {
    return Response.json(
      {
        revenueMonth: erp.data.revenueMonth ?? 0,
        activeOrders: erp.data.activeOrders ?? 0,
        activeCustomers: erp.data.activeCustomers ?? 0,
        activeTrips: erp.data.activeTrips ?? 0,
        revenueLast14Days: erp.data.revenueLast14Days ?? revenueLast14Days,
        ordersByCategory: erp.data.ordersByCategory ?? ordersByCategory,
        topShoppers: erp.data.topShoppers ?? topShoppers,
        source: "erp",
      },
    );
  }
  return Response.json({
    revenueMonth: 1_842_000_000,
    activeOrders: 137,
    activeCustomers: 12_483,
    activeTrips: 4,
    revenueLast14Days,
    ordersByCategory,
    topShoppers,
    source: "fallback",
  });
}
