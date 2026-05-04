import { describe, expect, it } from "vitest";
import {
  loadInvoiceData,
  renderInvoicePdf,
  type InvoiceData
} from "../modules/orders/invoice.service";

function makeFakeClient(opts: {
  order?: any;
  items?: any[];
  payments?: any[];
  customer?: any;
  branch?: any;
  brand?: any;
}) {
  return {
    async query<Row = any>(sql: string, _params: any[] = []): Promise<{ rows: Row[]; rowCount: number }> {
      const t = sql.trim();
      if (/^SELECT id, order_number/i.test(t)) {
        return opts.order
          ? { rows: [opts.order as Row], rowCount: 1 }
          : { rows: [], rowCount: 0 };
      }
      if (/^SELECT oi\.qty/i.test(t)) {
        return { rows: (opts.items ?? []) as Row[], rowCount: (opts.items ?? []).length };
      }
      if (/^SELECT amount, method/i.test(t)) {
        return {
          rows: (opts.payments ?? []) as Row[],
          rowCount: (opts.payments ?? []).length
        };
      }
      if (/^SELECT name, phone FROM customers/i.test(t)) {
        return opts.customer
          ? { rows: [opts.customer as Row], rowCount: 1 }
          : { rows: [], rowCount: 0 };
      }
      if (/^SELECT name FROM branches/i.test(t)) {
        return opts.branch
          ? { rows: [opts.branch as Row], rowCount: 1 }
          : { rows: [], rowCount: 0 };
      }
      if (/^SELECT brand FROM site_settings/i.test(t)) {
        return opts.brand
          ? { rows: [opts.brand as Row], rowCount: 1 }
          : { rows: [], rowCount: 0 };
      }
      throw new Error(`unmocked SQL: ${t.slice(0, 60)}`);
    }
  };
}

const baseOrder = {
  id: "o-1",
  order_number: "INV-001",
  status: "confirmed",
  payment_status: "paid",
  created_at: "2026-01-15T10:00:00Z",
  subtotal: "100000",
  discount_amount: "0",
  service_charge_amount: "0",
  service_charge_rate: "0",
  tax_amount: "11000",
  tax_rate: "0.11",
  tax_inclusive: false,
  total_amount: "111000",
  customer_id: null,
  branch_id: null
};

describe("loadInvoiceData", () => {
  it("throws ORDER_NOT_FOUND when order missing", async () => {
    const client = makeFakeClient({});
    await expect(loadInvoiceData(client, "missing")).rejects.toMatchObject({
      code: "ORDER_NOT_FOUND"
    });
  });

  it("loads order with items and parses numeric strings", async () => {
    const client = makeFakeClient({
      order: baseOrder,
      items: [
        { qty: 2, unit_price: "50000", subtotal: "100000", name: "Kemeja", sku: "SKU-1" }
      ]
    });
    const data = await loadInvoiceData(client, "o-1");
    expect(data.order.subtotal).toBe(100000);
    expect(data.order.taxAmount).toBe(11000);
    expect(data.order.totalAmount).toBe(111000);
    expect(data.items).toHaveLength(1);
    expect(data.items[0].subtotal).toBe(100000);
    expect(data.customer).toBeNull();
    expect(data.branch).toBeNull();
  });

  it("falls back to total_amount when subtotal column null (legacy)", async () => {
    const client = makeFakeClient({
      order: { ...baseOrder, subtotal: null }
    });
    const data = await loadInvoiceData(client, "o-1");
    expect(data.order.subtotal).toBe(111000);
  });

  it("loads customer + branch when referenced", async () => {
    const client = makeFakeClient({
      order: { ...baseOrder, customer_id: "c-1", branch_id: "b-1" },
      customer: { name: "Budi", phone: "08123" },
      branch: { name: "Pusat" }
    });
    const data = await loadInvoiceData(client, "o-1");
    expect(data.customer).toEqual({ name: "Budi", phone: "08123" });
    expect(data.branch).toEqual({ name: "Pusat" });
  });

  it("loads brand from CMS site_settings when present", async () => {
    const client = makeFakeClient({
      order: baseOrder,
      brand: {
        brand: JSON.stringify({
          name: "Bawa Bawa",
          tagline: "Lifestyle Indonesia",
          logoUrl: "https://example.com/logo.png"
        })
      }
    });
    const data = await loadInvoiceData(client, "o-1");
    expect(data.brand?.name).toBe("Bawa Bawa");
    expect(data.brand?.tagline).toBe("Lifestyle Indonesia");
  });

  it("tolerates malformed brand JSON without throwing", async () => {
    const client = makeFakeClient({
      order: baseOrder,
      brand: { brand: "{not-json" }
    });
    const data = await loadInvoiceData(client, "o-1");
    expect(data.brand).toBeNull();
  });
});

describe("renderInvoicePdf", () => {
  function collectStream(data: InvoiceData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const stream = renderInvoicePdf(data);
      const chunks: Buffer[] = [];
      stream.on("data", (c: Buffer) => chunks.push(c));
      stream.on("end", () => resolve(Buffer.concat(chunks)));
      stream.on("error", reject);
    });
  }

  const fixture: InvoiceData = {
    order: {
      id: "o-1",
      orderNumber: "INV-001",
      status: "confirmed",
      paymentStatus: "paid",
      createdAt: "2026-01-15T10:00:00Z",
      subtotal: 100000,
      discountAmount: 10000,
      serviceChargeAmount: 4500,
      serviceChargeRate: 0.05,
      taxAmount: 10395,
      taxRate: 0.11,
      taxInclusive: false,
      totalAmount: 104895
    },
    customer: { name: "Budi", phone: "08123" },
    items: [
      { name: "Kemeja", sku: "SKU-1", qty: 2, unitPrice: 50000, subtotal: 100000 }
    ],
    payments: [
      { amount: 104895, method: "qris", status: "succeeded", paidAt: "2026-01-15T10:05:00Z" }
    ],
    branch: { name: "Pusat" },
    brand: { name: "Bawa Bawa", tagline: "Lifestyle Indonesia", logoUrl: null }
  };

  it("emits a non-empty PDF byte stream", async () => {
    const buf = await collectStream(fixture);
    expect(buf.length).toBeGreaterThan(500);
    // PDF spec: file starts with %PDF-
    expect(buf.subarray(0, 5).toString()).toBe("%PDF-");
  });

  it("renders without customer/branch/brand (graceful degradation)", async () => {
    const minimal: InvoiceData = {
      ...fixture,
      customer: null,
      branch: null,
      brand: null,
      payments: [],
      items: []
    };
    const buf = await collectStream(minimal);
    expect(buf.subarray(0, 5).toString()).toBe("%PDF-");
  });
});
