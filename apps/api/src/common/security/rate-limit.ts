import { RateLimiterMemory } from "rate-limiter-flexible";
import type { NextFunction, Request, Response } from "express";

/**
 * Global throttle: 100 requests/minute per IP. Catches noisy clients and
 * casual abuse. Per-route limits below stack on top — auth routes, for
 * example, get an additional much tighter budget.
 */
const rateLimiter = new RateLimiterMemory({
  points: 100,
  duration: 60
});

/**
 * Strict per-IP budget for authentication routes. 10 attempts per 5 minutes
 * is enough for a real user mistyping a few times, but stops dictionary
 * attacks dead. Keyed by IP only — even if the attacker rotates emails the
 * shared IP still hits the wall.
 */
const authRateLimiter = new RateLimiterMemory({
  points: 10,
  duration: 60 * 5,
  blockDuration: 60 * 15
});

function clientKey(req: Request): string {
  return req.ip ?? "unknown";
}

export async function rateLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    await rateLimiter.consume(clientKey(req));
    next();
  } catch {
    res.status(429).json({
      success: false,
      error: {
        code: "RATE_LIMITED",
        message: "Terlalu banyak permintaan. Coba lagi sebentar."
      }
    });
  }
}

export async function authRateLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    await authRateLimiter.consume(clientKey(req));
    next();
  } catch {
    res.status(429).json({
      success: false,
      error: {
        code: "AUTH_RATE_LIMITED",
        message:
          "Terlalu banyak percobaan masuk. Tunggu beberapa menit sebelum mencoba lagi."
      }
    });
  }
}
