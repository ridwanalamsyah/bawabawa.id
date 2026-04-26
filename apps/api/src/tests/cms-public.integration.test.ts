import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../app";

/**
 * End-to-end smoke for the public CMS endpoints. Ensures that nothing the
 * frontend depends on for the very first paint (brand identity + nav) regresses
 * silently. Runs against the in-memory SQLite seed populated by
 * `infrastructure/db/pool.ts`.
 */
describe("cms public endpoints", () => {
  // Make sure the in-memory db is stable across tests in this file.
  beforeAll(() => {
    process.env.NODE_ENV = "test";
  });
  afterAll(() => {
    // No-op: the SQLite path is per-process and gets reset by the suite runner.
  });

  it("GET /api/v1/cms/settings/public returns brand + seo + feature_flags without auth", async () => {
    const app = createApp();
    const res = await request(app).get("/api/v1/cms/settings/public");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const rows = res.body.data as Array<{ key: string }>;
    expect(Array.isArray(rows)).toBe(true);
    const keys = rows.map((r) => r.key).sort();
    expect(keys).toContain("brand");
    expect(keys).toContain("seo");
    expect(keys).toContain("feature_flags");
    // Auth-sensitive payloads (contact email, etc.) must NOT be exposed publicly.
    expect(keys).not.toContain("contact");
    expect(keys).not.toContain("social");
  });

  it("GET /api/v1/cms/nav returns the seeded navigation tree", async () => {
    const app = createApp();
    const res = await request(app).get("/api/v1/cms/nav");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    // Default seed ships 9 items; allow for admins having edited the table.
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it("rejects writes without authentication", async () => {
    const app = createApp();
    const res = await request(app)
      .put("/api/v1/cms/settings/brand")
      .send({ value: { name: "Hijack" } });
    expect([401, 403]).toContain(res.status);
  });
});
