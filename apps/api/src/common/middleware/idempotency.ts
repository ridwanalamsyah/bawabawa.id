import { createHash, randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { getPool } from "../../infrastructure/db/pool";

/**
 * Idempotency middleware — guards against duplicate mutations from client
 * retries (network blips, "double-tap" UI). Client sends `x-idempotency-key`
 * header; the middleware atomically claims the key via an INSERT … ON
 * CONFLICT DO NOTHING, then runs the handler and UPDATEs the row with the
 * actual response. Concurrent requests see the claim row (status=0) and
 * are rejected with 425 so they don't race the original handler.
 *
 * Keys are scoped per-actor (via COALESCE-sentinel unique index) so two
 * users can reuse the same key string. NULL actor_id (anonymous routes)
 * is supported — all anonymous requests for the same (key, method, path)
 * collide deterministically thanks to the COALESCE sentinel.
 */

const NULL_ACTOR_SENTINEL = "00000000-0000-0000-0000-000000000000";
const PENDING_STATUS = 0;

const TABLE_CREATED = { done: false };
async function ensureTable() {
  if (TABLE_CREATED.done) return;
  TABLE_CREATED.done = true;
  const db = await getPool();
  // Portable shape (works on Postgres + SQLite shim). Production schema lives
  // in migrations/007_idempotency.sql + 010_idempotency_null_actor.sql.
  // This dev/test fallback mirrors the post-migration-010 schema.
  await db.query(
    `CREATE TABLE IF NOT EXISTS idempotent_responses (
       id TEXT PRIMARY KEY,
       key TEXT NOT NULL,
       actor_id TEXT,
       method TEXT NOT NULL,
       path TEXT NOT NULL,
       request_hash TEXT NOT NULL,
       status_code INTEGER NOT NULL,
       response_json TEXT NOT NULL,
       created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
     )`
  );
  await db.query(
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_idempotent_responses_lookup
       ON idempotent_responses (
         key,
         COALESCE(actor_id, '${NULL_ACTOR_SENTINEL}'),
         method,
         path
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

export function idempotency(_options: IdempotencyOptions = {}) {
  return async function idempotencyMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const key = String(req.header("x-idempotency-key") ?? "").trim();
    if (!key) {
      if (_options.required) {
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

      // Step 1: atomically claim the slot. INSERT … ON CONFLICT DO NOTHING
      // collapses the previous SELECT-then-INSERT race: two concurrent
      // requests can no longer both pass the existence check.
      const claimId = randomUUID();
      const claim = await db.query(
        `INSERT INTO idempotent_responses
           (id, key, actor_id, method, path, request_hash, status_code, response_json)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT DO NOTHING`,
        [claimId, key, actorId, method, path, requestHash, PENDING_STATUS, ""]
      );

      if (claim.rowCount === 0) {
        // Someone else already claimed this (key, actor, method, path).
        // Either the request completed (replay the cached response), the
        // request is still in-flight (tell the client to retry), or the
        // request body hash differs (reject as a key-reuse conflict).
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
        if (existing.rowCount === 0) {
          // Extremely unlikely (row vanished between INSERT and SELECT —
          // e.g. a cleanup job just deleted it). Fall through to handler.
          next();
          return;
        }
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
        if (row.status_code === PENDING_STATUS) {
          res.status(425).json({
            success: false,
            error: {
              code: "REQUEST_IN_PROGRESS",
              message: "Request dengan idempotency key ini masih diproses, coba lagi sebentar"
            }
          });
          return;
        }
        res.status(row.status_code).type("application/json").send(row.response_json);
        return;
      }

      // Step 2: we claimed the slot. Wrap res.json so the real response is
      // persisted synchronously before the client sees it — guaranteeing a
      // subsequent retry hits the cached result, not the pending sentinel.
      const originalJson = res.json.bind(res) as Response["json"];
      (res as any).json = (body: unknown) => {
        const statusCode = res.statusCode || 200;
        const payload = JSON.stringify(body);
        if (statusCode >= 200 && statusCode < 300) {
          // Successful: promote the pending row to the final cached response.
          db.query(
            `UPDATE idempotent_responses
                SET status_code = $1, response_json = $2
              WHERE id = $3`,
            [statusCode, payload, claimId]
          ).catch((err) => {
            console.error("idempotency cache update failed:", err);
          });
        } else {
          // Handler errored; drop the sentinel so the client (or another
          // actor) can legitimately retry the same key.
          db.query(
            `DELETE FROM idempotent_responses WHERE id = $1 AND status_code = $2`,
            [claimId, PENDING_STATUS]
          ).catch((err) => {
            console.error("idempotency sentinel cleanup failed:", err);
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
