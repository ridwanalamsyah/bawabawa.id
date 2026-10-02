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

/**
 * In-memory limiter. Counters live per process, so on serverless each warm
 * instance enforces its own budget — good enough to blunt bursts from one
 * client, not a hard global quota. Swap `RateLimiterMemory` for
 * `RateLimiterRedis` (Upstash) when a shared store is available.
 *
 * Keys use `req.ip`, which is only the real client address because app.ts
 * sets `trust proxy`.
 */
export function createRateLimit(options: { points: number; durationSeconds: number; keyPrefix: string }) {
  // The vitest suite fires many requests from 127.0.0.1 in a burst.
  const points = process.env.NODE_ENV === "test" ? options.points * 1000 : options.points;
  const limiter = new RateLimiterMemory({
    points,
    duration: options.durationSeconds,
    keyPrefix: options.keyPrefix
  });

  return async function rateLimit(req: Request, res: Response, next: NextFunction) {
    try {
      await limiter.consume(rateLimitKey(req));
      next();
    } catch {
      res.setHeader("Retry-After", String(options.durationSeconds));
      res.status(429).json({
        success: false,
        error: {
          code: "RATE_LIMITED",
          message: "Terlalu banyak permintaan. Coba lagi sebentar lagi."
        }
      });
    }
  };
}

export const rateLimitMiddleware = createRateLimit({ points: 100, durationSeconds: 60, keyPrefix: "global" });

/** Sign-in / token endpoints — slows credential and token brute force. */
export const authRateLimit = createRateLimit({ points: 20, durationSeconds: 60, keyPrefix: "auth" });

/** Anonymous order submissions from the public site. */
export const publicOrderRateLimit = createRateLimit({ points: 5, durationSeconds: 600, keyPrefix: "public-order" });

/** Approve / cancel on an existing order (token-guarded, so looser). */
export const publicOrderActionRateLimit = createRateLimit({
  points: 30,
  durationSeconds: 600,
  keyPrefix: "public-order-action"
});
