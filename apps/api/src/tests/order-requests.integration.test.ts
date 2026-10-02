import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../app";
import { getPool } from "../infrastructure/db/pool";
import { permissionsForDivision } from "../common/security/permissions";
import { hasPostgres } from "./helpers/db-setup";

/**
 * End-to-end jastip flow against Postgres (needs migrations 020/021):
 * guest submits → team quotes → guest approves → team moves it along.
 */
describe.skipIf(!hasPostgres)("order requests (public jastip flow)", () => {
  const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? "test-JWT_ACCESS_SECRET";
  const app = createApp();
  const staff = jwt.sign(
    { sub: randomUUID(), roles: ["operations"], permissions: permissionsForDivision("operations") },
    ACCESS_SECRET,
    { expiresIn: "15m" }
  );
  const sales = jwt.sign(
    { sub: randomUUID(), roles: ["support"], permissions: permissionsForDivision("support") },
    ACCESS_SECRET,
    { expiresIn: "15m" }
  );

  const body = {
    source: "request",
    customerName: "Aulia Putri",
    customerPhone: "0812-3456-7890",
    address: { street: "Jl. Pahlawan No. 10", city: "Samarinda", postal: "75123" },
    tier: "fast",
    items: [{ name: "Sepatu Compass Gazelle", qty: 1, maxPrice: 450000, variant: "Hitam, 40" }],
    outOfStockPreference: "ask"
  };

  beforeAll(async () => {
    const db = await getPool();
    await db.query("SELECT 1 FROM order_requests LIMIT 1");
  });

  it("rejects invalid submissions with field-level errors", async () => {
    const res = await request(app)
      .post("/api/v1/public/order-requests")
      .send({ ...body, address: { ...body.address, postal: "12" } });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("requires a trip for cargo (batch) orders", async () => {
    const res = await request(app).post("/api/v1/public/order-requests").send({ ...body, tier: "batch" });
    expect(res.status).toBe(400);
  });

  it("runs submit → quote → approve → paid → shipped", async () => {
    const created = await request(app).post("/api/v1/public/order-requests").send(body);
    expect(created.status).toBe(201);
    const { trackingToken, code, id, status } = created.body.data;
    expect(code).toMatch(/^BWB-[A-Z0-9]{6}$/);
    expect(status).toBe("submitted");
    expect(trackingToken.length).toBeGreaterThanOrEqual(32);

    const view = await request(app).get(`/api/v1/public/order-requests/${trackingToken}`);
    expect(view.status).toBe(200);
    expect(view.body.data.customerPhone).toContain("••••");
    expect(view.body.data.canApprove).toBe(false);
    // PPN is off by default and never charged on the goods themselves.
    expect(view.body.data.estimate.ppn).toBe(0);

    // Approving before a quote exists is refused.
    const early = await request(app).post(`/api/v1/public/order-requests/${trackingToken}/approve`);
    expect(early.status).toBe(409);

    // A support account can read but not quote.
    const forbidden = await request(app)
      .post(`/api/v1/admin/orders/requests/${id}/quote`)
      .set("authorization", `Bearer ${sales}`)
      .send({ itemsTotal: 430000, shippingFee: 43000 });
    expect(forbidden.status).toBe(403);

    const quoted = await request(app)
      .post(`/api/v1/admin/orders/requests/${id}/quote`)
      .set("authorization", `Bearer ${staff}`)
      .send({ itemsTotal: 430000, shippingFee: 43000, note: "Stok ada, warna hitam" });
    expect(quoted.status).toBe(200);
    expect(quoted.body.data.status).toBe("quoted");
    expect(quoted.body.data.quote.total).toBe(430000 + 34400 + 43000);

    const approved = await request(app).post(`/api/v1/public/order-requests/${trackingToken}/approve`);
    expect(approved.status).toBe(200);
    expect(approved.body.data.status).toBe("approved");

    const skip = await request(app)
      .post(`/api/v1/admin/orders/requests/${id}/status`)
      .set("authorization", `Bearer ${staff}`)
      .send({ status: "shipped" });
    expect(skip.status).toBe(409);

    for (const next of ["paid", "purchasing", "packed"]) {
      const res = await request(app)
        .post(`/api/v1/admin/orders/requests/${id}/status`)
        .set("authorization", `Bearer ${staff}`)
        .send({ status: next });
      expect(res.status).toBe(200);
    }
    const shipped = await request(app)
      .post(`/api/v1/admin/orders/requests/${id}/status`)
      .set("authorization", `Bearer ${staff}`)
      .send({ status: "shipped", trackingNumber: "JNE123456" });
    expect(shipped.body.data.trackingNumber).toBe("JNE123456");

    const final = await request(app).get(`/api/v1/public/order-requests/${trackingToken}`);
    expect(final.body.data.status).toBe("shipped");
    expect(final.body.data.history.map((h: { status: string }) => h.status)).toEqual([
      "submitted",
      "quoted",
      "approved",
      "paid",
      "purchasing",
      "packed",
      "shipped"
    ]);
    expect(final.body.data.canCancel).toBe(false);

    const list = await request(app)
      .get("/api/v1/admin/orders/requests?status=shipped")
      .set("authorization", `Bearer ${staff}`);
    expect(list.status).toBe(200);
    expect(list.body.data.items.some((r: { id: string }) => r.id === id)).toBe(true);
  });

  it("prices catalog orders from the database, not the client", async () => {
    const db = await getPool();
    const productId = randomUUID();
    await db.query(
      `INSERT INTO products (id, sku, name, unit_price, current_stock, weight_kg, is_catalog, catalog_category)
       VALUES ($1, $2, 'Bolu Kartika Sari', 85000, 0, 0.6, TRUE, 'Snack Khas Bandung')`,
      [productId, `T-${productId.slice(0, 8)}`]
    );
    const catalog = await request(app).get("/api/v1/catalog");
    expect(catalog.body.data.some((p: { id: string }) => p.id === productId)).toBe(true);

    const res = await request(app)
      .post("/api/v1/public/order-requests")
      .send({
        ...body,
        source: "catalog",
        items: [{ name: "anything", productId, qty: 2, maxPrice: 1 }]
      });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe("approved");
    expect(res.body.data.estimate.itemsTotal).toBe(170000);
  });

  it("lets a guest cancel before payment", async () => {
    const created = await request(app).post("/api/v1/public/order-requests").send(body);
    const token = created.body.data.trackingToken;
    const cancelled = await request(app)
      .post(`/api/v1/public/order-requests/${token}/cancel`)
      .send({ reason: "Salah pilih ukuran" });
    expect(cancelled.status).toBe(200);
    expect(cancelled.body.data.status).toBe("cancelled");
  });
});
