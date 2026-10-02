import { Router } from "express";
import { authRouter } from "./modules/auth/auth.routes";
import { adminUsersRouter } from "./modules/admin/admin-users.routes";
import { rbacRouter } from "./modules/rbac/rbac.routes";
import { ordersRouter } from "./modules/orders/orders.routes";
import { branchesRouter } from "./modules/orders/branches.routes";
import { paymentsRouter } from "./modules/orders/payments.routes";
import {
  applyVoucherRouter,
  publicVouchersRouter,
  vouchersRouter
} from "./modules/orders/vouchers.routes";
import { shippingRouter, shippingWebhookRouter } from "./modules/shipping/biteship.routes";
import { dokuRouter, paymentsConfigRouter } from "./modules/payments/doku.routes";
import { invoiceRouter } from "./modules/orders/invoice.routes";
import { chargesRouter } from "./modules/orders/charges.routes";
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
import { publicBlogRouter, adminBlogRouter } from "./modules/cms/blog.routes";
import { publicTripsRouter, adminTripsRouter } from "./modules/erp/trips.routes";
import { emailsRouter, emailsWebhookRouter } from "./modules/email/resend.routes";
import { fonnteRouter, fonnteWebhookRouter } from "./modules/whatsapp/fonnte.routes";
import { uploadsRouter } from "./modules/uploads/uploads.routes";
import {
  adminOrderRequestsRouter,
  myOrderRequestsRouter,
  publicOrderRequestsRouter
} from "./modules/order-requests/order-requests.routes";
import { adminCatalogRouter, publicCatalogRouter } from "./modules/order-requests/catalog.routes";
import { adminReviewsRouter, publicReviewsRouter } from "./modules/order-requests/reviews";
import { adminPartnersRouter, publicPartnersRouter } from "./modules/partners/partners.routes";
import { cronRouter } from "./modules/cron/cron.routes";
import { pingDatabase } from "./infrastructure/db/pool";
import { getMetricsSnapshot } from "./common/observability/metrics";
import { authGuard, requirePermission } from "./common/middleware/auth";
import { authRateLimit } from "./common/security/rate-limit";

export const apiRouter = Router();

/**
 * Mounted by app.ts ahead of express.json() so each receiver's own
 * body parser can capture `req.rawBody` for signature verification.
 */
export const webhooksRouter = Router();
webhooksRouter.use(dokuRouter);
webhooksRouter.use(shippingWebhookRouter);
webhooksRouter.use(emailsWebhookRouter);
webhooksRouter.use(fonnteWebhookRouter);

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

apiRouter.get("/metrics", authGuard, requirePermission("users:manage_users"), (_req, res) => {
  res.json({ success: true, data: getMetricsSnapshot() });
});

apiRouter.use("/auth", authRateLimit, authRouter);
apiRouter.use("/admin/orders/requests", adminOrderRequestsRouter);
apiRouter.use("/admin/catalog", adminCatalogRouter);
apiRouter.use("/admin/reviews", adminReviewsRouter);
apiRouter.use("/admin/partner-inquiries", adminPartnersRouter);
apiRouter.use("/admin", adminUsersRouter);
apiRouter.use("/rbac", rbacRouter);
apiRouter.use("/orders", ordersRouter);
apiRouter.use("/orders", paymentsRouter);
apiRouter.use("/branches", branchesRouter);
apiRouter.use("/orders", applyVoucherRouter);
apiRouter.use("/orders", invoiceRouter);
apiRouter.use("/orders", chargesRouter);
apiRouter.use("/vouchers", vouchersRouter);
apiRouter.use("/promotions", publicVouchersRouter);
apiRouter.use("/shipping", shippingRouter);
apiRouter.use("/payments", paymentsConfigRouter);
apiRouter.use("/emails", emailsRouter);
apiRouter.use("/inventory", inventoryRouter);
apiRouter.use("/finance", financeRouter);
apiRouter.use("/approvals", approvalRouter);
apiRouter.use("/whatsapp", whatsappRouter);
apiRouter.use("/whatsapp/fonnte", fonnteRouter);
apiRouter.use("/import", importsRouter);
apiRouter.use("/reports", reportsRouter);
apiRouter.use("/procurement", procurementRouter);
apiRouter.use("/crm", crmRouter);
apiRouter.use("/hr", hrRouter);
apiRouter.use("/erp", erpRouter);
apiRouter.use("/cms", cmsRouter);
apiRouter.use("/blog-posts", publicBlogRouter);
apiRouter.use("/admin/blog-posts", adminBlogRouter);
apiRouter.use("/uploads", uploadsRouter);
apiRouter.use("/trips", publicTripsRouter);
apiRouter.use("/public/order-requests", publicOrderRequestsRouter);
apiRouter.use("/public/order-requests", publicReviewsRouter);
apiRouter.use("/public/partner-inquiries", publicPartnersRouter);
apiRouter.use("/cron", cronRouter);
apiRouter.use("/order-requests", myOrderRequestsRouter);
apiRouter.use("/catalog", publicCatalogRouter);
apiRouter.use("/admin/trips", adminTripsRouter);
