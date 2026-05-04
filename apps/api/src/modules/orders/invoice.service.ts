import PDFDocument from "pdfkit";
import { Readable } from "stream";
import { AppError } from "../../common/errors/app-error";

type QueryClient = {
  query: <Row = any>(sql: string, params?: any[]) => Promise<{ rows: Row[]; rowCount: number }>;
};

export type InvoiceData = {
  order: {
    id: string;
    orderNumber: string;
    status: string;
    paymentStatus: string;
    createdAt: string;
    subtotal: number;
    discountAmount: number;
    serviceChargeAmount: number;
    serviceChargeRate: number;
    taxAmount: number;
    taxRate: number;
    taxInclusive: boolean;
    totalAmount: number;
  };
  customer: { name: string; phone: string | null } | null;
  items: Array<{ name: string; sku: string | null; qty: number; unitPrice: number; subtotal: number }>;
  payments: Array<{ amount: number; method: string; status: string; paidAt: string | null }>;
  branch: { name: string } | null;
  /**
   * Branding pulled from CMS site_settings so the invoice uses the same
   * brand identity the customer sees in the storefront. Optional — falls
   * back to repo defaults when CMS hasn't been configured.
   */
  brand: { name: string; tagline: string | null; logoUrl: string | null } | null;
};

const formatRupiah = (n: number): string =>
  "Rp " + Math.round(n).toLocaleString("id-ID");

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
};

/**
 * Pull every row needed to render an invoice for `orderId`. Throws 404 if
 * the order doesn't exist. Tolerates missing optional rows (no customer
 * yet, no branch, no payments) by returning nullable fields.
 */
export async function loadInvoiceData(
  client: QueryClient,
  orderId: string
): Promise<InvoiceData> {
  const orderRes = await client.query<{
    id: string;
    order_number: string;
    status: string;
    payment_status: string;
    created_at: string;
    subtotal: string | null;
    discount_amount: string | null;
    service_charge_amount: string | null;
    service_charge_rate: string | null;
    tax_amount: string | null;
    tax_rate: string | null;
    tax_inclusive: boolean | number | null;
    total_amount: string;
    customer_id: string | null;
    branch_id: string | null;
  }>(
    `SELECT id, order_number, status, payment_status, created_at,
            subtotal, discount_amount, service_charge_amount, service_charge_rate,
            tax_amount, tax_rate, tax_inclusive, total_amount, customer_id, branch_id
       FROM orders WHERE id = $1`,
    [orderId]
  );
  if (!orderRes.rowCount) {
    throw new AppError(404, "ORDER_NOT_FOUND", "Order tidak ditemukan");
  }
  const o = orderRes.rows[0];

  const itemsRes = await client.query<{
    qty: number;
    unit_price: string;
    subtotal: string;
    name: string | null;
    sku: string | null;
  }>(
    `SELECT oi.qty, oi.unit_price, oi.subtotal, p.name, p.sku
       FROM order_items oi
       LEFT JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = $1`,
    [orderId]
  );

  const paymentsRes = await client.query<{
    amount: string;
    method: string;
    status: string;
    paid_at: string | null;
  }>(
    `SELECT amount, method, status, paid_at FROM payments
       WHERE order_id = $1 ORDER BY paid_at NULLS LAST`,
    [orderId]
  );

  let customer: InvoiceData["customer"] = null;
  if (o.customer_id) {
    const cr = await client.query<{ name: string; phone: string | null }>(
      "SELECT name, phone FROM customers WHERE id = $1",
      [o.customer_id]
    );
    customer = cr.rowCount ? cr.rows[0] : null;
  }

  let branch: InvoiceData["branch"] = null;
  if (o.branch_id) {
    const br = await client.query<{ name: string }>(
      "SELECT name FROM branches WHERE id = $1",
      [o.branch_id]
    );
    branch = br.rowCount ? br.rows[0] : null;
  }

  // Pull current brand from CMS — single row table; row missing means CMS
  // never seeded so we fall back to repo defaults.
  let brand: InvoiceData["brand"] = null;
  try {
    const sb = await client.query<{ brand: string | null }>(
      "SELECT brand FROM site_settings LIMIT 1"
    );
    if (sb.rowCount && sb.rows[0].brand) {
      const b = JSON.parse(sb.rows[0].brand) as {
        name?: string;
        tagline?: string;
        logoUrl?: string;
      };
      brand = {
        name: b.name ?? "Bawa Bawa",
        tagline: b.tagline ?? null,
        logoUrl: b.logoUrl ?? null
      };
    }
  } catch {
    brand = null;
  }

  return {
    order: {
      id: o.id,
      orderNumber: o.order_number,
      status: o.status,
      paymentStatus: o.payment_status,
      createdAt: o.created_at,
      subtotal: Number(o.subtotal ?? o.total_amount),
      discountAmount: Number(o.discount_amount ?? 0),
      serviceChargeAmount: Number(o.service_charge_amount ?? 0),
      serviceChargeRate: Number(o.service_charge_rate ?? 0),
      taxAmount: Number(o.tax_amount ?? 0),
      taxRate: Number(o.tax_rate ?? 0),
      taxInclusive: Boolean(o.tax_inclusive),
      totalAmount: Number(o.total_amount)
    },
    customer,
    items: itemsRes.rows.map((r) => ({
      name: r.name ?? "—",
      sku: r.sku,
      qty: Number(r.qty),
      unitPrice: Number(r.unit_price),
      subtotal: Number(r.subtotal)
    })),
    payments: paymentsRes.rows.map((r) => ({
      amount: Number(r.amount),
      method: r.method,
      status: r.status,
      paidAt: r.paid_at
    })),
    branch,
    brand
  };
}

/**
 * Render an invoice PDF as a Node Readable stream. Caller is expected to
 * pipe the stream to a `Response` or write it to disk. The stream finishes
 * automatically when `doc.end()` is called below — no manual flush needed.
 */
export function renderInvoicePdf(data: InvoiceData): Readable {
  const doc = new PDFDocument({ size: "A4", margin: 48 });
  const brandName = data.brand?.name ?? "Bawa Bawa";
  const brandTagline = data.brand?.tagline ?? null;

  // === Header ============================================================
  doc.fontSize(22).fillColor("#1f2d22").text(brandName, { continued: false });
  if (brandTagline) {
    doc.fontSize(10).fillColor("#647561").text(brandTagline);
  }
  doc.moveDown(0.3);
  doc
    .fontSize(16)
    .fillColor("#000")
    .text("INVOICE", { align: "right" });
  doc
    .fontSize(10)
    .fillColor("#444")
    .text(`No: ${data.order.orderNumber}`, { align: "right" })
    .text(`Tanggal: ${formatDate(data.order.createdAt)}`, { align: "right" })
    .text(`Status: ${data.order.paymentStatus}`, { align: "right" });

  doc.moveDown(1);
  doc
    .strokeColor("#cdd5c8")
    .lineWidth(0.8)
    .moveTo(48, doc.y)
    .lineTo(547, doc.y)
    .stroke();
  doc.moveDown(0.6);

  // === Bill-to ==========================================================
  doc.fontSize(10).fillColor("#647561").text("Ditagihkan kepada");
  doc.fillColor("#000");
  if (data.customer) {
    doc.fontSize(12).text(data.customer.name);
    if (data.customer.phone) doc.fontSize(10).fillColor("#444").text(data.customer.phone);
  } else {
    doc.fontSize(12).text("Walk-in customer");
  }
  if (data.branch) {
    doc.moveDown(0.3).fontSize(10).fillColor("#647561").text("Cabang: " + data.branch.name);
  }
  doc.moveDown(0.8);

  // === Items table ======================================================
  const tableTop = doc.y;
  const colX = { name: 48, qty: 320, price: 380, subtotal: 470 };
  doc.fontSize(10).fillColor("#647561");
  doc.text("Produk", colX.name, tableTop);
  doc.text("Qty", colX.qty, tableTop, { width: 50, align: "right" });
  doc.text("Harga", colX.price, tableTop, { width: 80, align: "right" });
  doc.text("Subtotal", colX.subtotal, tableTop, { width: 75, align: "right" });
  doc
    .strokeColor("#cdd5c8")
    .moveTo(48, tableTop + 14)
    .lineTo(547, tableTop + 14)
    .stroke();

  let cursorY = tableTop + 20;
  doc.fillColor("#000").fontSize(10);
  for (const item of data.items) {
    doc.text(item.name, colX.name, cursorY, { width: 260 });
    doc.text(String(item.qty), colX.qty, cursorY, { width: 50, align: "right" });
    doc.text(formatRupiah(item.unitPrice), colX.price, cursorY, { width: 80, align: "right" });
    doc.text(formatRupiah(item.subtotal), colX.subtotal, cursorY, { width: 75, align: "right" });
    cursorY = doc.y + 4;
    doc.y = cursorY;
  }
  if (!data.items.length) {
    doc.fillColor("#9aa39a").text("(tidak ada item)", colX.name, cursorY);
    cursorY = doc.y + 4;
  }
  doc
    .strokeColor("#cdd5c8")
    .moveTo(48, cursorY + 4)
    .lineTo(547, cursorY + 4)
    .stroke();
  doc.y = cursorY + 12;

  // === Totals ===========================================================
  const totalsX = 380;
  const totalsW = 165;
  const writeRow = (label: string, value: string, opts?: { bold?: boolean }) => {
    if (opts?.bold) doc.fontSize(12).fillColor("#000");
    else doc.fontSize(10).fillColor("#444");
    doc.text(label, totalsX, doc.y, { width: 100, align: "left", continued: true });
    doc.text(value, totalsX + 100, doc.y, { width: 65, align: "right" });
    doc.moveDown(0.2);
  };

  writeRow("Subtotal", formatRupiah(data.order.subtotal));
  if (data.order.discountAmount > 0) {
    writeRow("Diskon", "-" + formatRupiah(data.order.discountAmount));
  }
  if (data.order.serviceChargeAmount > 0) {
    const pct = (data.order.serviceChargeRate * 100).toFixed(0);
    writeRow(`Service ${pct}%`, formatRupiah(data.order.serviceChargeAmount));
  }
  if (data.order.taxAmount > 0) {
    const pct = (data.order.taxRate * 100).toFixed(0);
    const label = data.order.taxInclusive ? `PPN ${pct}% (incl)` : `PPN ${pct}%`;
    writeRow(label, formatRupiah(data.order.taxAmount));
  }
  doc.moveDown(0.2);
  doc
    .strokeColor("#1f2d22")
    .lineWidth(1)
    .moveTo(totalsX, doc.y)
    .lineTo(totalsX + totalsW, doc.y)
    .stroke();
  doc.moveDown(0.3);
  writeRow("TOTAL", formatRupiah(data.order.totalAmount), { bold: true });

  doc.moveDown(1);

  // === Payments =========================================================
  if (data.payments.length) {
    doc.fontSize(10).fillColor("#647561").text("Pembayaran", 48, doc.y);
    doc.fillColor("#000");
    for (const p of data.payments) {
      const when = p.paidAt ? ` — ${formatDate(p.paidAt)}` : "";
      doc.fontSize(10).text(`${p.method.toUpperCase()} ${formatRupiah(p.amount)} (${p.status})${when}`);
    }
  }

  doc.moveDown(2);
  doc.fontSize(9).fillColor("#9aa39a").text("Terima kasih telah berbelanja di " + brandName, {
    align: "center"
  });

  doc.end();
  return doc as unknown as Readable;
}
