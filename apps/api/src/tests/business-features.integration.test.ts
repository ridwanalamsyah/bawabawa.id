import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import { createApp } from "../app";
import { getPool } from "../infrastructure/db/pool";
import { permissionsForDivision } from "../common/security/permissions";
import { hasPostgres } from "./helpers/db-setup";

/** Kilat tier, PO cutoff, reviews, partner enquiries and cron (needs migration 022). */
describe.skipIf(!hasPostgres)("business features", () => {
  const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? "test-JWT_ACCESS_SECRET";
  const app = createApp();
  const staff = jwt.sign(
    { sub: randomUUID(), roles: ["admin"], permissions: permissionsForDivision("admin") },
    ACCESS_SECRET,
    { expiresIn: "15m" }
  );
  const base = {
    source: "request",
    customerName: "Budi Santoso",
    customerPhone: "081299990000",
    address: { street: "Jl. Juanda No. 5", city: "Samarinda", postal: "75124" },
    items: [{ name: "Kemeja flanel", category: "Fashion", qty: 1, maxPrice: 250000 }],
    outOfStockPreference: "ask"
  };

  afterEach(() => {
    delete process.env.KILAT_PER_KG;
    delete process.env.KILAT_MIN_KG;
    delete process.env.CRON_SECRET;
  });

  it("refuses Kilat until it is configured, then prices it with the minimum weight", async () => {
    const off = await request(app).post("/api/v1/public/order-requests").send({ ...base, tier: "air" });
    expect(off.status).toBe(422);
    expect(off.body.error.code).toBe("KILAT_UNAVAILABLE");

    process.env.KILAT_PER_KG = "90000";
    process.env.KILAT_MIN_KG = "2";
    const on = await request(app).post("/api/v1/public/order-requests").send({ ...base, tier: "air", estimatedKg: 0.4 });
    expect(on.status).toBe(201);
    expect(on.body.data.estimate.shippingFee).toBe(180000);
  });

  it("blocks battery items from flying", async () => {
    process.env.KILAT_PER_KG = "90000";
    const res = await request(app)
      .post("/api/v1/public/order-requests")
      .send({ ...base, tier: "air", items: [{ name: "Powerbank", category: "Elektronik", qty: 1, maxPrice: 300000 }] });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("KILAT_RESTRICTED_ITEM");
  });

  it("closes cargo orders after the trip's PO cutoff", async () => {
    const db = await getPool();
    const tripId = randomUUID();
    await db.query(
      `INSERT INTO trips (id, code, origin, destination, depart_at, capacity_kg, status, is_published, po_closes_at)
       VALUES ($1, $2, 'Bandung', 'Samarinda', NOW() + INTERVAL '5 days', 100, 'open', TRUE, NOW() - INTERVAL '1 hour')`,
      [tripId, `PO-${tripId.slice(0, 6).toUpperCase()}`]
    );
    const res = await request(app).post("/api/v1/public/order-requests").send({ ...base, tier: "batch", tripId });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("PO_CLOSED");

    const trips = await request(app).get("/api/v1/trips");
    expect(trips.body.data.find((t: { id: string }) => t.id === tripId).poClosesAt).toBeTruthy();
  });

  it("accepts one verified review after delivery and publishes it on approval", async () => {
    const created = await request(app).post("/api/v1/public/order-requests").send({ ...base, tier: "fast" });
    const { id, trackingToken } = created.body.data;

    const early = await request(app)
      .post(`/api/v1/public/order-requests/${trackingToken}/review`)
      .send({ rating: 5, body: "Barang sampai dengan aman, mantap!" });
    expect(early.status).toBe(409);

    await (await getPool()).query("UPDATE order_requests SET status = 'delivered' WHERE id = $1", [id]);
    const view = await request(app).get(`/api/v1/public/order-requests/${trackingToken}`);
    expect(view.body.data.canReview).toBe(true);

    const ok = await request(app)
      .post(`/api/v1/public/order-requests/${trackingToken}/review`)
      .send({ rating: 5, body: "Barang sampai dengan aman, mantap!" });
    expect(ok.status).toBe(201);
    const dup = await request(app)
      .post(`/api/v1/public/order-requests/${trackingToken}/review`)
      .send({ rating: 4, body: "Kirim lagi ulasan kedua ya." });
    expect(dup.status).toBe(409);

    const list = await request(app).get("/api/v1/admin/reviews").set("authorization", `Bearer ${staff}`);
    const review = list.body.data.find((r: { body: string }) => r.body.startsWith("Barang sampai"));
    expect(review.customerName).toBe("Budi S.");
    expect(review.isPublished).toBe(false);

    const before = await request(app).get("/api/v1/reports/testimonials");
    expect(before.body.data.some((t: { id: string }) => t.id === review.id)).toBe(false);
    await request(app)
      .patch(`/api/v1/admin/reviews/${review.id}`)
      .set("authorization", `Bearer ${staff}`)
      .send({ isPublished: true });
    const after = await request(app).get("/api/v1/reports/testimonials");
    expect(after.body.data.some((t: { id: string }) => t.id === review.id)).toBe(true);
  });

  it("records partner enquiries for the admin", async () => {
    const res = await request(app)
      .post("/api/v1/public/partner-inquiries")
      .send({ kind: "reseller", name: "Toko Rina", phone: "0812-1111-2222", city: "Samarinda", monthlyVolumeKg: 30 });
    expect(res.status).toBe(201);
    const list = await request(app).get("/api/v1/admin/partner-inquiries").set("authorization", `Bearer ${staff}`);
    expect(list.body.data.some((r: { name: string; phone: string }) => r.name === "Toko Rina" && r.phone === "6281211112222")).toBe(true);
  });

  it("cron reminds each stale quote once", async () => {
    const created = await request(app).post("/api/v1/public/order-requests").send({ ...base, tier: "fast" });
    await (await getPool()).query(
      "UPDATE order_requests SET status = 'quoted', quoted_at = NOW() - INTERVAL '2 days' WHERE id = $1",
      [created.body.data.id]
    );
    process.env.CRON_SECRET = "cron-secret-value";
    const first = await request(app).get("/api/v1/cron/run").set("authorization", "Bearer cron-secret-value");
    expect(first.status).toBe(200);
    expect(first.body.data.quoteReminders).toBeGreaterThanOrEqual(1);
    const second = await request(app).get("/api/v1/cron/run").set("authorization", "Bearer cron-secret-value");
    expect(second.body.data.quoteReminders).toBe(0);
  });
});
