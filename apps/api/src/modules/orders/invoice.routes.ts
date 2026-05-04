import { Router } from "express";
import { authGuard } from "../../common/middleware/auth";
import { getPool } from "../../infrastructure/db/pool";
import { loadInvoiceData, renderInvoicePdf } from "./invoice.service";

const invoiceRouter = Router({ mergeParams: true });

/**
 * GET /api/v1/orders/:id/invoice.pdf — stream a PDF invoice for the order.
 * Sets `Content-Disposition: inline` so browsers preview rather than force-
 * download; clients can override with `?download=1` to force a download
 * dialog (handy for "save invoice" buttons in the UI).
 */
invoiceRouter.get("/:id/invoice.pdf", authGuard, async (req, res, next) => {
  try {
    const orderId = String(req.params.id);
    const data = await loadInvoiceData(await getPool(), orderId);
    const filename = `invoice-${data.order.orderNumber}.pdf`;
    const disposition = req.query.download === "1" ? "attachment" : "inline";
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `${disposition}; filename="${filename}"`);
    const stream = renderInvoicePdf(data);
    stream.on("error", next);
    stream.pipe(res);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/orders/:id/invoice — JSON view of the data the PDF renders
 * from. Useful for an HTML invoice preview in the SPA without rasterizing
 * a PDF.
 */
invoiceRouter.get("/:id/invoice", authGuard, async (req, res, next) => {
  try {
    const orderId = String(req.params.id);
    const data = await loadInvoiceData(await getPool(), orderId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

export { invoiceRouter };
