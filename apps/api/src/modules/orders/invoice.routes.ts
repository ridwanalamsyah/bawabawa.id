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
    // Sanitize orderNumber before interpolating into the Content-Disposition
    // header. Strip anything outside [A-Za-z0-9._-] so a malicious order
    // number can't inject quotes or whitespace into the header (which would
    // break filename parsing in browsers and trip RFC 6266).
    const safeOrderNumber = String(data.order.orderNumber)
      .replace(/[^A-Za-z0-9._-]/g, "_")
      .slice(0, 80);
    const filename = `invoice-${safeOrderNumber}.pdf`;
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
