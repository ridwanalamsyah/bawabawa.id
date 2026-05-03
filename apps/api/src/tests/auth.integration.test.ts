import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app";
import { requireEnv } from "../common/security/env";
import { __resetEnvCacheForTests } from "../config/env";
import { getPool } from "../infrastructure/db/pool";

const ORIGINAL_ENV = { ...process.env };

function resetEnv(): void {
  for (const key of Object.keys(process.env)) {
    if (!(key in ORIGINAL_ENV)) delete process.env[key];
  }
  for (const [key, value] of Object.entries(ORIGINAL_ENV)) {
    process.env[key] = value;
  }
  __resetEnvCacheForTests();
}

describe("auth endpoints", () => {
  beforeEach(resetEnv);
  afterEach(resetEnv);

  it("GET /auth/config exposes googleClientId+demoMode without leaking secrets", async () => {
    process.env.NODE_ENV = "test";
    process.env.GOOGLE_OAUTH_CLIENT_ID = "test-client-id.apps.googleusercontent.com";
    const res = await request(createApp()).get("/api/v1/auth/config");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.googleClientId).toBe("test-client-id.apps.googleusercontent.com");
    expect(res.body.data).not.toHaveProperty("clientSecret");
    expect(res.body.data).not.toHaveProperty("idToken");
    expect(res.body.data.demoMode).toBe(false);
  });

  it("POST /auth/google rejects when GOOGLE_OAUTH_CLIENT_ID is unset", async () => {
    process.env.NODE_ENV = "test";
    delete process.env.GOOGLE_OAUTH_CLIENT_ID;
    const res = await request(createApp())
      .post("/api/v1/auth/google")
      .send({ idToken: "x".repeat(40) });
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe("OAUTH_NOT_CONFIGURED");
  });

  it("POST /auth/google rejects bogus idToken when configured", async () => {
    process.env.NODE_ENV = "test";
    process.env.GOOGLE_OAUTH_CLIENT_ID = "test-client-id.apps.googleusercontent.com";
    const res = await request(createApp())
      .post("/api/v1/auth/google")
      .send({ idToken: "x".repeat(40) });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("INVALID_ID_TOKEN");
  });

  it("POST /auth/login is gated to demo mode + non-production", async () => {
    process.env.NODE_ENV = "test"; // DEMO_MODE defaults to false in test
    const res = await request(createApp())
      .post("/api/v1/auth/login")
      .send({ email: "admin@erp.com", password: "admin123" });
    expect(res.status).toBe(410);
    expect(res.body.error.code).toBe("EMAIL_LOGIN_DISABLED");
  });

  it("POST /auth/refresh rejects suspended users with 403 ACCOUNT_NOT_ACTIVE", async () => {
    process.env.NODE_ENV = "test"; // DEMO_MODE defaults to false → DB-backed refresh

    const userId = randomUUID();
    // requireEnv returns the same fallback ("test-JWT_REFRESH_SECRET") that
    // auth.service.ts captured at module load, so signatures match without
    // racing module-import order.
    const secret = requireEnv("JWT_REFRESH_SECRET");
    const refreshToken = jwt.sign({ sub: userId }, secret, {
      expiresIn: "7d"
    });
    const refreshHash = await argon2.hash(refreshToken);
    const pool = await getPool();

    // Pre-seed a suspended user + a still-valid refresh-token session so the
    // session lookup succeeds and we exercise the new status guard.
    await pool.query(
      `INSERT INTO users (id, email, password_hash, full_name, division, status, is_active)
       VALUES ($1, $2, NULL, $3, $4, 'suspended', 1)`,
      [userId, `suspended-${userId}@example.com`, "Suspended User", "ops"]
    );
    await pool.query(
      `INSERT INTO user_sessions (id, user_id, refresh_token_hash, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [randomUUID(), userId, refreshHash, new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString()]
    );

    const res = await request(createApp())
      .post("/api/v1/auth/refresh")
      .send({ refreshToken });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("ACCOUNT_NOT_ACTIVE");

    // The session that just authenticated should now be revoked, so a replay
    // is rejected as INVALID_REFRESH_TOKEN (no matching active session).
    const replay = await request(createApp())
      .post("/api/v1/auth/refresh")
      .send({ refreshToken });
    expect(replay.status).toBe(401);
    expect(replay.body.error.code).toBe("INVALID_REFRESH_TOKEN");
  });

  it("POST /auth/refresh rejects is_active=0 users (SQLite integer truthiness)", async () => {
    process.env.NODE_ENV = "test";

    const userId = randomUUID();
    const refreshToken = jwt.sign({ sub: userId }, requireEnv("JWT_REFRESH_SECRET"), {
      expiresIn: "7d"
    });
    const refreshHash = await argon2.hash(refreshToken);
    const pool = await getPool();

    // status='active' but is_active=0. With strict `!== false` this would
    // pass (because 0 !== false under strict equality on SQLite); the
    // truthy check correctly rejects.
    await pool.query(
      `INSERT INTO users (id, email, password_hash, full_name, division, status, is_active)
       VALUES ($1, $2, NULL, $3, $4, 'active', 0)`,
      [userId, `inactive-${userId}@example.com`, "Inactive User", "ops"]
    );
    await pool.query(
      `INSERT INTO user_sessions (id, user_id, refresh_token_hash, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [randomUUID(), userId, refreshHash, new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString()]
    );

    const res = await request(createApp())
      .post("/api/v1/auth/refresh")
      .send({ refreshToken });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("ACCOUNT_NOT_ACTIVE");
  });

  it("upsertGoogleUser SELECT prefers (oauth_subject) match over email match", async () => {
    process.env.NODE_ENV = "test";
    const pool = await getPool();
    const sharedEmail = `shared-${randomUUID().slice(0, 8)}@example.com`;
    const subId = `google-sub-${randomUUID().slice(0, 8)}`;
    const subRowId = randomUUID();
    const emailRowId = randomUUID();

    // Row A — older row, email-only match (no oauth link). This row would
    // get picked by the legacy LIMIT 1 query if there were no ORDER BY.
    await pool.query(
      `INSERT INTO users (id, email, password_hash, full_name, division, status, is_active, created_at)
       VALUES ($1, $2, NULL, $3, $4, 'active', 1, '2020-01-01 00:00:00')`,
      [emailRowId, sharedEmail, "Email Match Row", "ops"]
    );
    // Row B — newer row, authoritative oauth_subject match. We want this one.
    await pool.query(
      `INSERT INTO users
        (id, email, password_hash, full_name, division, status, is_active, oauth_provider, oauth_subject, created_at)
       VALUES ($1, $2, NULL, $3, $4, 'active', 1, 'google', $5, '2024-06-01 00:00:00')`,
      [subRowId, `other-${randomUUID().slice(0, 8)}@example.com`, "Sub Match Row", "ops", subId]
    );

    // Run the same SELECT the service uses; verify ORDER BY picks Row B.
    const result = await pool.query<{ id: string }>(
      `SELECT id, email, full_name, division, status,
              (oauth_provider = 'google' AND oauth_subject = $1) AS sub_match
       FROM users
       WHERE (oauth_provider = 'google' AND oauth_subject = $1)
          OR LOWER(email) = LOWER($2)
       ORDER BY sub_match DESC, created_at ASC
       LIMIT 1`,
      [subId, sharedEmail]
    );
    expect(result.rowCount).toBe(1);
    expect(result.rows[0].id).toBe(subRowId);
  });
});
