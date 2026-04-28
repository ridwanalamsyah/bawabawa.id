import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app";
import { __resetEnvCacheForTests } from "../config/env";

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
});
