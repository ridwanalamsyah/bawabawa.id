import { describe, expect, it } from "vitest";
import {
  computeDokuDigest,
  computeDokuSignature,
  mapDokuStatus,
  processDokuNotification,
  verifyDokuSignature,
  type DokuNotification
} from "../modules/payments/doku.service";

const SECRET_KEY = "doku-sandbox-secret-key-1234567890abcdef";
const CLIENT_ID = "BRN-0000-TEST123456";
const REQUEST_TARGET = "/api/v1/webhooks/doku";

type SignedDelivery = {
  rawBody: string;
  headers: {
    clientId: string;
    requestId: string;
    requestTimestamp: string;
    requestTarget: string;
    signature: string;
    digest: string;
  };
  notification: DokuNotification;
};

function makeNotification(over: Partial<DokuNotification> = {}): DokuNotification {
  const base: DokuNotification = {
    order: {
      invoice_number: "INV-001",
      amount: "111000.00",
      currency: "IDR",
      ...(over.order ?? {})
    },
    transaction: {
      status: "SUCCESS",
      date: "20260518100000",
      original_request_id: "doku-txn-1",
      ...(over.transaction ?? {})
    },
    channel: { id: "VIRTUAL_ACCOUNT_BANK_BCA", ...(over.channel ?? {}) },
    acquirer: { id: "BCA", ...(over.acquirer ?? {}) }
  };
  return base;
}

function signDelivery(
  notification: DokuNotification,
  override: Partial<SignedDelivery["headers"]> = {}
): SignedDelivery {
  const rawBody = JSON.stringify(notification);
  const digest = computeDokuDigest(rawBody);
  const requestId = override.requestId ?? "req-test-1";
  const requestTimestamp = override.requestTimestamp ?? "2026-05-18T03:00:00Z";
  const signature = computeDokuSignature({
    clientId: override.clientId ?? CLIENT_ID,
    requestId,
    requestTimestamp,
    requestTarget: override.requestTarget ?? REQUEST_TARGET,
    digest,
    secretKey: SECRET_KEY
  });
  return {
    rawBody,
    notification,
    headers: {
      clientId: override.clientId ?? CLIENT_ID,
      requestId,
      requestTimestamp,
      requestTarget: override.requestTarget ?? REQUEST_TARGET,
      signature: override.signature ?? signature,
      digest: override.digest ?? digest
    }
  };
}

describe("mapDokuStatus", () => {
  it.each(["SUCCESS", "SETTLED", "PAID", "COMPLETED", "success", "settled"])(
    "%s → succeeded",
    (s) => {
      expect(mapDokuStatus(s)).toBe("succeeded");
    }
  );

  it.each(["PENDING", "IN_PROCESS", "PROCESSING"])("%s → pending", (s) => {
    expect(mapDokuStatus(s)).toBe("pending");
  });

  it.each(["FAILED", "EXPIRED", "CANCELLED", "CANCELED", "VOID", "REFUNDED", "DECLINED"])(
    "%s → failed",
    (s) => {
      expect(mapDokuStatus(s)).toBe("failed");
    }
  );

  it("unknown status defaults to pending (safe)", () => {
    expect(mapDokuStatus("AUTHORIZE")).toBe("pending");
  });

  it("treats null/undefined/empty status as pending", () => {
    expect(mapDokuStatus(null)).toBe("pending");
    expect(mapDokuStatus(undefined)).toBe("pending");
    expect(mapDokuStatus("")).toBe("pending");
  });
});

describe("verifyDokuSignature", () => {
  it("accepts a correctly signed delivery", () => {
    const delivery = signDelivery(makeNotification());
    expect(verifyDokuSignature({ ...delivery, secretKey: SECRET_KEY })).toBe(true);
  });

  it("accepts signature with HMACSHA256= and digest with SHA-256= prefixes", () => {
    const delivery = signDelivery(makeNotification());
    delivery.headers.signature = `HMACSHA256=${delivery.headers.signature}`;
    delivery.headers.digest = `SHA-256=${delivery.headers.digest}`;
    expect(verifyDokuSignature({ ...delivery, secretKey: SECRET_KEY })).toBe(true);
  });

  it("rejects tampered body (digest mismatch)", () => {
    const delivery = signDelivery(makeNotification());
    // Mutate the body after signing — digest must no longer match.
    delivery.rawBody = delivery.rawBody.replace("111000.00", "1.00");
    expect(verifyDokuSignature({ ...delivery, secretKey: SECRET_KEY })).toBe(false);
  });

  it("rejects forged signature (body untouched, signature swapped)", () => {
    const delivery = signDelivery(makeNotification());
    delivery.headers.signature = "0000000000000000000000000000000000000000000=";
    expect(verifyDokuSignature({ ...delivery, secretKey: SECRET_KEY })).toBe(false);
  });

  it("rejects with wrong secret key", () => {
    const delivery = signDelivery(makeNotification());
    expect(verifyDokuSignature({ ...delivery, secretKey: "wrong-secret-1234567890" })).toBe(false);
  });

  it("rejects when secret key is empty", () => {
    const delivery = signDelivery(makeNotification());
    expect(verifyDokuSignature({ ...delivery, secretKey: "" })).toBe(false);
  });

  it("rejects when any required header is missing", () => {
    const delivery = signDelivery(makeNotification());
    const cases: Array<keyof typeof delivery.headers> = [
      "clientId",
      "requestId",
      "requestTimestamp",
      "signature",
      "digest"
    ];
    for (const field of cases) {
      const tampered = { ...delivery, headers: { ...delivery.headers, [field]: "" } };
      expect(verifyDokuSignature({ ...tampered, secretKey: SECRET_KEY })).toBe(false);
    }
  });

  it("rejects signature signed for a different Request-Target", () => {
    const delivery = signDelivery(makeNotification(), { requestTarget: "/other/path" });
    // Now pretend the request actually hit /api/v1/webhooks/doku.
    delivery.headers.requestTarget = REQUEST_TARGET;
    expect(verifyDokuSignature({ ...delivery, secretKey: SECRET_KEY })).toBe(false);
  });
});

describe("processDokuNotification", () => {
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
    const result = await processDokuNotification(
      client,
      makeNotification({
        order: { invoice_number: "INV-001", amount: "111000.00" }
      })
    );
    if (result.ignored) throw new Error("unexpected ignored");
    expect(result.status).toBe("succeeded");
    expect(result.duplicated).toBe(false);
    expect(client.state.payments).toHaveLength(1);
    expect(client.state.payments[0].gateway).toBe("doku");
    expect(client.state.order.payment_status).toBe("paid");
  });

  it("marks order 'dp' (partial) when paid amount is less than total", async () => {
    const client = makeFakeClient({ order: { id: "o-1", total_amount: 111000 } });
    await processDokuNotification(
      client,
      makeNotification({ order: { invoice_number: "INV-001", amount: "50000.00" } })
    );
    expect(client.state.order.payment_status).toBe("dp");
  });

  it("keeps order 'pending' when notification status is PENDING", async () => {
    const client = makeFakeClient({ order: { id: "o-1", total_amount: 111000 } });
    const result = await processDokuNotification(
      client,
      makeNotification({ transaction: { status: "PENDING" } })
    );
    if (result.ignored) throw new Error("unexpected ignored");
    expect(result.status).toBe("pending");
    expect(client.state.order.payment_status).toBe("pending");
  });

  it("idempotent: duplicate original_request_id does not double-record", async () => {
    const client = makeFakeClient({ order: { id: "o-1", total_amount: 111000 } });
    await processDokuNotification(
      client,
      makeNotification({ transaction: { status: "SUCCESS", original_request_id: "txn-dup" } })
    );
    const second = await processDokuNotification(
      client,
      makeNotification({ transaction: { status: "SUCCESS", original_request_id: "txn-dup" } })
    );
    if (second.ignored) throw new Error("unexpected ignored");
    expect(second.duplicated).toBe(true);
    expect(client.state.payments).toHaveLength(1);
    expect(client.state.order.payment_status).toBe("paid");
  });

  it("transitions existing PENDING payment to SUCCESS on later notification", async () => {
    const client = makeFakeClient({ order: { id: "o-1", total_amount: 111000 } });
    await processDokuNotification(
      client,
      makeNotification({ transaction: { status: "PENDING", original_request_id: "txn-bt" } })
    );
    expect(client.state.order.payment_status).toBe("pending");
    const second = await processDokuNotification(
      client,
      makeNotification({ transaction: { status: "SUCCESS", original_request_id: "txn-bt" } })
    );
    if (second.ignored) throw new Error("unexpected ignored");
    expect(second.duplicated).toBe(true);
    expect(second.status).toBe("succeeded");
    expect(client.state.order.payment_status).toBe("paid");
  });

  it("does NOT regress SUCCESS → PENDING on out-of-order webhook delivery", async () => {
    const client = makeFakeClient({ order: { id: "o-1", total_amount: 111000 } });
    await processDokuNotification(
      client,
      makeNotification({ transaction: { status: "SUCCESS", original_request_id: "txn-x" } })
    );
    expect(client.state.order.payment_status).toBe("paid");
    const second = await processDokuNotification(
      client,
      makeNotification({ transaction: { status: "PENDING", original_request_id: "txn-x" } })
    );
    if (second.ignored) throw new Error("unexpected ignored");
    expect(second.duplicated).toBe(true);
    expect(client.state.payments[0].status).toBe("succeeded");
    expect(client.state.order.payment_status).toBe("paid");
  });

  it("uses 0.01 paid threshold (matches manual recordPayment) for sub-sen gaps", async () => {
    const client = makeFakeClient({ order: { id: "o-1", total_amount: 100000 } });
    const result = await processDokuNotification(
      client,
      makeNotification({ order: { invoice_number: "INV-001", amount: "99999.99" } })
    );
    if (result.ignored) throw new Error("unexpected ignored");
    expect(result.status).toBe("succeeded");
    expect(client.state.order.payment_status).toBe("paid");
  });

  it("falls back to deterministic external_ref when original_request_id missing", async () => {
    // Two deliveries with no `original_request_id` for the same invoice/status
    // must still collapse into a single payment row via the composite ref.
    const client = makeFakeClient({ order: { id: "o-1", total_amount: 111000 } });
    const first = await processDokuNotification(
      client,
      makeNotification({
        transaction: { status: "SUCCESS", date: "20260518100000", original_request_id: undefined }
      })
    );
    const second = await processDokuNotification(
      client,
      makeNotification({
        transaction: { status: "SUCCESS", date: "20260518100000", original_request_id: undefined }
      })
    );
    if (first.ignored || second.ignored) throw new Error("unexpected ignored");
    expect(second.duplicated).toBe(true);
    expect(client.state.payments).toHaveLength(1);
  });

  it("returns ignored result for unknown invoice (no-op so DOKU stops retrying)", async () => {
    const client = {
      async query() {
        return { rows: [], rowCount: 0 };
      }
    };
    const result = await processDokuNotification(
      client,
      makeNotification({ order: { invoice_number: "MISSING", amount: "1.00" } })
    );
    expect(result).toEqual({ ignored: true, reason: "ORDER_NOT_FOUND", orderRef: "MISSING" });
  });
});
