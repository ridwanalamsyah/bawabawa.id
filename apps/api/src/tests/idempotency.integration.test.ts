// ESM import hoisting means we can't reliably set env vars here; instead we
// mirror `requireEnv`'s test fallback so our signed JWT matches the secret
// auth.ts captured at module load time.
import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../app";
import { getPool } from "../infrastructure/db/pool";


describe("idempotency middleware", () => {
  beforeAll(async () => {
    // Ensure the idempotency table exists in SQLite before the test app boots.
    const db = await getPool();
    await db.query(
      `CREATE TABLE IF NOT EXISTS idempotent_responses (
         key TEXT NOT NULL,
         actor_id TEXT,
         method TEXT NOT NULL,
         path TEXT NOT NULL,
         request_hash TEXT NOT NULL,
         status_code INTEGER NOT NULL,
         response_json TEXT NOT NULL,
         created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
         PRIMARY KEY (key, actor_id, method, path)
       )`
    );
    await db.query(
      `CREATE TABLE IF NOT EXISTS customers (
         id TEXT PRIMARY KEY,
         name TEXT NOT NULL,
         phone TEXT,
         branch_id TEXT
       )`
    );
  });

  const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? "test-JWT_ACCESS_SECRET";

  function signToken(userId: string) {
    return jwt.sign(
      { sub: userId, roles: ["admin"], permissions: ["crm:manage", "orders:create"] },
      ACCESS_SECRET,
      { expiresIn: "15m" }
    );
  }

  it("returns cached response on replay with same key + same body", async () => {
    const userId = randomUUID();
    const token = signToken(userId);
    const key = `idem-${randomUUID()}`;
    const body = {
      name: "Customer A",
      phone: "08123456789",
      branchId: randomUUID()
    };

    const first = await request(createApp())
      .post("/api/v1/crm/customers")
      .set("Authorization", `Bearer ${token}`)
      .set("x-idempotency-key", key)
      .send(body);
    expect(first.status).toBe(201);
    const firstId = first.body.data.id;

    const replay = await request(createApp())
      .post("/api/v1/crm/customers")
      .set("Authorization", `Bearer ${token}`)
      .set("x-idempotency-key", key)
      .send(body);
    expect(replay.status).toBe(201);
    expect(replay.body.data.id).toBe(firstId);
  });

  it("returns 409 when same key is reused with a different body", async () => {
    const userId = randomUUID();
    const token = signToken(userId);
    const key = `idem-${randomUUID()}`;

    const first = await request(createApp())
      .post("/api/v1/crm/customers")
      .set("Authorization", `Bearer ${token}`)
      .set("x-idempotency-key", key)
      .send({ name: "Original Name", phone: "08111111111", branchId: randomUUID() });
    expect(first.status).toBe(201);

    const conflict = await request(createApp())
      .post("/api/v1/crm/customers")
      .set("Authorization", `Bearer ${token}`)
      .set("x-idempotency-key", key)
      .send({ name: "Different Name", phone: "08222222222", branchId: randomUUID() });
    expect(conflict.status).toBe(409);
    expect(conflict.body.error.code).toBe("IDEMPOTENCY_KEY_CONFLICT");
  });

  it("scopes keys per-actor — different users can reuse the same key", async () => {
    const key = `idem-shared-${randomUUID()}`;
    const body = {
      name: "Shared Key Customer",
      phone: "08333333333",
      branchId: randomUUID()
    };

    const userA = signToken(randomUUID());
    const userB = signToken(randomUUID());

    const resA = await request(createApp())
      .post("/api/v1/crm/customers")
      .set("Authorization", `Bearer ${userA}`)
      .set("x-idempotency-key", key)
      .send(body);
    const resB = await request(createApp())
      .post("/api/v1/crm/customers")
      .set("Authorization", `Bearer ${userB}`)
      .set("x-idempotency-key", key)
      .send(body);
    expect(resA.status).toBe(201);
    expect(resB.status).toBe(201);
    expect(resA.body.data.id).not.toBe(resB.body.data.id);
  });

  it("no-ops when header is absent (endpoints without required=true)", async () => {
    const token = signToken(randomUUID());
    const res = await request(createApp())
      .post("/api/v1/crm/customers")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "No Key", phone: "08444444444", branchId: randomUUID() });
    expect(res.status).toBe(201);
  });
});
