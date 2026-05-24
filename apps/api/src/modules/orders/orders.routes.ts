import { Router } from "express";
import { z } from "zod";
import { authGuard, requirePermission } from "../../common/middleware/auth";
import { idempotency } from "../../common/middleware/idempotency";
import { AppError } from "../../common/errors/app-error";
import { logAudit } from "../../common/audit/audit-log";
import { OrdersService } from "./orders.service";
import { WorkflowService } from "./workflow.service";

const ordersRouter = Router();
const service = new OrdersService();
const workflowService = new WorkflowService(service);

ordersRouter.get("/", authGuard, async (_req, res, next) => {
  try {
    const data = await service.listRecent();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

/**
 * Customer-scoped list. Returns only the orders the signed-in user
 * created (created_by = req.user.sub). Used by /dashboard to render the
 * customer's own pesanan without exposing the global feed.
 */
ordersRouter.get("/mine", authGuard, async (req, res, next) => {
  try {
    const userId = String(req.user?.sub ?? "");
    if (!userId) {
      res.json({ success: true, data: [] });
      return;
    }
    const data = await service.listByCreatedBy(userId);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

ordersRouter.post("/", authGuard, requirePermission("orders:create"), idempotency(), (req, res, next) => {
  z.object({
    customerId: z.string().uuid(),
    branchId: z.string().uuid(),
    totalAmount: z.number().positive()
  })
    .parseAsync(req.body)
    .then(async (input) => {
      const idempotencyKey = String(
        req.header("x-idempotency-key") ?? req.body.idempotencyKey ?? ""
      );
      if (!idempotencyKey) {
        throw new AppError(
          422,
          "MISSING_IDEMPOTENCY_KEY",
          "Idempotency key wajib dikirim via header x-idempotency-key"
        );
      }
      const order = await service.createOrder({ ...input, idempotencyKey });
      await logAudit({
        actorId: req.user?.sub,
        action: "orders.create",
        moduleName: "orders",
        entityId: order?.id,
        afterData: order
      });
      res.status(201).json({ success: true, data: order });
    })
    .catch(next);
});

// Admin entry-point for orders that came in off-platform — Instagram DM,
// WhatsApp, phone call, walk-in. Takes a name + phone instead of a
// pre-registered customer UUID; the service either looks up an existing
// customer by phone or creates a new "manual" customer record.
//
// Intentionally bypasses the `idempotency()` middleware because the admin
// UI is a one-shot click, not a retry-prone webhook. Each call generates
// a unique `manual-<uuid>` idempotency key internally so we keep the same
// uniqueness constraint without forcing the form to pre-generate one.
const manualOrderSchema = z.object({
  customerName: z.string().trim().min(1).max(160),
  customerPhone: z.string().trim().min(6).max(40),
  branchId: z.string().uuid(),
  totalAmount: z.number().positive(),
  sourceChannel: z.enum([
    "web",
    "instagram",
    "whatsapp",
    "dm",
    "telepon",
    "email",
    "marketplace",
    "walkin",
    "lainnya"
  ]),
  notes: z.string().max(2000).optional().nullable()
});

ordersRouter.post(
  "/manual",
  authGuard,
  requirePermission("orders:create"),
  (req, res, next) => {
    manualOrderSchema
      .parseAsync(req.body)
      .then(async (input) => {
        const order = await service.createManualOrder({
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          branchId: input.branchId,
          totalAmount: input.totalAmount,
          sourceChannel: input.sourceChannel,
          notes: input.notes ?? null
        });
        await logAudit({
          actorId: req.user?.sub,
          action: "orders.create_manual",
          moduleName: "orders",
          entityId: order?.id,
          afterData: order
        });
        res.status(201).json({ success: true, data: order });
      })
      .catch(next);
  }
);

ordersRouter.post("/:id/payments", authGuard, idempotency(), (req, res, next) => {
  try {
    const orderId = String(req.params.id);
    const status = z.enum(["payment_dp", "payment_paid"]).parse(req.body.status);
    workflowService
      .processPayment(orderId, status === "payment_dp")
      .then((order) => res.json({ success: true, data: order }))
      .catch(next);
  } catch (error) {
    next(error);
  }
});

ordersRouter.post("/:id/pack", authGuard, async (req, res, next) => {
  try {
    const order = await service.transition(String(req.params.id), "packed");
    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
});

ordersRouter.post("/:id/ship", authGuard, async (req, res, next) => {
  try {
    const order = await workflowService.shipOrder(String(req.params.id));
    await logAudit({
      actorId: req.user?.sub,
      action: "orders.ship",
      moduleName: "orders",
      entityId: order?.id,
      afterData: order
    });
    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
});

ordersRouter.post("/:id/cancel", authGuard, requirePermission("orders:update"), async (req, res, next) => {
  try {
    const order = await workflowService.cancelOrder(String(req.params.id));
    await logAudit({
      actorId: req.user?.sub,
      action: "orders.cancel",
      moduleName: "orders",
      entityId: order?.id,
      afterData: order
    });
    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
});

ordersRouter.post("/:id/reserve-stock", authGuard, async (req, res, next) => {
  try {
    const order = await workflowService.reserveStock(String(req.params.id));
    await logAudit({
      actorId: req.user?.sub,
      action: "orders.reserve_stock",
      moduleName: "orders",
      entityId: order?.id,
      afterData: order
    });
    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
});

ordersRouter.post("/:id/invoice", authGuard, async (req, res, next) => {
  try {
    const order = await service.transition(String(req.params.id), "invoiced");
    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
});

ordersRouter.post(
  "/:id/post-finance",
  authGuard,
  requirePermission("finance:manage_finance"),
  async (req, res, next) => {
    try {
      const order = await workflowService.postToFinance(String(req.params.id));
      await logAudit({
        actorId: req.user?.sub,
        action: "orders.post_finance",
        moduleName: "orders",
        entityId: order?.id,
        afterData: order
      });
      res.json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  }
);

export { ordersRouter };
