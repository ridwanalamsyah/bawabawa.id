import type { NextFunction, Request, Response } from "express";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createRateLimit } from "../common/security/rate-limit";

function call(mw: ReturnType<typeof createRateLimit>) {
  const req = { ip: "10.0.0.1", header: () => undefined } as unknown as Request;
  const res = { statusCode: 200, setHeader: vi.fn(), status(code: number) { this.statusCode = code; return this; }, json: vi.fn() };
  const next = vi.fn() as NextFunction;
  return mw(req, res as unknown as Response, next).then(() => ({ status: res.statusCode, passed: (next as ReturnType<typeof vi.fn>).mock.calls.length === 1 }));
}

describe("shared rate limit store", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("uses the Redis counter when configured", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.example/");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "tkn");
    let count = 0;
    const fetchMock = vi.fn(async () => new Response(JSON.stringify([{ result: ++count }, { result: 1 }])));
    vi.stubGlobal("fetch", fetchMock);
    const mw = createRateLimit({ points: 1, durationSeconds: 60, keyPrefix: "t1", shared: true });
    // NODE_ENV=test multiplies the budget by 1000.
    count = 1000 - 1;
    expect(await call(mw)).toEqual({ status: 200, passed: true });
    expect(await call(mw)).toEqual({ status: 429, passed: false });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://redis.example/pipeline");
    expect(String(init.body)).toContain("rl:t1:10.0.0.1:");
  });

  it("falls back to the in-memory counter when Redis is unreachable", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.example");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "tkn");
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("down"); }));
    const mw = createRateLimit({ points: 1, durationSeconds: 60, keyPrefix: "t2", shared: true });
    expect(await call(mw)).toEqual({ status: 200, passed: true });
  });
});
