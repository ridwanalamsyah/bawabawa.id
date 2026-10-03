import { timingSafeEqual } from "node:crypto";
import { RateLimiterMemory } from "rate-limiter-flexible";
import type { NextFunction, Request, Response } from "express";

/**
 * The public site calls this API server-to-server, so every shopper would
 * otherwise share the site server's IP (one bucket for everyone). When the
 * site proves it is the site — `x-bawabawa-proxy-secret` matching
 * SITE_PROXY_SECRET — the shopper's IP it forwards in
 * `x-bawabawa-client-ip` is used as the key instead.
 */
export function rateLimitKey(req: Request): string {
  const secret = process.env.SITE_PROXY_SECRET;
  const provided = req.header("x-bawabawa-proxy-secret");
  const clientIp = req.header("x-bawabawa-client-ip");
  if (secret && provided && clientIp) {
    const a = Buffer.from(secret);
    const b = Buffer.from(provided);
    if (a.length === b.length && timingSafeEqual(a, b)) return `site:${clientIp.slice(0, 64)}`;
  }
  return req.ip ?? "unknown";
}

type SharedStore = { url: string; token: string };

/**
 * Optional shared counter store (Upstash Redis REST). Set
 * UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN (or the Vercel KV names
 * KV_REST_API_URL + KV_REST_API_TOKEN) to make a budget global across all
 * serverless instances.
 */
function sharedStore(): SharedStore | null {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return { url: url.replace(/\/+$/, ""), token };
}

/** Fixed-window counter in Redis. Returns the hit count, or null if the store is unreachable. */
async function sharedHit(store: SharedStore, key: string, durationSeconds: number): Promise<number | null> {
  const window = Math.floor(Date.now() / 1000 / durationSeconds);
  const redisKey = `rl:${key}:${window}`;
  try {
    const res = await fetch(`${store.url}/pipeline`, {
      method: "POST",
      headers: { authorization: `Bearer ${store.token}`, "content-type": "application/json" },
      body: JSON.stringify([
        ["INCR", redisKey],
        ["EXPIRE", redisKey, String(durationSeconds), "NX"]
      ]),
      signal: AbortSignal.timeout(800)
    });
    if (!res.ok) return null;
    const body = (await res.json()) as Array<{ result?: unknown }>;
    const count = Number(body[0]?.result);
    return Number.isFinite(count) ? count : null;
  } catch {
    return null;
  }
}

/**
 * Counters live in memory per process unless `shared` is set and a Redis
 * store is configured; then the budget is global and the in-memory counter
 * is only the fallback when Redis is unreachable.
 *
 * Keys use `req.ip`, which is only the real client address because app.ts
 * sets `trust proxy`.
 */
export function createRateLimit(options: { points: number; durationSeconds: number; keyPrefix: string; shared?: boolean }) {
  // The vitest suite fires many requests from 127.0.0.1 in a burst.
  const points = process.env.NODE_ENV === "test" ? options.points * 1000 : options.points;
  const limiter = new RateLimiterMemory({
    points,
    duration: options.durationSeconds,
    keyPrefix: options.keyPrefix
  });
  const store = options.shared ? sharedStore() : null;

  return async function rateLimit(req: Request, res: Response, next: NextFunction) {
    const key = rateLimitKey(req);
    let allowed: boolean;
    const count = store ? await sharedHit(store, `${options.keyPrefix}:${key}`, options.durationSeconds) : null;
    if (count !== null) {
      allowed = count <= points;
    } else {
      allowed = await limiter.consume(key).then(
        () => true,
        () => false
      );
    }
    if (allowed) return next();
    res.setHeader("Retry-After", String(options.durationSeconds));
    res.status(429).json({
      success: false,
      error: {
        code: "RATE_LIMITED",
        message: "Terlalu banyak permintaan. Coba lagi sebentar lagi."
      }
    });
  };
}

export const rateLimitMiddleware = createRateLimit({ points: 100, durationSeconds: 60, keyPrefix: "global" });

/** Sign-in / token endpoints — slows credential and token brute force. */
export const authRateLimit = createRateLimit({ points: 20, durationSeconds: 60, keyPrefix: "auth", shared: true });

/** Anonymous order submissions from the public site. */
export const publicOrderRateLimit = createRateLimit({ points: 5, durationSeconds: 600, keyPrefix: "public-order", shared: true });

/** Approve / cancel on an existing order (token-guarded, so looser). */
export const publicOrderActionRateLimit = createRateLimit({
  points: 30,
  durationSeconds: 600,
  keyPrefix: "public-order-action",
  shared: true
});
