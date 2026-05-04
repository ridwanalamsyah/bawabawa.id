import { createHash } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { getPool } from "../../infrastructure/db/pool";

/**
 * Idempotency middleware — guards against duplicate mutations from client
 * retries (network blips, "double-tap" UI). Client sends `x-idempotency-key`
 * header; if a response is already cached for (actor, method, path, key),
 * the same response is replayed. Request body is hashed so a cache hit with
 * a different payload surfaces a 409 instead of silently replaying stale data.
 *
 * Keys are scoped per-actor so different users can reuse the same key string.
 * Anonymous routes (no req.user) use a NULL actor so keys must be globally
 * unique for unauth endpoints.
 */

const TABLE_CREATED = { done: false };
async function ensureTable() {
  if (TABLE_CREATED.done) return;
  TABLE_CREATED.done = true;
  const db = await getPool();
  // Portable shape (works on Postgres + SQLite shim). Production schema lives
  // in migrations/007_idempotency.sql; this fallback just makes dev/test boot.
  await db.query(
    `CREATE TABLE IF NOT EXISTS idempotent_responses (
       key TEXT NOT NULL,
       actor_id TEXT,
       method TEXT NOT NULL,
       path TEXT NOT NULL,
       request_hash TEXT NOT NULL,
       status_code INTEGER NOT NULL,
       response_json TEXT NOT NULL,
       created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
       PRIMARY KEY (key, actor_id, method, path)
     )`
  );
}

function hashRequest(body: unknown): string {
  const normalized = JSON.stringify(body ?? {});
  return createHash("sha256").update(normalized).digest("hex");
}

export type IdempotencyOptions = {
  /**
   * When true, the key is REQUIRED. Otherwise the middleware no-ops when the
   * header is absent (for endpoints where idempotency is opt-in). Defaults to
   * false so existing clients that don't send the header still work.
   */
  required?: boolean;
};

export function idempotency(options: IdempotencyOptions = {}) {
  return async function idempotencyMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const key = String(req.header("x-idempotency-key") ?? "").trim();
    if (!key) {
      if (options.required) {
        res.status(422).json({
          success: false,
          error: {
            code: "MISSING_IDEMPOTENCY_KEY",
            message: "Header x-idempotency-key wajib"
          }
        });
        return;
      }
      next();
      return;
    }

    if (key.length > 120) {
      res.status(422).json({
        success: false,
        error: {
          code: "IDEMPOTENCY_KEY_TOO_LONG",
          message: "Idempotency key maksimal 120 karakter"
        }
      });
      return;
    }

    try {
      await ensureTable();
      const db = await getPool();
      const actorId = String(req.user?.sub ?? "") || null;
      const method = req.method.toUpperCase();
      const path = req.originalUrl.split("?")[0].slice(0, 200);
      const requestHash = hashRequest(req.body);

      const existing = await db.query<{
        request_hash: string;
        status_code: number;
        response_json: string;
      }>(
        `SELECT request_hash, status_code, response_json
           FROM idempotent_responses
          WHERE key = $1 AND actor_id IS NOT DISTINCT FROM $2
            AND method = $3 AND path = $4
          LIMIT 1`,
        [key, actorId, method, path]
      );

      if (existing.rowCount > 0) {
        const row = existing.rows[0];
        if (row.request_hash !== requestHash) {
          res.status(409).json({
            success: false,
            error: {
              code: "IDEMPOTENCY_KEY_CONFLICT",
              message: "Idempotency key sudah dipakai untuk request berbeda"
            }
          });
          return;
        }
        res.status(row.status_code).type("application/json").send(row.response_json);
        return;
      }

      // Intercept res.json to cache successful responses before sending.
      const originalJson = res.json.bind(res) as Response["json"];
      (res as any).json = (body: unknown) => {
        const statusCode = res.statusCode || 200;
        if (statusCode >= 200 && statusCode < 300) {
          const payload = JSON.stringify(body);
          // Fire-and-forget insert; failure shouldn't break the response.
          db.query(
            `INSERT INTO idempotent_responses
               (key, actor_id, method, path, request_hash, status_code, response_json)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [key, actorId, method, path, requestHash, statusCode, payload]
          ).catch((err) => {
            console.error("idempotency cache insert failed:", err);
          });
        }
        return originalJson(body);
      };

      next();
    } catch (err) {
      console.error("idempotency middleware error:", err);
      // Fail open — idempotency is an optimization, not a security gate.
      next();
    }
  };
}
