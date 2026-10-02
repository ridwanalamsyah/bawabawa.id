import { randomUUID } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { AppError } from "../../common/errors/app-error";
import { authGuard, requireAnyPermission } from "../../common/middleware/auth";
import { publicOrderActionRateLimit } from "../../common/security/rate-limit";
import { getPool } from "../../infrastructure/db/pool";
import { logAudit } from "../../common/audit/audit-log";

/**
 * Reviews come only from customers whose order was delivered (they hold the
 * tracking token), are marked verified, and stay hidden until the team
 * publishes them. Public display goes through GET /reports/testimonials.
 */

const tokenParam = z.string().regex(/^[A-Za-z0-9_-]{20,64}$/, "Token tidak valid");

function displayName(full: string): string {
  const [first = "Pelanggan", last] = full.trim().split(/\s+/);
  return last ? `${first} ${last[0]!.toUpperCase()}.` : first;
}

export async function reviewStateForToken(token: string): Promise<{ canReview: boolean; reviewSubmitted: boolean }> {
  try {
    const db = await getPool();
    const { rows } = await db.query<{ status: string; review_id: string | null }>(
      `SELECT r.status, t.id AS review_id
         FROM order_requests r
         LEFT JOIN testimonials t ON t.order_request_id = r.id
        WHERE r.tracking_token = $1`,
      [token]
    );
    const row = rows[0];
    return { canReview: row?.status === "delivered" && !row.review_id, reviewSubmitted: !!row?.review_id };
  } catch {
    return { canReview: false, reviewSubmitted: false };
  }
}

export const publicReviewsRouter = Router();

publicReviewsRouter.post("/:token/review", publicOrderActionRateLimit, async (req, res, next) => {
  try {
    const token = tokenParam.parse(req.params.token);
    const body = z
      .object({
        rating: z.number().int().min(1).max(5),
        body: z.string().trim().min(10, "Ceritakan sedikit pengalamanmu (min. 10 karakter)").max(800)
      })
      .parse(req.body);
    const db = await getPool();
    const { rows } = await db.query<{ id: string; status: string; customer_name: string; address: any }>(
      "SELECT id, status, customer_name, address FROM order_requests WHERE tracking_token = $1",
      [token]
    );
    const order = rows[0];
    if (!order) throw new AppError(404, "ORDER_REQUEST_NOT_FOUND", "Pesanan tidak ditemukan");
    if (order.status !== "delivered") {
      throw new AppError(409, "NOT_DELIVERED", "Ulasan bisa dikirim setelah pesanan diterima");
    }
    const address = typeof order.address === "string" ? JSON.parse(order.address) : order.address;
    try {
      await db.query(
        `INSERT INTO testimonials (id, order_request_id, customer_name, city, rating, body, is_verified, is_published)
         VALUES ($1, $2, $3, $4, $5, $6, TRUE, FALSE)`,
        [randomUUID(), order.id, displayName(order.customer_name), address?.city ?? null, body.rating, body.body]
      );
    } catch (error) {
      if (error instanceof Error && /duplicate key|unique/i.test(error.message)) {
        throw new AppError(409, "REVIEW_EXISTS", "Kamu sudah mengirim ulasan untuk pesanan ini");
      }
      throw error;
    }
    res.status(201).json({ success: true, data: { submitted: true } });
  } catch (error) {
    next(error);
  }
});

export const adminReviewsRouter = Router();
const requireReviewManager = requireAnyPermission("cms:manage", "orders:update");

adminReviewsRouter.get("/", authGuard, requireReviewManager, async (_req, res, next) => {
  try {
    const { rows } = await (await getPool()).query(
      `SELECT id, customer_name AS "customerName", city, rating, body, is_published AS "isPublished",
              is_verified AS "isVerified", created_at AS "createdAt"
         FROM testimonials
        ORDER BY is_published ASC, created_at DESC
        LIMIT 200`
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
});

adminReviewsRouter.patch("/:id", authGuard, requireReviewManager, async (req, res, next) => {
  try {
    const id = z.string().uuid().parse(req.params.id);
    const { isPublished } = z.object({ isPublished: z.boolean() }).parse(req.body);
    const result = await (await getPool()).query(
      `UPDATE testimonials
          SET is_published = $1, published_at = CASE WHEN $1 THEN NOW() ELSE NULL END
        WHERE id = $2 RETURNING id`,
      [isPublished, id]
    );
    if (!result.rowCount) throw new AppError(404, "REVIEW_NOT_FOUND", "Ulasan tidak ditemukan");
    await logAudit({ actorId: req.user?.sub, action: isPublished ? "review.publish" : "review.unpublish", moduleName: "cms", entityId: id });
    res.json({ success: true, data: { id, isPublished } });
  } catch (error) {
    next(error);
  }
});
