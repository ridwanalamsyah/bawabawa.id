import { describe, expect, it } from "vitest";
import {
  calculateDiscount,
  createVoucher,
  redeemVoucher,
  validateAndCompute,
  type VoucherRow
} from "../modules/orders/vouchers.service";

function makeVoucher(overrides: Partial<VoucherRow> = {}): VoucherRow {
  return {
    id: "v-1",
    code: "PROMO10",
    description: null,
    discount_type: "percentage",
    discount_value: "10",
    max_discount: null,
    min_order_amount: "0",
    max_uses: null,
    per_user_limit: null,
    starts_at: null,
    ends_at: null,
    is_active: true,
    used_count: 0,
    ...overrides
  };
}

/**
 * In-memory fake covering just the INSERT/UPDATE/SELECT statements the
 * voucher service issues. Keeps tests hermetic without spinning up a DB.
 */
function makeFakeClient(initial: Partial<VoucherRow>[] = []) {
  const state = {
    vouchers: initial.map((v, i) => makeVoucher({ id: `v-${i + 1}`, ...v })),
    redemptions: [] as Array<{
      id: string;
      voucher_id: string;
      order_id: string;
      customer_id: string | null;
      discount_applied: number;
    }>
  };

  return {
    state,
    async query<Row = any>(
      sql: string,
      params: any[] = []
    ): Promise<{ rows: Row[]; rowCount: number }> {
      const t = sql.trim();
      if (/^INSERT INTO vouchers/i.test(t)) {
        const [
          id,
          code,
          description,
          discountType,
          discountValue,
          maxDiscount,
          minOrder,
          maxUses,
          perUserLimit,
          startsAt,
          endsAt
        ] = params;
        state.vouchers.push(
          makeVoucher({
            id,
            code,
            description,
            discount_type: discountType,
            discount_value: String(discountValue),
            max_discount: maxDiscount != null ? String(maxDiscount) : null,
            min_order_amount: String(minOrder),
            max_uses: maxUses,
            per_user_limit: perUserLimit,
            starts_at: startsAt,
            ends_at: endsAt
          })
        );
        return { rows: [], rowCount: 1 };
      }
      if (/^SELECT \* FROM vouchers WHERE code/i.test(t)) {
        const [code] = params;
        const match = state.vouchers.find((v) => v.code === code);
        return match
          ? { rows: [match as unknown as Row], rowCount: 1 }
          : { rows: [], rowCount: 0 };
      }
      if (/^SELECT COUNT\(\*\) AS count FROM voucher_redemptions/i.test(t)) {
        const [voucherId, customerId] = params;
        const count = state.redemptions.filter(
          (r) => r.voucher_id === voucherId && r.customer_id === customerId
        ).length;
        return {
          rows: [{ count } as unknown as Row],
          rowCount: 1
        };
      }
      if (/^UPDATE vouchers\s+SET used_count = used_count \+ 1/i.test(t)) {
        const [voucherId] = params;
        const v = state.vouchers.find((x) => x.id === voucherId);
        if (!v || !v.is_active) return { rows: [], rowCount: 0 };
        if (v.max_uses != null && v.used_count >= v.max_uses) {
          return { rows: [], rowCount: 0 };
        }
        v.used_count += 1;
        return { rows: [], rowCount: 1 };
      }
      if (/^INSERT INTO voucher_redemptions/i.test(t)) {
        const [id, voucherId, orderId, customerId, discountApplied] = params;
        state.redemptions.push({
          id,
          voucher_id: voucherId,
          order_id: orderId,
          customer_id: customerId,
          discount_applied: Number(discountApplied)
        });
        return { rows: [], rowCount: 1 };
      }
      throw new Error(`unmocked SQL in voucher test: ${t.slice(0, 80)}`);
    }
  };
}

describe("calculateDiscount", () => {
  it("applies percentage discount", () => {
    const v = makeVoucher({ discount_type: "percentage", discount_value: "10" });
    expect(calculateDiscount(v, 200)).toBe(20);
  });

  it("applies fixed amount discount", () => {
    const v = makeVoucher({ discount_type: "fixed", discount_value: "50" });
    expect(calculateDiscount(v, 200)).toBe(50);
  });

  it("caps percentage discount by max_discount", () => {
    const v = makeVoucher({
      discount_type: "percentage",
      discount_value: "50",
      max_discount: "30"
    });
    expect(calculateDiscount(v, 200)).toBe(30);
  });

  it("never exceeds order subtotal", () => {
    const v = makeVoucher({ discount_type: "fixed", discount_value: "500" });
    expect(calculateDiscount(v, 100)).toBe(100);
  });

  it("rejects when subtotal below min_order_amount", () => {
    const v = makeVoucher({ min_order_amount: "100" });
    expect(() => calculateDiscount(v, 50)).toThrow();
  });
});

describe("createVoucher", () => {
  it("rejects non-positive discount value", async () => {
    const client = makeFakeClient();
    await expect(
      createVoucher(client, {
        code: "BAD",
        discountType: "fixed",
        discountValue: 0
      })
    ).rejects.toMatchObject({ code: "INVALID_DISCOUNT_VALUE" });
  });

  it("rejects percentage > 100", async () => {
    const client = makeFakeClient();
    await expect(
      createVoucher(client, {
        code: "BAD",
        discountType: "percentage",
        discountValue: 150
      })
    ).rejects.toMatchObject({ code: "INVALID_PERCENTAGE" });
  });

  it("stores code in uppercase", async () => {
    const client = makeFakeClient();
    const result = await createVoucher(client, {
      code: "promo10",
      discountType: "percentage",
      discountValue: 10
    });
    expect(result.code).toBe("PROMO10");
  });
});

describe("validateAndCompute", () => {
  it("rejects inactive voucher", async () => {
    const client = makeFakeClient();
    const v = makeVoucher({ is_active: false });
    await expect(validateAndCompute(client, v, { orderSubtotal: 100 })).rejects.toMatchObject({
      code: "VOUCHER_INACTIVE"
    });
  });

  it("rejects voucher outside validity window (expired)", async () => {
    const client = makeFakeClient();
    const v = makeVoucher({ ends_at: "2020-01-01T00:00:00Z" });
    await expect(validateAndCompute(client, v, { orderSubtotal: 100 })).rejects.toMatchObject({
      code: "VOUCHER_EXPIRED"
    });
  });

  it("rejects voucher not yet valid", async () => {
    const client = makeFakeClient();
    const v = makeVoucher({ starts_at: "3000-01-01T00:00:00Z" });
    await expect(validateAndCompute(client, v, { orderSubtotal: 100 })).rejects.toMatchObject({
      code: "VOUCHER_NOT_YET_VALID"
    });
  });

  it("rejects when max_uses exhausted", async () => {
    const client = makeFakeClient();
    const v = makeVoucher({ max_uses: 3, used_count: 3 });
    await expect(validateAndCompute(client, v, { orderSubtotal: 100 })).rejects.toMatchObject({
      code: "VOUCHER_EXHAUSTED"
    });
  });

  it("rejects when per-user limit reached", async () => {
    const client = makeFakeClient();
    const v = makeVoucher({ per_user_limit: 1 });
    client.state.redemptions.push({
      id: "r-1",
      voucher_id: v.id,
      order_id: "o-0",
      customer_id: "cust-1",
      discount_applied: 10
    });
    await expect(
      validateAndCompute(client, v, { orderSubtotal: 100, customerId: "cust-1" })
    ).rejects.toMatchObject({ code: "VOUCHER_PER_USER_LIMIT_REACHED" });
  });

  it("returns computed discount on valid voucher", async () => {
    const client = makeFakeClient();
    const v = makeVoucher({ discount_type: "fixed", discount_value: "25" });
    const result = await validateAndCompute(client, v, { orderSubtotal: 100 });
    expect(result).toBe(25);
  });
});

describe("redeemVoucher", () => {
  it("increments used_count atomically and records redemption", async () => {
    const client = makeFakeClient([{ code: "PROMO10" }]);
    const v = client.state.vouchers[0];
    const result = await redeemVoucher(client, {
      voucherId: v.id,
      orderId: "order-1",
      customerId: "cust-1",
      discountApplied: 25
    });
    expect(result.redemptionId).toBeTruthy();
    expect(client.state.vouchers[0].used_count).toBe(1);
    expect(client.state.redemptions).toHaveLength(1);
  });

  it("rejects redemption when atomic guard fails (exhausted)", async () => {
    const client = makeFakeClient([{ code: "PROMO10", max_uses: 1, used_count: 1 }]);
    const v = client.state.vouchers[0];
    await expect(
      redeemVoucher(client, {
        voucherId: v.id,
        orderId: "order-1",
        discountApplied: 10
      })
    ).rejects.toMatchObject({ code: "VOUCHER_REDEEM_RACE" });
  });

  it("serializes concurrent redeems via atomic update", async () => {
    // Simulate 5 concurrent redeems on a max_uses=2 voucher. Only 2 should
    // succeed; the other 3 must get VOUCHER_REDEEM_RACE. Without the atomic
    // guard (WHERE used_count < max_uses) we'd see all 5 go through.
    const client = makeFakeClient([{ code: "LIMITED", max_uses: 2 }]);
    const v = client.state.vouchers[0];
    const results = await Promise.allSettled(
      Array.from({ length: 5 }, (_, i) =>
        redeemVoucher(client, {
          voucherId: v.id,
          orderId: `order-${i}`,
          discountApplied: 10
        })
      )
    );
    const fulfilled = results.filter((r) => r.status === "fulfilled").length;
    const rejected = results.filter((r) => r.status === "rejected").length;
    expect(fulfilled).toBe(2);
    expect(rejected).toBe(3);
    expect(client.state.vouchers[0].used_count).toBe(2);
  });
});
