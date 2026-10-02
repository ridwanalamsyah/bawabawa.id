import { randomUUID } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { AppError } from "../../common/errors/app-error";
import { authGuard, requirePermission } from "../../common/middleware/auth";
import { publicOrderRateLimit } from "../../common/security/rate-limit";
import { getPool } from "../../infrastructure/db/pool";
import { normalizePhone } from "../whatsapp/fonnte.service";
import { notifyWhatsApp } from "../order-requests/order-requests.service";

/** Reseller, B2B (bulk sourcing) and affiliate enquiries from the public site. */

const KINDS = ["reseller", "b2b", "affiliate"] as const;
const STATUSES = ["new", "contacted", "active", "rejected"] as const;

const inquirySchema = z.object({
  kind: z.enum(KINDS),
  name: z.string().trim().min(2).max(160),
  phone: z.string().trim().min(9).max(20),
  businessName: z.string().trim().max(160).optional(),
  city: z.string().trim().max(80).optional(),
  categories: z.string().trim().max(300).optional(),
  monthlyVolumeKg: z.number().int().min(0).max(100000).optional(),
  message: z.string().trim().max(1000).optional(),
  website: z.string().optional()
});

export const publicPartnersRouter = Router();

publicPartnersRouter.post("/", publicOrderRateLimit, async (req, res, next) => {
  try {
    const body = inquirySchema.parse(req.body);
    if (body.website) {
      res.status(201).json({ success: true, data: { received: true } });
      return;
    }
    const phone = normalizePhone(body.phone);
    const id = randomUUID();
    await (await getPool()).query(
      `INSERT INTO partner_inquiries (id, kind, name, phone, business_name, city, categories, monthly_volume_kg, message)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [id, body.kind, body.name, phone, body.businessName ?? null, body.city ?? null, body.categories ?? null, body.monthlyVolumeKg ?? null, body.message ?? null]
    );
    const label = { reseller: "Reseller", b2b: "B2B / kulakan", affiliate: "Afiliasi" }[body.kind];
    void notifyWhatsApp(
      process.env.OPS_WHATSAPP_NUMBER,
      `🤝 Pendaftar ${label}: ${body.name}${body.businessName ? ` (${body.businessName})` : ""} · ${phone}` +
        `${body.city ? ` · ${body.city}` : ""}${body.monthlyVolumeKg ? ` · ±${body.monthlyVolumeKg} kg/bulan` : ""}`,
      id
    );
    res.status(201).json({ success: true, data: { received: true } });
  } catch (error) {
    next(error);
  }
});

export const adminPartnersRouter = Router();

adminPartnersRouter.get("/", authGuard, requirePermission("crm:manage"), async (_req, res, next) => {
  try {
    const { rows } = await (await getPool()).query(
      `SELECT id, kind, name, phone, business_name AS "businessName", city, categories,
              monthly_volume_kg AS "monthlyVolumeKg", message, status, created_at AS "createdAt"
         FROM partner_inquiries ORDER BY created_at DESC LIMIT 200`
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
});

adminPartnersRouter.patch("/:id", authGuard, requirePermission("crm:manage"), async (req, res, next) => {
  try {
    const id = z.string().uuid().parse(req.params.id);
    const { status } = z.object({ status: z.enum(STATUSES) }).parse(req.body);
    const result = await (await getPool()).query("UPDATE partner_inquiries SET status = $1 WHERE id = $2 RETURNING id", [status, id]);
    if (!result.rowCount) throw new AppError(404, "INQUIRY_NOT_FOUND", "Data tidak ditemukan");
    res.json({ success: true, data: { id, status } });
  } catch (error) {
    next(error);
  }
});
