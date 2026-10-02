import { Router } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { authGuard, requirePermission, type AuthUser } from "../../common/middleware/auth";
import { publicOrderActionRateLimit, publicOrderRateLimit } from "../../common/security/rate-limit";
import { requireEnv } from "../../common/security/env";
import { logAudit } from "../../common/audit/audit-log";
import {
  ORDER_REQUEST_STATUSES,
  approveByToken,
  cancelByToken,
  createOrderRequest,
  getForAdmin,
  getPublicView,
  listForAdmin,
  listForUser,
  setQuote,
  setStatus
} from "./order-requests.service";

const ACCESS_SECRET = requireEnv("JWT_ACCESS_SECRET");

const itemSchema = z.object({
  name: z.string().trim().min(2, "Nama barang minimal 2 karakter").max(160),
  link: z.string().trim().url("Link tidak valid").max(500).optional().or(z.literal("").transform(() => undefined)),
  category: z.string().trim().max(60).optional(),
  qty: z.number().int().min(1).max(99),
  maxPrice: z.number().int().min(0).max(100_000_000).optional(),
  variant: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(500).optional(),
  imageUrl: z.string().url().max(500).optional(),
  productId: z.string().uuid().optional()
});

const createSchema = z
  .object({
    source: z.enum(["request", "catalog"]).default("request"),
    customerName: z.string().trim().min(2, "Nama minimal 2 karakter").max(160),
    customerPhone: z.string().trim().min(9, "Nomor WhatsApp tidak valid").max(20),
    customerEmail: z.string().trim().email().max(180).optional().or(z.literal("").transform(() => undefined)),
    address: z.object({
      street: z.string().trim().min(5, "Alamat terlalu pendek").max(300),
      city: z.string().trim().min(2).max(80),
      postal: z.string().trim().regex(/^\d{5}$/, "Kode pos harus 5 digit"),
      notes: z.string().trim().max(200).optional()
    }),
    tier: z.enum(["fast", "batch"]),
    tripId: z.string().uuid().nullable().optional(),
    items: z.array(itemSchema).min(1, "Minimal 1 barang").max(20),
    outOfStockPreference: z.enum(["cancel", "substitute", "ask"]).default("ask"),
    customerNotes: z.string().trim().max(1000).optional(),
    estimatedKg: z.number().min(0).max(500).optional(),
    // Honeypot: real visitors never see this field. Bots that fill every
    // input get a fake success so they don't retry with variations.
    website: z.string().optional()
  })
  .refine((body) => body.tier !== "batch" || !!body.tripId, {
    message: "Pilih jadwal trip untuk layanan Kargo",
    path: ["tripId"]
  });

/** Optional auth: link the request to an account when the caller is signed in. */
function optionalUserId(header: string | undefined): string | null {
  if (!header?.startsWith("Bearer ")) return null;
  try {
    const payload = jwt.verify(header.slice(7), ACCESS_SECRET) as AuthUser;
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

const tokenParam = z.string().regex(/^[A-Za-z0-9_-]{20,64}$/, "Token tidak valid");

export const publicOrderRequestsRouter = Router();

/** POST /api/v1/public/order-requests — guest checkout / request submission. */
publicOrderRequestsRouter.post("/", publicOrderRateLimit, async (req, res, next) => {
  try {
    const body = createSchema.parse(req.body);
    if (body.website) {
      res.status(201).json({ success: true, data: { code: "BWB-PENDING", trackingToken: null } });
      return;
    }
    const result = await createOrderRequest({
      ...body,
      userId: optionalUserId(req.header("authorization"))
    });
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

publicOrderRequestsRouter.get("/:token", async (req, res, next) => {
  try {
    res.json({ success: true, data: await getPublicView(tokenParam.parse(req.params.token)) });
  } catch (error) {
    next(error);
  }
});

publicOrderRequestsRouter.post("/:token/approve", publicOrderActionRateLimit, async (req, res, next) => {
  try {
    res.json({ success: true, data: await approveByToken(tokenParam.parse(req.params.token)) });
  } catch (error) {
    next(error);
  }
});

publicOrderRequestsRouter.post("/:token/cancel", publicOrderActionRateLimit, async (req, res, next) => {
  try {
    const reason = z.string().trim().max(300).optional().parse(req.body?.reason);
    res.json({ success: true, data: await cancelByToken(tokenParam.parse(req.params.token), reason) });
  } catch (error) {
    next(error);
  }
});

/** GET /api/v1/order-requests/mine — signed-in customer's own requests. */
export const myOrderRequestsRouter = Router();
myOrderRequestsRouter.get("/mine", authGuard, async (req, res, next) => {
  try {
    res.json({ success: true, data: await listForUser(String(req.user?.sub ?? "")) });
  } catch (error) {
    next(error);
  }
});

export const adminOrderRequestsRouter = Router();

adminOrderRequestsRouter.get("/", authGuard, requirePermission("orders:read"), async (req, res, next) => {
  try {
    const status = z.enum(ORDER_REQUEST_STATUSES).optional().parse(req.query.status || undefined);
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    res.json({ success: true, data: await listForAdmin({ status, limit }) });
  } catch (error) {
    next(error);
  }
});

adminOrderRequestsRouter.get("/:id", authGuard, requirePermission("orders:read"), async (req, res, next) => {
  try {
    res.json({ success: true, data: await getForAdmin(z.string().uuid().parse(req.params.id)) });
  } catch (error) {
    next(error);
  }
});

const quoteSchema = z.object({
  itemsTotal: z.number().int().min(0).max(1_000_000_000),
  shippingFee: z.number().int().min(0).max(100_000_000),
  jastipFee: z.number().int().min(0).max(100_000_000).optional(),
  withPpn: z.boolean().optional(),
  note: z.string().trim().max(1000).optional()
});

adminOrderRequestsRouter.post(
  "/:id/quote",
  authGuard,
  requirePermission("orders:update"),
  async (req, res, next) => {
    try {
      const id = z.string().uuid().parse(req.params.id);
      const data = await setQuote(id, quoteSchema.parse(req.body), req.user?.sub ?? null);
      await logAudit({
        actorId: req.user?.sub,
        action: "order_requests.quote",
        moduleName: "orders",
        entityId: id,
        afterData: data.quote
      });
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
);

const statusSchema = z.object({
  status: z.enum(ORDER_REQUEST_STATUSES),
  note: z.string().trim().max(1000).optional(),
  trackingNumber: z.string().trim().max(80).optional(),
  paymentMethod: z.string().trim().max(20).optional()
});

adminOrderRequestsRouter.post(
  "/:id/status",
  authGuard,
  requirePermission("orders:update"),
  async (req, res, next) => {
    try {
      const id = z.string().uuid().parse(req.params.id);
      const body = statusSchema.parse(req.body);
      const data = await setStatus(id, body, req.user?.sub ?? null);
      await logAudit({
        actorId: req.user?.sub,
        action: `order_requests.status.${body.status}`,
        moduleName: "orders",
        entityId: id,
        afterData: body
      });
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
);
