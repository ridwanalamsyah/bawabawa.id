import { RateLimiterMemory } from "rate-limiter-flexible";
import type { NextFunction, Request, Response } from "express";

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
      await limiter.consume(req.ip ?? "unknown");
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
