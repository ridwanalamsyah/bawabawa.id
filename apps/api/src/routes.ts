import { Router } from "express";
import { authRouter } from "./modules/auth/auth.routes";
import { rbacRouter } from "./modules/rbac/rbac.routes";
import { ordersRouter } from "./modules/orders/orders.routes";
import { paymentsRouter } from "./modules/orders/payments.routes";
import { inventoryRouter } from "./modules/inventory/inventory.routes";
import { financeRouter } from "./modules/finance/finance.routes";
import { approvalRouter } from "./modules/finance/approval.routes";
import { whatsappRouter } from "./modules/whatsapp/whatsapp.routes";
import { importsRouter } from "./modules/imports/imports.routes";
import { reportsRouter } from "./modules/reports/reports.routes";
import { procurementRouter } from "./modules/procurement/procurement.routes";
import { crmRouter } from "./modules/crm/crm.routes";
import { hrRouter } from "./modules/hr/hr.routes";
import { erpRouter } from "./modules/erp/erp.routes";
import { cmsRouter } from "./modules/cms/cms.routes";
import { pingDatabase } from "./infrastructure/db/pool";
import { getMetricsSnapshot } from "./common/observability/metrics";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({ success: true, data: { status: "ok" } });
});

apiRouter.get("/health/ready", async (_req, res, next) => {
  try {
    await pingDatabase();
    res.json({ success: true, data: { status: "ready", db: "up" } });
  } catch (error) {
    next(error);
  }
});

apiRouter.get("/metrics", (_req, res) => {
  res.json({ success: true, data: getMetricsSnapshot() });
});

apiRouter.use("/auth", authRouter);
apiRouter.use("/rbac", rbacRouter);
apiRouter.use("/orders", ordersRouter);
apiRouter.use("/orders", paymentsRouter);
apiRouter.use("/inventory", inventoryRouter);
apiRouter.use("/finance", financeRouter);
apiRouter.use("/approvals", approvalRouter);
apiRouter.use("/whatsapp", whatsappRouter);
apiRouter.use("/import", importsRouter);
apiRouter.use("/reports", reportsRouter);
apiRouter.use("/procurement", procurementRouter);
apiRouter.use("/crm", crmRouter);
apiRouter.use("/hr", hrRouter);
apiRouter.use("/erp", erpRouter);
apiRouter.use("/cms", cmsRouter);
