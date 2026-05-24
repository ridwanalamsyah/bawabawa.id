import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app";
import { getPool } from "../infrastructure/db/pool";
import { ensureSchema, hasPostgres, resetData } from "./helpers/db-setup";

/**
 * PR #50 — admin manual order entry endpoint.
 *
 *   POST /api/v1/orders/manual
 *   Guards: authGuard, requirePermission("orders:create")
 *
 * Tests cover:
 *   - Auth gates (401 + 403).
 *   - Schema validation (channel enum, required fields).
 *   - Customer upsert path: a fresh phone creates the customer; the
 *     same phone (in a different format) reuses it.
 *   - Idempotency key is auto-generated server-side (manual-<uuid>),
 *     so the same form submission twice is treated as two distinct
 *     orders — admins explicitly clicking "save" twice = two orders.
 */
describe.skipIf(!hasPostgres)("POST /orders/manual (PR #50)", () => {
  const ACCESS_SECRET =
    process.env.JWT_ACCESS_SECRET ?? "test-JWT_ACCESS_SECRET";

  function signToken(opts: { permissions?: string[] } = {}) {
    return jwt.sign(
      {
        sub: randomUUID(),
        roles: ["admin"],
        permissions: opts.permissions ?? ["orders:create"]
      },
      ACCESS_SECRET,
      { expiresIn: "15m" }
    );
  }

  beforeAll(async () => {
    await ensureSchema();
  });

  beforeEach(async () => {
    await resetData();
  });

  function payload(overrides: Record<string, unknown> = {}) {
    return {
      customerName: "Aulia Putri",
      customerPhone: "08123456789",
      branchId: randomUUID(),
      totalAmount: 150000,
      sourceChannel: "instagram",
      notes: "DM: minta packing dobel bubblewrap",
      ...overrides
    };
  }

  it("rejects requests without a bearer token with 401", async () => {
    const res = await request(createApp())
      .post("/api/v1/orders/manual")
      .send(payload());
    expect(res.status).toBe(401);
  });

  it("rejects callers without orders:create permission with 403", async () => {
    const token = signToken({ permissions: ["unrelated:read"] });
    const res = await request(createApp())
      .post("/api/v1/orders/manual")
      .set("Authorization", `Bearer ${token}`)
      .send(payload());
    expect(res.status).toBe(403);
  });

  it("rejects requests with an unsupported sourceChannel via schema (4xx)", async () => {
    const token = signToken();
    const res = await request(createApp())
      .post("/api/v1/orders/manual")
      .set("Authorization", `Bearer ${token}`)
      .send(payload({ sourceChannel: "tiktok" }));
    // Zod schema rejection — the exact code (400 vs 422) depends on the
    // shared error handler; we just want to assert the request never
    // creates an order.
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  it("creates a new order + customer for a first-time manual entry", async () => {
    const token = signToken();
    const branchId = randomUUID();
    const uniquePhone = `0812${Math.floor(Math.random() * 1e9)
      .toString()
      .padStart(9, "0")}`;
    const res = await request(createApp())
      .post("/api/v1/orders/manual")
      .set("Authorization", `Bearer ${token}`)
      .send(
        payload({
          customerName: "Manual Customer",
          customerPhone: uniquePhone,
          branchId,
          sourceChannel: "whatsapp"
        })
      );
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.sourceChannel).toBe("whatsapp");
    expect(res.body.data.idempotencyKey).toMatch(/^manual-/);
    expect(typeof res.body.data.orderNumber).toBe("string");
    // Verify the customer row was actually created with normalized phone.
    const db = await getPool();
    const normalized = uniquePhone.replace(/\D+/g, "").replace(/^0/, "62");
    const result = await db.query<{ id: string }>(
      "SELECT id FROM customers WHERE phone = $1",
      [normalized]
    );
    expect(result.rowCount).toBe(1);
  });

  it("reuses the same customer row when two manual orders share a phone (across input formats)", async () => {
    const token = signToken();
    const branchId = randomUUID();
    const rawDigits = `812${Math.floor(Math.random() * 1e9)
      .toString()
      .padStart(9, "0")}`;
    // First call: dashes + leading 0.
    const first = await request(createApp())
      .post("/api/v1/orders/manual")
      .set("Authorization", `Bearer ${token}`)
      .send(
        payload({
          customerName: "Repeat Customer",
          customerPhone: `0${rawDigits.slice(0, 3)}-${rawDigits.slice(3, 7)}-${rawDigits.slice(7)}`,
          branchId,
          sourceChannel: "dm"
        })
      );
    expect(first.status).toBe(201);

    // Second call: + and spaces. Different surface representation, same
    // canonical phone, so we expect the SAME customer id but a NEW order.
    const second = await request(createApp())
      .post("/api/v1/orders/manual")
      .set("Authorization", `Bearer ${token}`)
      .send(
        payload({
          customerName: "Repeat Customer (typo)",
          customerPhone: `+62 ${rawDigits.slice(0, 3)} ${rawDigits.slice(3, 7)} ${rawDigits.slice(7)}`,
          branchId,
          sourceChannel: "telepon"
        })
      );
    expect(second.status).toBe(201);

    expect(first.body.data.customerId).toBe(second.body.data.customerId);
    expect(first.body.data.id).not.toBe(second.body.data.id);
    expect(first.body.data.idempotencyKey).not.toBe(second.body.data.idempotencyKey);
  });
});
