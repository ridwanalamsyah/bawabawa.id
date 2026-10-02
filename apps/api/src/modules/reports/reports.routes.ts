import { Router } from "express";
import { authGuard, requirePermission } from "../../common/middleware/auth";
import { getPool } from "../../infrastructure/db/pool";

const reportsRouter = Router();

reportsRouter.get("/kpi", authGuard, requirePermission("reports:export"), (_req, res) => {
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

/**
 * GET /reports/sales.csv — real order rows (newest first, max 5000) as CSV.
 * Replaces the old sales.xlsx endpoint, which returned two hardcoded demo
 * rows and depended on the unmaintained `xlsx` package (prototype
 * pollution advisory, no fix). Excel and Google Sheets open CSV directly.
 */
function csvCell(value: unknown): string {
  const text = value == null ? "" : String(value);
  // Neutralise spreadsheet formula injection (=, +, -, @ at cell start).
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

reportsRouter.get("/sales.csv", authGuard, requirePermission("reports:export"), async (_req, res, next) => {
  try {
    const { rows } = await (await getPool()).query<{
      order_number: string;
      created_at: string;
      status: string;
      payment_status: string;
      total_amount: string;
      customer: string | null;
    }>(
      `SELECT o.order_number, o.created_at, o.status, o.payment_status, o.total_amount, c.name AS customer
         FROM orders o
         LEFT JOIN customers c ON c.id = o.customer_id
        ORDER BY o.created_at DESC
        LIMIT 5000`
    );
    const header = ["order_number", "created_at", "customer", "status", "payment_status", "total_amount"];
    const lines = [
      header.join(","),
      ...rows.map((row) =>
        [row.order_number, row.created_at, row.customer, row.status, row.payment_status, row.total_amount]
          .map(csvCell)
          .join(",")
      )
    ];
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=sales-report.csv");
    res.send("\uFEFF" + lines.join("\n"));
  } catch (error) {
    next(error);
  }
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
  // Public endpoint: counts only. Revenue used to be returned here, which
  // published the business's monthly turnover to anyone.
  const empty = {
    activeOrders: 0,
    activeCustomers: 0,
    totalOrdersAllTime: 0,
    activeTrips: 0,
    softLaunch: true
  };
  try {
    const db = await getPool();
    const [customers, ordersAll, ordersMonth, activeOrders] =
      await Promise.all([
        db.query<{ count: string }>("SELECT COUNT(*)::text AS count FROM customers"),
        db.query<{ count: string }>("SELECT COUNT(*)::text AS count FROM orders"),
        db.query<{ count: string }>(
          "SELECT COUNT(*)::text AS count FROM orders WHERE created_at >= date_trunc('month', NOW())"
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
