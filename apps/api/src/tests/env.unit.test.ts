import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { __resetEnvCacheForTests, loadEnv } from "../config/env";

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

describe("config/env loadEnv()", () => {
  beforeEach(resetEnv);
  afterEach(resetEnv);

  it("returns sane defaults in test mode without secrets", () => {
    process.env.NODE_ENV = "test";
    delete process.env.JWT_ACCESS_SECRET;
    delete process.env.JWT_REFRESH_SECRET;
    const env = loadEnv();
    expect(env.NODE_ENV).toBe("test");
    expect(env.PORT).toBe(3000);
    expect(env.JWT_ACCESS_SECRET).toContain("test-jwt-access-secret");
    expect(env.JWT_REFRESH_SECRET).toContain("test-jwt-refresh-secret");
    expect(env.CORS_ALLOWED_ORIGINS).toEqual([]);
    expect(env.DEMO_MODE).toBe(false);
  });

  it("parses CORS_ALLOWED_ORIGINS into a clean string array", () => {
    process.env.NODE_ENV = "test";
    process.env.CORS_ALLOWED_ORIGINS = " https://a.com , https://b.com ,, ";
    const env = loadEnv();
    expect(env.CORS_ALLOWED_ORIGINS).toEqual(["https://a.com", "https://b.com"]);
  });

  it("rejects an out-of-range PORT", () => {
    process.env.NODE_ENV = "test";
    process.env.PORT = "99999";
    expect(() => loadEnv()).toThrow();
  });

  it("rejects a malformed DATABASE_URL", () => {
    process.env.NODE_ENV = "test";
    process.env.DATABASE_URL = "not a url";
    expect(() => loadEnv()).toThrow();
  });

  it("treats DEMO_MODE='1' as true and 'false' as false", () => {
    process.env.NODE_ENV = "test";
    process.env.DEMO_MODE = "1";
    expect(loadEnv().DEMO_MODE).toBe(true);
    resetEnv();
    process.env.NODE_ENV = "test";
    process.env.DEMO_MODE = "false";
    expect(loadEnv().DEMO_MODE).toBe(false);
  });

  it("requires GOOGLE_OAUTH_CLIENT_ID + DATABASE_URL when NODE_ENV=production", () => {
    process.env.NODE_ENV = "production";
    process.env.JWT_ACCESS_SECRET = "0123456789abcdef0123456789abcdef";
    process.env.JWT_REFRESH_SECRET = "0123456789abcdef0123456789abcdef-r";
    delete process.env.GOOGLE_OAUTH_CLIENT_ID;
    delete process.env.DATABASE_URL;
    expect(() => loadEnv()).toThrow();
  });

  it("rejects DEMO_MODE=true in production", () => {
    process.env.NODE_ENV = "production";
    process.env.JWT_ACCESS_SECRET = "0123456789abcdef0123456789abcdef";
    process.env.JWT_REFRESH_SECRET = "0123456789abcdef0123456789abcdef-r";
    process.env.GOOGLE_OAUTH_CLIENT_ID = "1234567890.apps.googleusercontent.com";
    process.env.DATABASE_URL = "postgres://user:pw@localhost:5432/db";
    process.env.DEMO_MODE = "1";
    expect(() => loadEnv()).toThrow();
  });

  it("accepts a fully-populated production env", () => {
    process.env.NODE_ENV = "production";
    process.env.JWT_ACCESS_SECRET = "0123456789abcdef0123456789abcdef";
    process.env.JWT_REFRESH_SECRET = "0123456789abcdef0123456789abcdef-r";
    process.env.GOOGLE_OAUTH_CLIENT_ID = "1234567890.apps.googleusercontent.com";
    process.env.DATABASE_URL = "postgres://user:pw@localhost:5432/db";
    process.env.OAUTH_ALLOWED_DOMAINS = "bawabawa.id,bawabawa.co.id";
    delete process.env.DEMO_MODE;
    const env = loadEnv();
    expect(env.NODE_ENV).toBe("production");
    expect(env.DEMO_MODE).toBe(false);
    expect(env.GOOGLE_OAUTH_CLIENT_ID).toContain("googleusercontent.com");
    expect(env.OAUTH_ALLOWED_DOMAINS).toEqual(["bawabawa.id", "bawabawa.co.id"]);
    expect(env.OAUTH_REQUIRE_APPROVAL).toBe(true);
  });
});
