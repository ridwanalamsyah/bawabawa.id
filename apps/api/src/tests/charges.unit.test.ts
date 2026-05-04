import { describe, expect, it } from "vitest";
import { applyCharges, computeTotals, DEFAULT_PPN_RATE } from "../modules/orders/charges.service";

describe("computeTotals", () => {
  it("returns zero-charge breakdown when no rates given", () => {
    const r = computeTotals({ subtotal: 100 });
    expect(r).toMatchObject({
      subtotal: 100,
      discountAmount: 0,
      serviceChargeAmount: 0,
      taxAmount: 0,
      totalAmount: 100
    });
  });

  it("applies PPN 11% exclusive on bare subtotal", () => {
    const r = computeTotals({ subtotal: 100000, taxRate: DEFAULT_PPN_RATE });
    expect(r.taxAmount).toBe(11000);
    expect(r.totalAmount).toBe(111000);
  });

  it("applies service charge then tax on top (F&B convention)", () => {
    // 5% service charge, 11% tax on (subtotal + service)
    const r = computeTotals({
      subtotal: 100000,
      serviceChargeRate: 0.05,
      taxRate: 0.11
    });
    expect(r.serviceChargeAmount).toBe(5000);
    expect(r.taxableBase).toBe(105000);
    expect(r.taxAmount).toBe(11550);
    expect(r.totalAmount).toBe(116550);
  });

  it("subtracts discount before service+tax", () => {
    // Subtotal 100, discount 10 → post-discount 90, service 5% → 4.5,
    // taxable 94.5, tax 11% → 10.395 ≈ 10.4, total 104.9
    const r = computeTotals({
      subtotal: 100,
      discountAmount: 10,
      serviceChargeRate: 0.05,
      taxRate: 0.11
    });
    expect(r.discountAmount).toBe(10);
    expect(r.serviceChargeAmount).toBe(4.5);
    expect(r.taxableBase).toBe(94.5);
    expect(r.taxAmount).toBe(10.4);
    // taxableBase + taxAmount = 94.5 + 10.4 = 104.9
    expect(r.totalAmount).toBe(104.9);
  });

  it("tax-inclusive back-solves tax from subtotal", () => {
    // harga sudah termasuk PPN: 111000 includes 11% tax
    // pretax = 111000 / 1.11 = 100000, tax = 11000
    const r = computeTotals({
      subtotal: 111000,
      taxRate: 0.11,
      taxInclusive: true
    });
    expect(r.taxAmount).toBe(11000);
    expect(r.totalAmount).toBe(111000);
  });

  it("rejects discount greater than subtotal", () => {
    expect(() =>
      computeTotals({ subtotal: 100, discountAmount: 150 })
    ).toThrow();
  });

  it("rejects negative subtotal", () => {
    expect(() => computeTotals({ subtotal: -1 })).toThrow();
  });

  it("rejects tax rate > 1 (percentage confusion guard)", () => {
    expect(() => computeTotals({ subtotal: 100, taxRate: 11 })).toThrow();
  });

  it("rounds monetary outputs to 2 decimals", () => {
    const r = computeTotals({ subtotal: 33.333, taxRate: 0.11 });
    expect(r.taxAmount).toBe(3.67);
    expect(r.totalAmount).toBe(37.0);
  });
});

describe("applyCharges", () => {
  function makeFakeClient(initial: {
    subtotal: number;
    total_amount: number;
    discount_amount?: number;
  }) {
    const state = {
      subtotal: initial.subtotal,
      total_amount: initial.total_amount,
      discount_amount: initial.discount_amount ?? 0,
      service_charge_amount: 0,
      service_charge_rate: 0,
      tax_amount: 0,
      tax_rate: 0,
      tax_inclusive: false
    };
    return {
      state,
      async query<Row = any>(
        sql: string,
        params: any[] = []
      ): Promise<{ rows: Row[]; rowCount: number }> {
        const t = sql.trim();
        if (/^SELECT subtotal, total_amount, discount_amount/i.test(t)) {
          return {
            rows: [
              {
                subtotal: String(state.subtotal),
                total_amount: String(state.total_amount),
                discount_amount: String(state.discount_amount)
              } as unknown as Row
            ],
            rowCount: 1
          };
        }
        if (/^UPDATE orders\s+SET subtotal/i.test(t)) {
          const [
            subtotal,
            discountAmount,
            serviceChargeAmount,
            serviceChargeRate,
            taxAmount,
            taxRate,
            taxInclusive,
            totalAmount
          ] = params;
          state.subtotal = Number(subtotal);
          state.discount_amount = Number(discountAmount);
          state.service_charge_amount = Number(serviceChargeAmount);
          state.service_charge_rate = Number(serviceChargeRate);
          state.tax_amount = Number(taxAmount);
          state.tax_rate = Number(taxRate);
          state.tax_inclusive = Boolean(taxInclusive);
          state.total_amount = Number(totalAmount);
          return { rows: [], rowCount: 1 };
        }
        throw new Error(`unmocked SQL in charges test: ${t.slice(0, 80)}`);
      }
    };
  }

  it("applies PPN 11% and writes back all charge fields", async () => {
    const client = makeFakeClient({ subtotal: 100000, total_amount: 100000 });
    const result = await applyCharges(client, {
      orderId: "order-1",
      taxRate: 0.11
    });
    expect(result.taxAmount).toBe(11000);
    expect(result.totalAmount).toBe(111000);
    expect(client.state.total_amount).toBe(111000);
    expect(client.state.tax_amount).toBe(11000);
    expect(client.state.tax_rate).toBe(0.11);
  });

  it("falls back to total_amount when subtotal column is zero (legacy order)", async () => {
    // Pre-migration-011 order: subtotal=0, total_amount has the real value
    const client = makeFakeClient({ subtotal: 0, total_amount: 50000 });
    const result = await applyCharges(client, {
      orderId: "legacy-order",
      taxRate: 0.11
    });
    expect(result.subtotal).toBe(50000);
    expect(result.totalAmount).toBe(55500);
  });

  it("respects prior discount_amount in the row", async () => {
    const client = makeFakeClient({
      subtotal: 100000,
      total_amount: 90000,
      discount_amount: 10000
    });
    const result = await applyCharges(client, {
      orderId: "order-1",
      taxRate: 0.11
    });
    // post-discount 90000, tax = 9900, total = 99900
    expect(result.taxAmount).toBe(9900);
    expect(result.totalAmount).toBe(99900);
  });

  it("throws ORDER_NOT_FOUND when order missing", async () => {
    const client = {
      async query() {
        return { rows: [], rowCount: 0 };
      }
    };
    await expect(
      applyCharges(client, { orderId: "nope", taxRate: 0.11 })
    ).rejects.toMatchObject({ code: "ORDER_NOT_FOUND" });
  });
});
