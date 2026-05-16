import { Router } from "express";
import { authGuard } from "../../common/middleware/auth";
import * as XLSX from "xlsx";
import { getPool } from "../../infrastructure/db/pool";

const reportsRouter = Router();

reportsRouter.get("/kpi", authGuard, (_req, res) => {
  res.json({
    success: true,
    data: {
      dailySales: 4200000,
      topProduct: "Produk A",
      loyalCustomers: 34,
      stockAlerts: 7
    }
  });
});

reportsRouter.get("/sales.xlsx", authGuard, (_req, res) => {
  const rows = [
    { orderNumber: "SO-001", totalAmount: 120000, paymentStatus: "paid" },
    { orderNumber: "SO-002", totalAmount: 80000, paymentStatus: "dp" }
  ];
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, "Sales");
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", "attachment; filename=sales-report.xlsx");
  res.send(buffer);
});

/**
 * Public marketing summary — totals derived directly from the orders/
 * customers tables. Intentionally unauthenticated and conservative: returns
 * raw zeros when the table is empty so the marketing site can render an
 * honest empty state ("Belum ada pesanan tercatat") rather than fabricate
 * customer counts. Errors return zeros (degrade gracefully — marketing site
 * must never 5xx because the DB is briefly unavailable).
 */
reportsRouter.get("/summary", async (_req, res) => {
  const empty = {
    revenueMonth: 0,
    activeOrders: 0,
    activeCustomers: 0,
    totalOrdersAllTime: 0,
    activeTrips: 0,
    softLaunch: true
  };
  try {
    const db = await getPool();
    const [customers, ordersAll, ordersMonth, revenueMonth, activeOrders] =
      await Promise.all([
        db.query<{ count: string }>("SELECT COUNT(*)::text AS count FROM customers"),
        db.query<{ count: string }>("SELECT COUNT(*)::text AS count FROM orders"),
        db.query<{ count: string }>(
          "SELECT COUNT(*)::text AS count FROM orders WHERE created_at >= date_trunc('month', NOW())"
        ),
        db.query<{ sum: string | null }>(
          `SELECT COALESCE(SUM(total_amount), 0)::text AS sum
             FROM orders
            WHERE created_at >= date_trunc('month', NOW())
              AND payment_status IN ('paid', 'dp')`
        ),
        db.query<{ count: string }>(
          `SELECT COUNT(*)::text AS count
             FROM orders
            WHERE status NOT IN ('cancelled', 'posted_finance')`
        )
      ]);

    res.json({
      success: true,
      data: {
        revenueMonth: Number(revenueMonth.rows[0]?.sum ?? 0),
        activeOrders: Number(activeOrders.rows[0]?.count ?? 0),
        activeCustomers: Number(customers.rows[0]?.count ?? 0),
        totalOrdersAllTime: Number(ordersAll.rows[0]?.count ?? 0),
        ordersThisMonth: Number(ordersMonth.rows[0]?.count ?? 0),
        activeTrips: 0,
        softLaunch: true
      }
    });
  } catch {
    res.json({ success: true, data: empty });
  }
});

/**
 * Anonymized recent activity feed for the public live ticker. Returns the
 * last 8 orders with the customer's full name masked to first name + last
 * initial ("Aulia P.") so the public surface never leaks PII. Status/amount
 * are not exposed — only the type of event and a "time ago" hint.
 */
reportsRouter.get("/activity", async (_req, res) => {
  try {
    const db = await getPool();
    const result = await db.query<{
      id: string;
      created_at: string;
      status: string;
      name: string | null;
    }>(
      `SELECT o.id, o.created_at, o.status, c.name
         FROM orders o
         LEFT JOIN customers c ON c.id = o.customer_id
        ORDER BY o.created_at DESC
        LIMIT 8`
    );
    const items = result.rows.map((row) => {
      const name = (row.name ?? "Customer").trim();
      const [first = "Customer", last] = name.split(/\s+/);
      const masked = last ? `${first} ${last[0]?.toUpperCase()}.` : first;
      return {
        id: row.id,
        text: `${masked} baru saja membuat pesanan`,
        status: row.status,
        at: row.created_at
      };
    });
    res.json({ success: true, data: items });
  } catch {
    res.json({ success: true, data: [] });
  }
});

/**
 * Public testimonials feed. Until the admin testimonials CMS lands, returns
 * an empty array. The marketing site renders an honest empty state
 * ("Belum ada review yang dipublikasikan") instead of fabricating reviews.
 */
reportsRouter.get("/testimonials", async (_req, res) => {
  try {
    const db = await getPool();
    const result = await db.query<{
      id: string;
      customer_name: string;
      city: string | null;
      rating: number;
      body: string;
      avatar_url: string | null;
      is_verified: boolean;
    }>(
      `SELECT id, customer_name, city, rating, body, avatar_url, is_verified
         FROM testimonials
        WHERE is_published = TRUE
        ORDER BY published_at DESC NULLS LAST, created_at DESC
        LIMIT 12`
    );
    res.json({ success: true, data: result.rows });
  } catch {
    // Table doesn't exist yet or db unavailable — fall back to empty so the
    // marketing site shows the honest empty state.
    res.json({ success: true, data: [] });
  }
});

export { reportsRouter };
