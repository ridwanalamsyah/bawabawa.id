import { randomUUID } from "node:crypto";
import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app";
import { getPool } from "../infrastructure/db/pool";
import { ensureSchema, hasPostgres, resetData } from "./helpers/db-setup";

/**
 * PR #49 — wire live marketing sections (stats / activity / testimonials)
 * to real ERP data with honest soft-launch empty state.
 *
 * Contract under test:
 *   1. All three endpoints are public (no auth header required).
 *   2. They MUST NOT 5xx — even when underlying tables are empty or the
 *      query fails. The marketing landing page renders the empty state
 *      based on these responses; a 500 would crash hydration.
 *   3. `/activity` masks PII: customer.name is shown as "First L." style
 *      with the last name reduced to its initial.
 */
describe.skipIf(!hasPostgres)("public reports endpoints (PR #49)", () => {
  beforeAll(async () => {
    await ensureSchema();
  });

  beforeEach(async () => {
    await resetData();
  });

  it("GET /reports/summary returns soft-launch envelope, no auth needed", async () => {
    const res = await request(createApp()).get("/api/v1/reports/summary");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // softLaunch flag is the marketing site's signal to render the
    // "Soft launch — angka akan terisi otomatis…" copy.
    expect(res.body.data.softLaunch).toBe(true);
    expect(typeof res.body.data.activeCustomers).toBe("number");
    expect(typeof res.body.data.totalOrdersAllTime).toBe("number");
    expect(typeof res.body.data.activeOrders).toBe("number");
    expect(typeof res.body.data.revenueMonth).toBe("number");
  });

  it("GET /reports/activity returns array; masks customer names to first + last initial", async () => {
    // Seed one order linked to a customer whose name has a last name.
    const db = await getPool();
    const customerId = randomUUID();
    const orderId = randomUUID();
    await db.query(
      "INSERT INTO customers (id, name, phone, branch_id) VALUES ($1, $2, $3, $4)",
      [customerId, "Aulia Putri Rahmadani", "628111111111", randomUUID()]
    );
    await db.query(
      "INSERT INTO orders (id, customer_id, branch_id, order_number, status, payment_status, total_amount, idempotency_key) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
      [orderId, customerId, randomUUID(), `SO-${Date.now()}-A`, "draft", "pending", 150000, randomUUID()]
    );

    const res = await request(createApp()).get("/api/v1/reports/activity");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);

    const seeded = res.body.data.find((row: { id: string }) => row.id === orderId);
    expect(seeded).toBeDefined();
    // The full last name MUST NOT appear in the public feed.
    expect(seeded.text).not.toContain("Putri");
    expect(seeded.text).not.toContain("Rahmadani");
    // But the first name + last initial form must be present.
    expect(seeded.text).toContain("Aulia P.");
  });

  it("GET /reports/activity falls back to first-name-only when name has no surname", async () => {
    const db = await getPool();
    const customerId = randomUUID();
    const orderId = randomUUID();
    await db.query(
      "INSERT INTO customers (id, name, phone, branch_id) VALUES ($1, $2, $3, $4)",
      [customerId, "Singlename", "628222222222", randomUUID()]
    );
    await db.query(
      "INSERT INTO orders (id, customer_id, branch_id, order_number, status, payment_status, total_amount, idempotency_key) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
      [orderId, customerId, randomUUID(), `SO-${Date.now()}-B`, "draft", "pending", 80000, randomUUID()]
    );

    const res = await request(createApp()).get("/api/v1/reports/activity");
    const seeded = res.body.data.find((row: { id: string }) => row.id === orderId);
    expect(seeded).toBeDefined();
    expect(seeded.text).toContain("Singlename");
    expect(seeded.text).not.toMatch(/Singlename\s+[A-Z]\./); // no fake initial appended
  });

  it("GET /reports/testimonials never 5xx — returns empty array when table missing", async () => {
    const res = await request(createApp()).get("/api/v1/reports/testimonials");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
