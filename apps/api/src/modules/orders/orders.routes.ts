import { Router } from "express";
import { z } from "zod";
import { authGuard, requirePermission } from "../../common/middleware/auth";
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

ordersRouter.post("/", authGuard, requirePermission("orders:create"), (req, res, next) => {
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

ordersRouter.post("/:id/payments", authGuard, (req, res, next) => {
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
    const order = await service.transition(String(req.params.id), "shipped");
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
