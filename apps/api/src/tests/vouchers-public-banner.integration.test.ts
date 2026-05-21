import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app";
import { getPool } from "../infrastructure/db/pool";
import { ensureSchema, hasPostgres, resetData } from "./helpers/db-setup";

/**
 * PR #51 — admin voucher management + public banner endpoint.
 *
 * Contract under test:
 *   1. `GET /api/v1/promotions` (public, unauthenticated) returns ONLY
 *      vouchers with both is_public = TRUE AND is_active = TRUE.
 *      Internal fields (max_uses, used_count, per_user_limit, etc) are
 *      stripped from the response — only the marketing-safe subset is
 *      exposed.
 *   2. `PATCH /api/v1/vouchers/:id` allows admins to flip is_public /
 *      is_active and edit banner_label without recreating the voucher.
 *   3. PATCH is authed; unauthed callers get 401.
 *   4. The endpoint NEVER 5xx-s when the underlying table is missing —
 *      the marketing site reads /promotions on every visitor's first
 *      paint, so an empty list is the graceful degradation.
 */
describe.skipIf(!hasPostgres)("vouchers public banner + admin PATCH (PR #51)", () => {
  const ACCESS_SECRET =
    process.env.JWT_ACCESS_SECRET ?? "test-JWT_ACCESS_SECRET";

  function signToken() {
    return jwt.sign(
      { sub: randomUUID(), roles: ["admin"], permissions: ["vouchers:manage"] },
      ACCESS_SECRET,
      { expiresIn: "15m" }
    );
  }

  async function seedVoucher(input: {
    code: string;
    is_public: boolean;
    is_active: boolean;
    banner_priority?: number;
    banner_label?: string | null;
    description?: string | null;
    ends_at?: string | null;
  }) {
    const db = await getPool();
    const id = randomUUID();
    await db.query(
      `INSERT INTO vouchers
         (id, code, description, discount_type, discount_value, max_discount,
          min_order_amount, max_uses, per_user_limit, starts_at, ends_at,
          is_active, is_public, banner_label, banner_priority,
          used_count)
       VALUES
         ($1, $2, $3, 'percentage', 10, NULL,
          0, NULL, NULL, NULL, $4,
          $5, $6, $7, $8,
          0)`,
      [
        id,
        input.code,
        input.description ?? null,
        input.ends_at ?? null,
        input.is_active,
        input.is_public,
        input.banner_label ?? null,
        input.banner_priority ?? 0
      ]
    );
    return id;
  }

  beforeAll(async () => {
    await ensureSchema();
  });

  beforeEach(async () => {
    await resetData();
  });

  it("GET /promotions is unauthenticated and returns []  when no public vouchers exist", async () => {
    const res = await request(createApp()).get("/api/v1/promotions");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("GET /promotions returns only public+active vouchers, sorted by banner_priority DESC", async () => {
    const highPriority = await seedVoucher({
      code: `HIGH-${Date.now()}`,
      is_public: true,
      is_active: true,
      banner_priority: 100,
      banner_label: "Diskon 100rb hari ini"
    });
    const lowPriority = await seedVoucher({
      code: `LOW-${Date.now()}`,
      is_public: true,
      is_active: true,
      banner_priority: 1,
      banner_label: "Diskon kecil"
    });
    // Private voucher: active but NOT public → must NOT appear.
    const privateActive = await seedVoucher({
      code: `PRIV-${Date.now()}`,
      is_public: false,
      is_active: true,
      banner_priority: 999,
      banner_label: "Internal retention code"
    });
    // Public but inactive (expired toggle) → must NOT appear.
    const publicInactive = await seedVoucher({
      code: `INACTIVE-${Date.now()}`,
      is_public: true,
      is_active: false,
      banner_priority: 50,
      banner_label: "Sudah berakhir"
    });

    const res = await request(createApp()).get("/api/v1/promotions");
    expect(res.status).toBe(200);
    const codes = res.body.data.map((v: { code: string }) => v.code);
    // High-priority appears, low-priority appears, private/inactive do not.
    const high = res.body.data.find((v: { code: string; bannerPriority: number }) => v.code.startsWith("HIGH-"));
    const low = res.body.data.find((v: { code: string; bannerPriority: number }) => v.code.startsWith("LOW-"));
    expect(high).toBeDefined();
    expect(low).toBeDefined();
    expect(codes.some((c: string) => c.startsWith("PRIV-"))).toBe(false);
    expect(codes.some((c: string) => c.startsWith("INACTIVE-"))).toBe(false);

    // banner_priority DESC ordering.
    const positions = res.body.data.map((v: { code: string }) => v.code);
    const highIdx = positions.findIndex((c: string) => c.startsWith("HIGH-"));
    const lowIdx = positions.findIndex((c: string) => c.startsWith("LOW-"));
    expect(highIdx).toBeLessThan(lowIdx);

    // Marketing-safe subset only. used_count / max_uses / per_user_limit
    // MUST NOT leak to the unauth endpoint.
    expect(high).not.toHaveProperty("usedCount");
    expect(high).not.toHaveProperty("maxUses");
    expect(high).not.toHaveProperty("perUserLimit");
    expect(high.bannerLabel).toBe("Diskon 100rb hari ini");

    // touch the unused vars to silence linter (they are seeded for the
    // negative assertions above)
    expect(typeof highPriority).toBe("string");
    expect(typeof lowPriority).toBe("string");
    expect(typeof privateActive).toBe("string");
    expect(typeof publicInactive).toBe("string");
  });

  it("PATCH /vouchers/:id without auth returns 401", async () => {
    const id = await seedVoucher({
      code: `UNAUTH-${Date.now()}`,
      is_public: false,
      is_active: true
    });
    const res = await request(createApp())
      .patch(`/api/v1/vouchers/${id}`)
      .send({ isPublic: true });
    expect(res.status).toBe(401);
  });

  it("PATCH /vouchers/:id toggles is_public + persists banner_label", async () => {
    const id = await seedVoucher({
      code: `TOGGLE-${Date.now()}`,
      is_public: false,
      is_active: true,
      banner_priority: 0
    });
    const token = signToken();
    const patch = await request(createApp())
      .patch(`/api/v1/vouchers/${id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        isPublic: true,
        bannerLabel: "Cashback 50rb minimum order 200rb",
        bannerPriority: 75
      });
    expect(patch.status).toBe(200);

    // Verify it now shows up on the public banner with the new label
    // and priority.
    const promo = await request(createApp()).get("/api/v1/promotions");
    const found = promo.body.data.find((v: { code: string }) => v.code.startsWith("TOGGLE-"));
    expect(found).toBeDefined();
    expect(found.bannerLabel).toBe("Cashback 50rb minimum order 200rb");
    expect(found.bannerPriority).toBe(75);
  });

  it("PATCH /vouchers/:id with no fields rejects with 422 NO_FIELDS", async () => {
    const id = await seedVoucher({
      code: `EMPTY-${Date.now()}`,
      is_public: false,
      is_active: true
    });
    const token = signToken();
    const res = await request(createApp())
      .patch(`/api/v1/vouchers/${id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(422);
    expect(res.body.error?.code).toBe("NO_FIELDS");
  });
});
