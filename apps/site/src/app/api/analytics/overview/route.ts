import { erpSafe } from "@/lib/erp-client";

type ErpReportSummary = {
  revenueMonth?: number;
  activeOrders?: number;
  activeCustomers?: number;
  activeTrips?: number;
  totalOrdersAllTime?: number;
  ordersThisMonth?: number;
  softLaunch?: boolean;
};

/**
 * Public stats consumed by the marketing site's live counters. Numbers are
 * fetched from the ERP `reports/summary` endpoint which counts directly off
 * the `orders` / `customers` tables.
 *
 * If the ERP is unreachable we degrade to honest zeros (NOT fabricated
 * numbers) so the marketing surface never claims customers it doesn't have.
 * `softLaunch: true` lets the UI render an "Awal peluncuran" badge instead
 * of awkward zero-state.
 */
export async function GET() {
  const erp = await erpSafe<ErpReportSummary>({
    path: "/reports/summary",
    timeoutMs: 4000,
  });
  if (erp.ok && erp.data) {
    return Response.json({
      revenueMonth: erp.data.revenueMonth ?? 0,
      activeOrders: erp.data.activeOrders ?? 0,
      activeCustomers: erp.data.activeCustomers ?? 0,
      activeTrips: erp.data.activeTrips ?? 0,
      totalOrdersAllTime: erp.data.totalOrdersAllTime ?? 0,
      ordersThisMonth: erp.data.ordersThisMonth ?? 0,
      softLaunch: erp.data.softLaunch ?? true,
      source: "erp",
    });
  }
  return Response.json({
    revenueMonth: 0,
    activeOrders: 0,
    activeCustomers: 0,
    activeTrips: 0,
    totalOrdersAllTime: 0,
    ordersThisMonth: 0,
    softLaunch: true,
    source: "fallback",
  });
}
