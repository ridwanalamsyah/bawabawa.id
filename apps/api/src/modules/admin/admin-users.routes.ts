/**
 * Admin user management endpoints. Lets Owner / Admin approve or suspend
 * Google OAuth accounts that have signed in for the first time (status =
 * 'pending'), and view the active roster.
 *
 * Authorization is gated by the existing `users:manage_users` permission
 * (same one used by RBAC + HR routes).
 */

import { Router } from "express";
import { z } from "zod";
import { authGuard, requirePermission } from "../../common/middleware/auth";
import { getPool } from "../../infrastructure/db/pool";
import { AppError } from "../../common/errors/app-error";

const adminUsersRouter = Router();

type DbUserRow = {
  id: string;
  email: string;
  full_name: string;
  division: string;
  status: string;
  is_active: boolean;
  oauth_provider: string | null;
  picture_url: string | null;
  created_at: string;
  approved_at: string | null;
  approved_by: string | null;
};

const statusFilterSchema = z
  .enum(["pending", "active", "suspended", "all"])
  .optional()
  .default("all");

/**
 * GET /admin/users?status=pending|active|suspended|all
 */
adminUsersRouter.get(
  "/users",
  authGuard,
  requirePermission("users:manage_users"),
  async (req, res, next) => {
    try {
      const status = statusFilterSchema.parse(req.query.status);
      const pool = await getPool();
      const params: string[] = [];
      let where = "deleted_at IS NULL";
      if (status !== "all") {
        params.push(status);
        where += ` AND status = $${params.length}`;
      }
      const result = await (pool as { query: (sql: string, vals: unknown[]) => Promise<{ rows: DbUserRow[] }> }).query(
        `SELECT id, email, full_name, division, status, is_active,
                oauth_provider, picture_url, created_at, approved_at, approved_by
           FROM users
          WHERE ${where}
          ORDER BY
            CASE WHEN status = 'pending' THEN 0 ELSE 1 END,
            created_at DESC
          LIMIT 200`,
        params,
      );
      res.json({
        success: true,
        data: result.rows.map(rowToDto),
      });
    } catch (error) {
      next(error);
    }
  },
);

const approveSchema = z.object({
  division: z.string().min(2).max(40).optional(),
});

/**
 * POST /admin/users/:id/approve — flip status pending -> active.
 */
adminUsersRouter.post(
  "/users/:id/approve",
  authGuard,
  requirePermission("users:manage_users"),
  async (req, res, next) => {
    try {
      const id = z.string().uuid().parse(req.params.id);
      const body = approveSchema.parse(req.body ?? {});
      const actor = String(req.user?.sub ?? "");
      if (actor === id) {
        throw new AppError(400, "INVALID_TARGET", "Tidak bisa menyetujui akun sendiri.");
      }
      const pool = await getPool();
      const updates: string[] = ["status = 'active'", "is_active = TRUE", "approved_at = NOW()", "approved_by = $2"];
      const params: unknown[] = [id, actor];
      if (body.division) {
        params.push(body.division);
        updates.push(`division = $${params.length}`);
      }
      const sql = `UPDATE users SET ${updates.join(", ")}
                    WHERE id = $1 AND deleted_at IS NULL
                    RETURNING id, email, full_name, division, status, is_active,
                              oauth_provider, picture_url, created_at, approved_at, approved_by`;
      const result = await (pool as { query: (sql: string, vals: unknown[]) => Promise<{ rows: DbUserRow[]; rowCount: number }> }).query(sql, params);
      if (!result.rowCount) {
        throw new AppError(404, "USER_NOT_FOUND", "Akun tidak ditemukan.");
      }
      res.json({ success: true, data: rowToDto(result.rows[0]) });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * POST /admin/users/:id/suspend — flip status active -> suspended.
 */
adminUsersRouter.post(
  "/users/:id/suspend",
  authGuard,
  requirePermission("users:manage_users"),
  async (req, res, next) => {
    try {
      const id = z.string().uuid().parse(req.params.id);
      const actor = String(req.user?.sub ?? "");
      if (actor === id) {
        throw new AppError(400, "INVALID_TARGET", "Tidak bisa menonaktifkan akun sendiri.");
      }
      const pool = await getPool();
      const result = await (pool as { query: (sql: string, vals: unknown[]) => Promise<{ rows: DbUserRow[]; rowCount: number }> }).query(
        `UPDATE users
            SET status = 'suspended', is_active = FALSE
          WHERE id = $1 AND deleted_at IS NULL
          RETURNING id, email, full_name, division, status, is_active,
                    oauth_provider, picture_url, created_at, approved_at, approved_by`,
        [id],
      );
      if (!result.rowCount) {
        throw new AppError(404, "USER_NOT_FOUND", "Akun tidak ditemukan.");
      }
      // Also revoke sessions if the table exists.
      try {
        await (pool as { query: (sql: string, vals: unknown[]) => Promise<unknown> }).query(
          `UPDATE user_sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL`,
          [id],
        );
      } catch {
        // user_sessions may not exist in older deployments; ignore.
      }
      res.json({ success: true, data: rowToDto(result.rows[0]) });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * POST /admin/users/:id/reactivate — flip suspended -> active.
 */
adminUsersRouter.post(
  "/users/:id/reactivate",
  authGuard,
  requirePermission("users:manage_users"),
  async (req, res, next) => {
    try {
      const id = z.string().uuid().parse(req.params.id);
      const actor = String(req.user?.sub ?? "");
      const pool = await getPool();
      const result = await (pool as { query: (sql: string, vals: unknown[]) => Promise<{ rows: DbUserRow[]; rowCount: number }> }).query(
        `UPDATE users
            SET status = 'active', is_active = TRUE, approved_at = COALESCE(approved_at, NOW()), approved_by = COALESCE(approved_by, $2)
          WHERE id = $1 AND deleted_at IS NULL
          RETURNING id, email, full_name, division, status, is_active,
                    oauth_provider, picture_url, created_at, approved_at, approved_by`,
        [id, actor],
      );
      if (!result.rowCount) {
        throw new AppError(404, "USER_NOT_FOUND", "Akun tidak ditemukan.");
      }
      res.json({ success: true, data: rowToDto(result.rows[0]) });
    } catch (error) {
      next(error);
    }
  },
);

const inviteSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1).max(120),
  division: z.string().min(2).max(40).default("admin"),
});

/**
 * POST /admin/users/invite — pre-seed an admin row keyed by email so the
 * invitee can sign in via Google immediately (no second click needed).
 *
 * The Google sign-in upsert logic in auth.service.ts matches by email when
 * `oauth_subject` is null, then links the Google identity on first login.
 */
adminUsersRouter.post(
  "/users/invite",
  authGuard,
  requirePermission("users:manage_users"),
  async (req, res, next) => {
    try {
      const body = inviteSchema.parse(req.body);
      const email = body.email.trim().toLowerCase();
      const actor = String(req.user?.sub ?? "");
      const pool = await getPool();
      const existing = await (pool as { query: (sql: string, vals: unknown[]) => Promise<{ rows: DbUserRow[]; rowCount: number }> }).query(
        `SELECT id, email, full_name, division, status, is_active,
                oauth_provider, picture_url, created_at, approved_at, approved_by
           FROM users WHERE LOWER(email) = $1 AND deleted_at IS NULL LIMIT 1`,
        [email],
      );
      if (existing.rowCount) {
        // Re-activate the existing row instead of inserting a duplicate.
        const row = existing.rows[0];
        if (row.status === "active" && row.is_active) {
          res.json({ success: true, data: rowToDto(row), reactivated: false });
          return;
        }
        const upd = await (pool as { query: (sql: string, vals: unknown[]) => Promise<{ rows: DbUserRow[] }> }).query(
          `UPDATE users
              SET status = 'active', is_active = TRUE,
                  full_name = COALESCE(NULLIF($2, ''), full_name),
                  division = COALESCE(NULLIF($3, ''), division),
                  approved_at = NOW(), approved_by = $4
            WHERE id = $1
            RETURNING id, email, full_name, division, status, is_active,
                      oauth_provider, picture_url, created_at, approved_at, approved_by`,
          [row.id, body.fullName, body.division, actor],
        );
        res.status(200).json({ success: true, data: rowToDto(upd.rows[0]), reactivated: true });
        return;
      }
      const insert = await (pool as { query: (sql: string, vals: unknown[]) => Promise<{ rows: DbUserRow[] }> }).query(
        `INSERT INTO users (id, full_name, email, password_hash, division, is_active, status, approved_at, approved_by)
         VALUES (gen_random_uuid(), $1, $2, NULL, $3, TRUE, 'active', NOW(), $4)
         RETURNING id, email, full_name, division, status, is_active,
                   oauth_provider, picture_url, created_at, approved_at, approved_by`,
        [body.fullName, email, body.division, actor],
      );
      res.status(201).json({ success: true, data: rowToDto(insert.rows[0]) });
    } catch (error) {
      next(error);
    }
  },
);

function rowToDto(row: DbUserRow) {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    division: row.division,
    status: row.status,
    isActive: row.is_active,
    oauthProvider: row.oauth_provider,
    pictureUrl: row.picture_url,
    createdAt: row.created_at,
    approvedAt: row.approved_at,
    approvedBy: row.approved_by,
  };
}

export { adminUsersRouter };
