import { describe, expect, it } from "vitest";
import {
  recordPayment,
  splitOrderBill
} from "../modules/orders/payments.service";

/**
 * Lightweight in-memory fake mimicking just the subset of SQL our split-bill
 * and multi-tender payment service uses. Keeps the test hermetic.
 */
function makeFakeClient(orderTotal: number) {
  const state = {
    orderTotal,
    paymentStatus: "pending" as "pending" | "dp" | "paid",
    splits: [] as Array<{
      id: string;
      order_id: string;
      customer_id: string | null;
      label: string | null;
      amount_due: number;
      amount_paid: number;
      status: "pending" | "partial" | "paid" | "void";
    }>,
    payments: [] as Array<{
      id: string;
      order_id: string;
      split_id: string | null;
      amount: number;
      method: string;
      status: string;
    }>
  };

  return {
    state,
    async query<Row = any>(sql: string, params: any[] = []): Promise<{ rows: Row[]; rowCount: number }> {
      const t = sql.trim();

      if (/^SELECT total_amount FROM orders/i.test(t)) {
        return {
          rows: [{ total_amount: String(state.orderTotal) } as unknown as Row],
          rowCount: 1
        };
      }
      if (/^SELECT total_amount, payment_status FROM orders/i.test(t)) {
        return {
          rows: [
            { total_amount: String(state.orderTotal), payment_status: state.paymentStatus } as unknown as Row
          ],
          rowCount: 1
        };
      }
      if (/^SELECT COUNT\(\*\) AS count FROM order_splits/i.test(t)) {
        return {
          rows: [{ count: state.splits.length } as unknown as Row],
          rowCount: 1
        };
      }
      if (/^INSERT INTO order_splits/i.test(t)) {
        const [id, orderId, customerId, label, amountDue] = params;
        state.splits.push({
          id,
          order_id: orderId,
          customer_id: customerId,
          label,
          amount_due: Number(amountDue),
          amount_paid: 0,
          status: "pending"
        });
        return { rows: [], rowCount: 1 };
      }
      if (/^SELECT amount_due, amount_paid FROM order_splits/i.test(t)) {
        const [splitId] = params;
        const s = state.splits.find((x) => x.id === splitId);
        if (!s) return { rows: [], rowCount: 0 };
        return {
          rows: [
            {
              amount_due: String(s.amount_due),
              amount_paid: String(s.amount_paid)
            } as unknown as Row
          ],
          rowCount: 1
        };
      }
      if (/^INSERT INTO payments/i.test(t)) {
        const [id, orderId, splitId, amount, method] = params;
        state.payments.push({
          id,
          order_id: orderId,
          split_id: splitId,
          amount: Number(amount),
          method,
          status: "succeeded"
        });
        return { rows: [], rowCount: 1 };
      }
      if (/^UPDATE order_splits\s+SET amount_paid = amount_paid/i.test(t)) {
        const [amount, splitId] = params;
        const s = state.splits.find((x) => x.id === splitId);
        if (!s) return { rows: [], rowCount: 0 };
        s.amount_paid += Number(amount);
        if (s.amount_paid >= s.amount_due) s.status = "paid";
        else if (s.amount_paid > 0) s.status = "partial";
        return { rows: [], rowCount: 1 };
      }
      if (/^SELECT COALESCE\(SUM\(amount\), 0\) AS paid_sum/i.test(t)) {
        const [orderId] = params;
        const sum = state.payments
          .filter((p) => p.order_id === orderId && p.status === "succeeded")
          .reduce((s, p) => s + p.amount, 0);
        return { rows: [{ paid_sum: sum } as unknown as Row], rowCount: 1 };
      }
      if (/^UPDATE orders SET payment_status/i.test(t)) {
        const [status] = params;
        state.paymentStatus = status;
        return { rows: [], rowCount: 1 };
      }
      throw new Error(`unmocked SQL in split test: ${t.slice(0, 80)}`);
    }
  };
}

describe("split bill", () => {
  it("rejects splits that don't sum to order total", async () => {
    const client = makeFakeClient(100);
    await expect(
      splitOrderBill(client, "order-1", [
        { amount: 40, label: "A" },
        { amount: 30, label: "B" }
      ])
    ).rejects.toMatchObject({ code: "SPLIT_TOTAL_MISMATCH" });
  });

  it("creates N splits totaling exactly order total", async () => {
    const client = makeFakeClient(150);
    const result = await splitOrderBill(client, "order-1", [
      { amount: 50, label: "Budi" },
      { amount: 60, label: "Citra" },
      { amount: 40, label: "Dedi" }
    ]);
    expect(result.splits).toHaveLength(3);
    expect(client.state.splits.map((s) => s.amount_due)).toEqual([50, 60, 40]);
  });

  it("rejects double-split on same order", async () => {
    const client = makeFakeClient(100);
    await splitOrderBill(client, "order-1", [
      { amount: 60 },
      { amount: 40 }
    ]);
    await expect(
      splitOrderBill(client, "order-1", [{ amount: 50 }, { amount: 50 }])
    ).rejects.toMatchObject({ code: "ALREADY_SPLIT" });
  });
});

describe("multi-tender payment", () => {
  it("accepts partial payments and flips status pending → dp → paid", async () => {
    const client = makeFakeClient(100);

    const first = await recordPayment(client, {
      orderId: "order-1",
      amount: 30,
      method: "qris"
    });
    expect(first.paymentStatus).toBe("dp");

    const second = await recordPayment(client, {
      orderId: "order-1",
      amount: 70,
      method: "cash"
    });
    expect(second.paymentStatus).toBe("paid");
    expect(client.state.payments).toHaveLength(2);
    expect(client.state.payments.map((p) => p.method)).toEqual(["qris", "cash"]);
  });

  it("rejects unknown payment method", async () => {
    const client = makeFakeClient(100);
    await expect(
      recordPayment(client, {
        orderId: "order-1",
        amount: 50,
        method: "bitcoin" as any
      })
    ).rejects.toMatchObject({ code: "INVALID_METHOD" });
  });

  it("prevents overpay on a split", async () => {
    const client = makeFakeClient(200);
    await splitOrderBill(client, "order-1", [
      { amount: 100, label: "A" },
      { amount: 100, label: "B" }
    ]);
    const splitA = client.state.splits[0].id;

    await recordPayment(client, {
      orderId: "order-1",
      amount: 80,
      method: "cash",
      splitId: splitA
    });
    await expect(
      recordPayment(client, {
        orderId: "order-1",
        amount: 50,
        method: "qris",
        splitId: splitA
      })
    ).rejects.toMatchObject({ code: "OVERPAY_SPLIT" });
  });

  it("marks split 'paid' when its amount_due reached via multiple tenders", async () => {
    const client = makeFakeClient(200);
    await splitOrderBill(client, "order-1", [
      { amount: 100, label: "A" },
      { amount: 100, label: "B" }
    ]);
    const splitA = client.state.splits[0].id;

    await recordPayment(client, { orderId: "order-1", amount: 40, method: "cash", splitId: splitA });
    await recordPayment(client, { orderId: "order-1", amount: 60, method: "qris", splitId: splitA });

    expect(client.state.splits[0].status).toBe("paid");
    expect(client.state.splits[1].status).toBe("pending");
  });
});
