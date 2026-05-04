import { createHash, randomUUID } from "crypto";
import { AppError } from "../../common/errors/app-error";

type QueryClient = {
  query: <Row = any>(sql: string, params?: any[]) => Promise<{ rows: Row[]; rowCount: number }>;
};

export type MidtransNotification = {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
  transaction_id: string;
  transaction_status: string;
  fraud_status?: string;
  payment_type?: string;
  transaction_time?: string;
  settlement_time?: string;
};

/**
 * Map Midtrans `transaction_status` (+ `fraud_status` for credit cards) to
 * our internal `payments.status` taxonomy. We model only three terminal
 * states the rest of the system reasons about: succeeded, pending, failed.
 */
export function mapMidtransStatus(
  transactionStatus: string,
  fraudStatus?: string
): "succeeded" | "pending" | "failed" {
  if (transactionStatus === "capture") {
    // Card auth captured — fraud check decides whether we trust the funds.
    return fraudStatus === "accept" ? "succeeded" : "pending";
  }
  if (transactionStatus === "settlement") return "succeeded";
  if (transactionStatus === "pending") return "pending";
  if (
    transactionStatus === "deny" ||
    transactionStatus === "cancel" ||
    transactionStatus === "expire" ||
    transactionStatus === "failure" ||
    transactionStatus === "refund" ||
    transactionStatus === "partial_refund"
  ) {
    return "failed";
  }
  // Unknown status — treat as pending so we don't accidentally release
  // goods on a malformed/future Midtrans status code.
  return "pending";
}

/**
 * Verify Midtrans webhook signature. Midtrans signs notifications with
 * SHA512(order_id + status_code + gross_amount + serverKey). We compare in
 * a length-agnostic constant-time manner to dodge timing oracles even
 * though the signature is just a hex string.
 */
export function verifyMidtransSignature(
  payload: Pick<MidtransNotification, "order_id" | "status_code" | "gross_amount" | "signature_key">,
  serverKey: string
): boolean {
  if (!serverKey) return false;
  if (!payload.signature_key) return false;
  const expected = createHash("sha512")
    .update(`${payload.order_id}${payload.status_code}${payload.gross_amount}${serverKey}`)
    .digest("hex");
  return constantTimeEqual(expected, payload.signature_key);
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Process a verified Midtrans notification idempotently:
 *   1. Look up the order by order_number (Midtrans `order_id` matches our
 *      human-readable order number we send when creating the Snap txn).
 *   2. Try to insert a payment row keyed by (gateway, transaction_id) — if
 *      a duplicate webhook arrives, the unique index makes this a no-op.
 *   3. When the new status is "succeeded", recompute the order's paid total
 *      and flip `payment_status` to "paid"/"partial"/"unpaid" accordingly.
 *
 * Caller must supply a transactional client so the lookup + insert + order
 * update commit atomically.
 */
export async function processMidtransNotification(
  client: QueryClient,
  notification: MidtransNotification
): Promise<{
  paymentId: string;
  status: "succeeded" | "pending" | "failed";
  duplicated: boolean;
  orderId: string;
}> {
  const orderRes = await client.query<{ id: string; total_amount: string }>(
    "SELECT id, total_amount FROM orders WHERE order_number = $1 FOR UPDATE",
    [notification.order_id]
  );
  if (!orderRes.rowCount) {
    throw new AppError(404, "ORDER_NOT_FOUND", `Order ${notification.order_id} tidak ditemukan`);
  }
  const order = orderRes.rows[0];
  const status = mapMidtransStatus(notification.transaction_status, notification.fraud_status);
  const amount = Number(notification.gross_amount);
  const paidAt = status === "succeeded"
    ? notification.settlement_time ?? notification.transaction_time ?? null
    : null;

  // Idempotent claim — duplicate webhook deliveries hit the unique index
  // and INSERT returns 0 rows; we then fetch the existing payment and
  // report `duplicated: true`.
  const paymentId = randomUUID();
  const insertRes = await client.query<{ id: string }>(
    `INSERT INTO payments (id, order_id, amount, method, status, paid_at,
                           gateway, external_ref, raw_payload)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (gateway, external_ref) WHERE gateway IS NOT NULL AND external_ref IS NOT NULL
       DO NOTHING
     RETURNING id`,
    [
      paymentId,
      order.id,
      amount,
      notification.payment_type ?? "midtrans",
      status,
      paidAt,
      "midtrans",
      notification.transaction_id,
      JSON.stringify(notification)
    ]
  );

  let resolvedPaymentId: string = paymentId;
  let duplicated = false;
  if (insertRes.rowCount === 0) {
    duplicated = true;
    const existing = await client.query<{ id: string; status: string }>(
      "SELECT id, status FROM payments WHERE gateway = $1 AND external_ref = $2",
      ["midtrans", notification.transaction_id]
    );
    if (existing.rowCount) {
      resolvedPaymentId = existing.rows[0].id;
      // Status may transition pending → succeeded on a subsequent webhook
      // for the same transaction id (e.g., bank transfer settled). Update
      // in place so order.payment_status recompute below sees the latest
      // amount.
      if (existing.rows[0].status !== status) {
        await client.query(
          `UPDATE payments
              SET status = $1, paid_at = COALESCE($2, paid_at),
                  raw_payload = $3
            WHERE id = $4`,
          [status, paidAt, JSON.stringify(notification), resolvedPaymentId]
        );
      }
    }
  }

  // Recompute order payment_status from the current set of succeeded
  // payments. Done as a single SQL summarization so concurrent partial
  // payments don't drift.
  const sumRes = await client.query<{ total_paid: string | number | null }>(
    `SELECT COALESCE(SUM(amount), 0) AS total_paid FROM payments
       WHERE order_id = $1 AND status = 'succeeded'`,
    [order.id]
  );
  const totalPaid = Number(sumRes.rows[0]?.total_paid ?? 0);
  const totalAmount = Number(order.total_amount);
  let paymentStatus: "paid" | "partial" | "unpaid";
  if (totalPaid >= totalAmount && totalAmount > 0) paymentStatus = "paid";
  else if (totalPaid > 0) paymentStatus = "partial";
  else paymentStatus = "unpaid";
  await client.query(
    "UPDATE orders SET payment_status = $1 WHERE id = $2",
    [paymentStatus, order.id]
  );

  return { paymentId: resolvedPaymentId, status, duplicated, orderId: order.id };
}
