import { timingSafeEqual } from "node:crypto";
import { Router } from "express";
import { AppError } from "../../common/errors/app-error";
import { loadEnv } from "../../config/env";
import { getPool } from "../../infrastructure/db/pool";
import { withTransaction } from "../../infrastructure/db/transaction-manager";
import { flushOutbox } from "../email/resend.service";
import { flushWhatsAppOutbox } from "../whatsapp/fonnte.service";
import { notifyWhatsApp } from "../order-requests/order-requests.service";

/**
 * GET /api/v1/cron/run — scheduled housekeeping.
 *
 * Vercel Cron calls it with `Authorization: Bearer $CRON_SECRET` (see
 * apps/api/vercel.json). Any external scheduler (cron-job.org) can call it
 * the same way. Fails closed when CRON_SECRET is unset.
 *
 *   1. Retry pending WhatsApp and email outbox rows.
 *   2. Remind customers whose quote has waited > 24h for approval (once).
 */
export const cronRouter = Router();

function authorized(header: string | undefined): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || !header?.startsWith("Bearer ")) return false;
  const a = Buffer.from(secret);
  const b = Buffer.from(header.slice(7));
  return a.length === b.length && timingSafeEqual(a, b);
}

cronRouter.get("/run", async (req, res, next) => {
  try {
    if (!process.env.CRON_SECRET) throw new AppError(503, "CRON_NOT_CONFIGURED", "CRON_SECRET belum diset");
    if (!authorized(req.header("authorization"))) throw new AppError(401, "UNAUTHENTICATED", "Token cron tidak valid");
    const env = loadEnv();
    const summary: Record<string, unknown> = {};

    const site = (process.env.PUBLIC_SITE_URL ?? "https://bawabawa.id").replace(/\/$/, "");
    const db = await getPool();
    const stale = await db.query<{ id: string; code: string; customer_name: string; customer_phone: string; tracking_token: string }>(
      `SELECT id, code, customer_name, customer_phone, tracking_token
         FROM order_requests
        WHERE status = 'quoted' AND quoted_at < NOW() - INTERVAL '24 hours' AND reminded_at IS NULL
        LIMIT 50`
    );
    for (const row of stale.rows) {
      await db.query("UPDATE order_requests SET reminded_at = NOW() WHERE id = $1", [row.id]);
      await notifyWhatsApp(
        row.customer_phone,
        `Halo ${row.customer_name}, penawaran untuk ${row.code} masih menunggu persetujuanmu. ` +
          `Cek & setujui di ${site}/track/${row.tracking_token} — atau balas pesan ini kalau ada yang mau diubah.`,
        row.id
      );
    }
    summary.quoteReminders = stale.rows.length;

    if (env.FONNTE_DEVICE_TOKEN) {
      summary.whatsapp = await withTransaction((qc) =>
        flushWhatsAppOutbox(qc, { deviceToken: env.FONNTE_DEVICE_TOKEN!, baseUrl: env.FONNTE_BASE_URL }, 50)
      );
    }
    if (env.RESEND_API_KEY && env.RESEND_FROM_EMAIL) {
      summary.email = await withTransaction((qc) =>
        flushOutbox(qc, { apiKey: env.RESEND_API_KEY!, baseUrl: env.RESEND_BASE_URL, fromEmail: env.RESEND_FROM_EMAIL!, replyTo: env.RESEND_REPLY_TO }, 50)
      );
    }
    res.json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
});
