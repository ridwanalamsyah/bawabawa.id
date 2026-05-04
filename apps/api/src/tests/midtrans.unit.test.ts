import { createHash } from "crypto";
import { describe, expect, it } from "vitest";
import {
  mapMidtransStatus,
  processMidtransNotification,
  verifyMidtransSignature,
  type MidtransNotification
} from "../modules/payments/midtrans.service";

const SERVER_KEY = "SB-Mid-server-test1234567890ABCDEFGHIJ";

function signedNotification(over: Partial<MidtransNotification> = {}): MidtransNotification {
  const base: MidtransNotification = {
    order_id: "INV-001",
    status_code: "200",
    gross_amount: "111000.00",
    transaction_id: "txn-1",
    transaction_status: "settlement",
    signature_key: "",
    ...over
  };
  base.signature_key = createHash("sha512")
    .update(`${base.order_id}${base.status_code}${base.gross_amount}${SERVER_KEY}`)
    .digest("hex");
  return base;
}

describe("mapMidtransStatus", () => {
  it("settlement → succeeded", () => {
    expect(mapMidtransStatus("settlement")).toBe("succeeded");
  });

  it("capture + accept fraud → succeeded", () => {
    expect(mapMidtransStatus("capture", "accept")).toBe("succeeded");
  });

  it("capture + challenge fraud → pending (manual review)", () => {
    expect(mapMidtransStatus("capture", "challenge")).toBe("pending");
  });

  it("pending → pending", () => {
    expect(mapMidtransStatus("pending")).toBe("pending");
  });

  it.each(["deny", "cancel", "expire", "failure", "refund", "partial_refund"])(
    "%s → failed",
    (s) => {
      expect(mapMidtransStatus(s)).toBe("failed");
    }
  );

  it("unknown status defaults to pending (safe)", () => {
    expect(mapMidtransStatus("authorize")).toBe("pending");
  });
});

describe("verifyMidtransSignature", () => {
  it("accepts valid signature", () => {
    const n = signedNotification();
    expect(verifyMidtransSignature(n, SERVER_KEY)).toBe(true);
  });

  it("rejects tampered amount", () => {
    const n = signedNotification();
    n.gross_amount = "1.00";
    expect(verifyMidtransSignature(n, SERVER_KEY)).toBe(false);
  });

  it("rejects with wrong server key", () => {
    const n = signedNotification();
    expect(verifyMidtransSignature(n, "Mid-server-other-XYZXYZXYZ")).toBe(false);
  });

  it("rejects empty signature", () => {
    const n = signedNotification();
    n.signature_key = "";
    expect(verifyMidtransSignature(n, SERVER_KEY)).toBe(false);
  });

  it("rejects empty server key", () => {
    const n = signedNotification();
    expect(verifyMidtransSignature(n, "")).toBe(false);
  });
});

describe("processMidtransNotification", () => {
  function makeFakeClient(initial: {
    order: { id: string; total_amount: number; payment_status?: string };
  }) {
    const state = {
      order: { ...initial.order, payment_status: initial.order.payment_status ?? "unpaid" },
      payments: [] as Array<{
        id: string;
        order_id: string;
        amount: number;
        status: string;
        gateway: string | null;
        external_ref: string | null;
      }>
    };
    return {
      state,
      async query<Row = any>(
        sql: string,
        params: any[] = []
      ): Promise<{ rows: Row[]; rowCount: number }> {
        const t = sql.trim();
        if (/^SELECT id, total_amount FROM orders/i.test(t)) {
          return state.order
            ? {
                rows: [
                  {
                    id: state.order.id,
                    total_amount: String(state.order.total_amount)
                  } as unknown as Row
                ],
                rowCount: 1
              }
            : { rows: [], rowCount: 0 };
        }
        if (/^INSERT INTO payments/i.test(t)) {
          const [id, orderId, amount, , status, , gateway, externalRef] = params;
          // Idempotency: enforce unique (gateway, external_ref).
          const dup = state.payments.find(
            (p) => p.gateway === gateway && p.external_ref === externalRef
          );
          if (dup) return { rows: [], rowCount: 0 };
          state.payments.push({
            id,
            order_id: orderId,
            amount: Number(amount),
            status,
            gateway,
            external_ref: externalRef
          });
          return { rows: [], rowCount: 1 };
        }
        if (/^SELECT id, status FROM payments/i.test(t)) {
          const [gateway, externalRef] = params;
          const found = state.payments.find(
            (p) => p.gateway === gateway && p.external_ref === externalRef
          );
          return found
            ? { rows: [{ id: found.id, status: found.status } as unknown as Row], rowCount: 1 }
            : { rows: [], rowCount: 0 };
        }
        if (/^UPDATE payments\s+SET status/i.test(t)) {
          const [status, , , id] = params;
          const p = state.payments.find((x) => x.id === id);
          if (p) p.status = status;
          return { rows: [], rowCount: p ? 1 : 0 };
        }
        if (/^SELECT COALESCE\(SUM\(amount\)/i.test(t)) {
          const total = state.payments
            .filter((p) => p.order_id === params[0] && p.status === "succeeded")
            .reduce((sum, p) => sum + p.amount, 0);
          return { rows: [{ total_paid: String(total) } as unknown as Row], rowCount: 1 };
        }
        if (/^UPDATE orders SET payment_status/i.test(t)) {
          const [status] = params;
          state.order.payment_status = status;
          return { rows: [], rowCount: 1 };
        }
        throw new Error(`unmocked SQL: ${t.slice(0, 80)}`);
      }
    };
  }

  it("records succeeded payment and marks order paid when total covered", async () => {
    const client = makeFakeClient({ order: { id: "o-1", total_amount: 111000 } });
    const result = await processMidtransNotification(
      client,
      signedNotification({ order_id: "INV-001", gross_amount: "111000.00" })
    );
    if (result.ignored) throw new Error("unexpected ignored");
    expect(result.status).toBe("succeeded");
    expect(result.duplicated).toBe(false);
    expect(client.state.payments).toHaveLength(1);
    expect(client.state.order.payment_status).toBe("paid");
  });

  it("marks order 'dp' (partial) when paid amount is less than total", async () => {
    // Uses the existing payment_status taxonomy `pending`/`dp`/`paid` so
    // dashboards and recordPayment downstream stay consistent.
    const client = makeFakeClient({ order: { id: "o-1", total_amount: 111000 } });
    await processMidtransNotification(
      client,
      signedNotification({ gross_amount: "50000.00" })
    );
    expect(client.state.order.payment_status).toBe("dp");
  });

  it("keeps order 'pending' when notification status is pending", async () => {
    const client = makeFakeClient({ order: { id: "o-1", total_amount: 111000 } });
    const result = await processMidtransNotification(
      client,
      signedNotification({ transaction_status: "pending" })
    );
    if (result.ignored) throw new Error("unexpected ignored");
    expect(result.status).toBe("pending");
    expect(client.state.order.payment_status).toBe("pending");
  });

  it("idempotent: duplicate transaction_id does not double-record", async () => {
    const client = makeFakeClient({ order: { id: "o-1", total_amount: 111000 } });
    await processMidtransNotification(client, signedNotification({ transaction_id: "txn-dup" }));
    const second = await processMidtransNotification(
      client,
      signedNotification({ transaction_id: "txn-dup" })
    );
    if (second.ignored) throw new Error("unexpected ignored");
    expect(second.duplicated).toBe(true);
    expect(client.state.payments).toHaveLength(1);
    expect(client.state.order.payment_status).toBe("paid");
  });

  it("transitions existing pending payment to succeeded on later notification", async () => {
    const client = makeFakeClient({ order: { id: "o-1", total_amount: 111000 } });
    // First notification: pending (e.g. bank transfer not yet settled)
    await processMidtransNotification(
      client,
      signedNotification({ transaction_id: "txn-bt", transaction_status: "pending" })
    );
    expect(client.state.order.payment_status).toBe("pending");
    // Same transaction_id later settles
    const second = await processMidtransNotification(
      client,
      signedNotification({ transaction_id: "txn-bt", transaction_status: "settlement" })
    );
    if (second.ignored) throw new Error("unexpected ignored");
    expect(second.duplicated).toBe(true);
    expect(second.status).toBe("succeeded");
    expect(client.state.order.payment_status).toBe("paid");
  });

  it("returns ignored result for unknown order (no-op so Midtrans stops retrying)", async () => {
    const client = {
      async query() {
        return { rows: [], rowCount: 0 };
      }
    };
    const result = await processMidtransNotification(
      client,
      signedNotification({ order_id: "MISSING" })
    );
    expect(result).toEqual({ ignored: true, reason: "ORDER_NOT_FOUND", orderRef: "MISSING" });
  });
});
