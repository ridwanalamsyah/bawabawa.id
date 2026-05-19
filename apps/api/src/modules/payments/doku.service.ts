import { createHash, createHmac, randomUUID } from "crypto";

type QueryClient = {
  query: <Row = any>(sql: string, params?: any[]) => Promise<{ rows: Row[]; rowCount: number }>;
};

/**
 * DOKU notification body (Direct/Snap "Payment Notification" callback).
 *
 * DOKU groups the payload into `order`, `transaction`, `channel`, `acquirer`
 * sub-objects rather than the flat shape Midtrans uses. Fields that are
 * actually emitted vary by channel (e-money, VA, QRIS, credit card, etc.)
 * so most are marked optional — we only consume the canonical handful the
 * webhook always carries.
 *
 * Reference: https://dokuapi.notion.site/Payment-Notification-Webhook
 */
export type DokuNotification = {
  order: {
    /** Our human-readable order number (matches `orders.order_number`). */
    invoice_number: string;
    /** DOKU sends amounts as strings or numbers depending on channel. */
    amount: string | number;
    currency?: string;
  };
  transaction: {
    /**
     * Canonical DOKU status. Common values: `SUCCESS`, `SETTLED`, `PAID`,
     * `PENDING`, `IN_PROCESS`, `FAILED`, `EXPIRED`, `CANCELLED`, `VOID`,
     * `REFUNDED`.
     */
    status: string;
    /** Optional settlement/processing timestamp (DOKU's `yyyyMMddHHmmss`). */
    date?: string;
    /** DOKU transaction id — stable per-attempt, used as our external_ref. */
    original_request_id?: string;
  };
  channel?: { id?: string };
  acquirer?: { id?: string };
};

/**
 * Map DOKU `transaction.status` to our internal `payments.status` taxonomy
 * (`succeeded` / `pending` / `failed`). Unknown statuses fall through to
 * `pending` so a malformed/future DOKU code can never silently release an
 * order.
 */
export function mapDokuStatus(status: string | undefined | null): "succeeded" | "pending" | "failed" {
  const s = (status ?? "").trim().toUpperCase();
  if (s === "SUCCESS" || s === "SETTLED" || s === "PAID" || s === "COMPLETED") {
    return "succeeded";
  }
  if (s === "PENDING" || s === "IN_PROCESS" || s === "PROCESSING") {
    return "pending";
  }
  if (
    s === "FAILED" ||
    s === "FAILURE" ||
    s === "EXPIRED" ||
    s === "EXPIRE" ||
    s === "CANCELLED" ||
    s === "CANCELED" ||
    s === "VOID" ||
    s === "VOIDED" ||
    s === "REFUNDED" ||
    s === "REFUND" ||
    s === "DECLINED"
  ) {
    return "failed";
  }
  return "pending";
}

/**
 * DOKU verifies webhook authenticity through HTTP headers rather than a
 * `signature_key` field in the body (the Midtrans style). The receiver
 * must:
 *   1. Recompute `Digest = SHA-256(rawBody)` (base64) and ensure it equals
 *      the `Digest` header value — this binds the signature to the exact
 *      bytes we received.
 *   2. Recompute `Signature = HMAC-SHA256(componentString, secretKey)`
 *      (base64) where the component string is the canonical 5-line block
 *      of `Client-Id`, `Request-Id`, `Request-Timestamp`, `Request-Target`,
 *      `Digest` joined with `\n` — this binds the signature to who we are
 *      and which endpoint was hit.
 *
 * Reference: https://dokuapi.notion.site/Generate-Signature
 */
export type DokuSignatureHeaders = {
  clientId: string;
  requestId: string;
  requestTimestamp: string;
  requestTarget: string;
  /** `Signature` header value, may carry the `HMACSHA256=` prefix DOKU emits. */
  signature: string;
  /** `Digest` header value, may carry the `SHA-256=` prefix DOKU emits. */
  digest: string;
};

export function computeDokuDigest(rawBody: string): string {
  return createHash("sha256").update(rawBody, "utf8").digest("base64");
}

export function computeDokuSignature(params: {
  clientId: string;
  requestId: string;
  requestTimestamp: string;
  requestTarget: string;
  digest: string;
  secretKey: string;
}): string {
  // DOKU's canonical "signature component" is a deterministic 5-line block.
  // The header names use exactly this casing — do not reformat.
  const component = [
    `Client-Id:${params.clientId}`,
    `Request-Id:${params.requestId}`,
    `Request-Timestamp:${params.requestTimestamp}`,
    `Request-Target:${params.requestTarget}`,
    `Digest:${params.digest}`
  ].join("\n");
  return createHmac("sha256", params.secretKey).update(component, "utf8").digest("base64");
}

/**
 * Verify a DOKU webhook delivery. Returns false on any malformed input
 * (missing header, secret, body) so the route layer can answer 401 without
 * branching on which check failed.
 */
export function verifyDokuSignature(args: {
  rawBody: string;
  headers: DokuSignatureHeaders;
  secretKey: string;
}): boolean {
  const { rawBody, headers, secretKey } = args;
  if (!secretKey) return false;
  if (!headers.clientId || !headers.requestId || !headers.requestTimestamp) return false;
  if (!headers.signature || !headers.digest) return false;

  // Strip the optional algorithm prefixes DOKU's docs document but their
  // own sandbox sometimes omits.
  const providedDigest = headers.digest.replace(/^SHA-256=/i, "");
  const providedSignature = headers.signature.replace(/^HMACSHA256=/i, "");

  // (1) Body integrity — the digest header must match the SHA-256 of the
  // exact bytes we received (NOT the re-serialised JSON, which is why the
  // route layer captures `req.rawBody` via the verify hook).
  const expectedDigest = computeDokuDigest(rawBody);
  if (!constantTimeEqual(expectedDigest, providedDigest)) return false;

  // (2) Signature — proves the sender holds our secret key and that the
  // delivery was meant for this exact `Request-Target`.
  const expectedSignature = computeDokuSignature({
    clientId: headers.clientId,
    requestId: headers.requestId,
    requestTimestamp: headers.requestTimestamp,
    requestTarget: headers.requestTarget,
    digest: providedDigest,
    secretKey
  });
  return constantTimeEqual(expectedSignature, providedSignature);
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Resolve the gateway transaction id we store on `payments.external_ref`.
 * DOKU's `original_request_id` is the canonical per-attempt identifier;
 * we fall back to a deterministic composite when missing so duplicate
 * deliveries for the same `(invoice_number, date, status)` still collapse
 * into one row instead of creating an unbounded stream of payment rows.
 */
function resolveDokuExternalRef(notification: DokuNotification): string {
  if (notification.transaction.original_request_id) {
    return notification.transaction.original_request_id;
  }
  const date = notification.transaction.date ?? "";
  const status = notification.transaction.status ?? "";
  return `${notification.order.invoice_number}:${date}:${status}`;
}

/**
 * DOKU's `transaction.date` is `yyyyMMddHHmmss` (local Asia/Jakarta time).
 * Convert to an ISO timestamp so Postgres `paid_at` (TIMESTAMP WITH TIME
 * ZONE) stores it without ambiguity. Returns null when the input is
 * missing or malformed — callers must treat null as "no settlement time".
 */
function parseDokuDate(input: string | undefined | null): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  // Pattern: yyyyMMddHHmmss (14 chars) — what DOKU emits.
  const m = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/.exec(trimmed);
  if (m) {
    const [, y, mo, d, h, mi, s] = m;
    // DOKU's webhook clock is Asia/Jakarta (+07:00) — record the offset so
    // dashboards rendering `paid_at` in the user's TZ don't drift 7h.
    return `${y}-${mo}-${d}T${h}:${mi}:${s}+07:00`;
  }
  // Already-ISO strings pass through unchanged.
  if (!Number.isNaN(Date.parse(trimmed))) return trimmed;
  return null;
}

export type ProcessDokuResult =
  | {
      ignored: false;
      paymentId: string;
      status: "succeeded" | "pending" | "failed";
      duplicated: boolean;
      orderId: string;
    }
  | {
      ignored: true;
      reason: "ORDER_NOT_FOUND";
      orderRef: string;
    };

/**
 * Process a verified DOKU notification idempotently. Mirrors the Midtrans
 * processor:
 *   1. Look up the order by `order_number` (DOKU `order.invoice_number`).
 *   2. INSERT a payment row keyed by (gateway='doku', external_ref) — a
 *      duplicate webhook hits the unique index and we treat that as a
 *      no-op + UPDATE-if-status-rank-advanced (so a late `SETTLED` after
 *      `PENDING` does upgrade, but an out-of-order `PENDING` after
 *      `SETTLED` does NOT regress).
 *   3. Recompute the order's `payment_status` from the current set of
 *      succeeded payments — using the same 0.01 tolerance as the manual
 *      recordPayment path so mixed manual+DOKU payments don't end up
 *      classified inconsistently.
 *
 * Caller must supply a transactional client so the lookup + insert +
 * order update commit atomically.
 */
export async function processDokuNotification(
  client: QueryClient,
  notification: DokuNotification
): Promise<ProcessDokuResult> {
  const orderRes = await client.query<{ id: string; total_amount: string }>(
    "SELECT id, total_amount FROM orders WHERE order_number = $1 FOR UPDATE",
    [notification.order.invoice_number]
  );
  if (!orderRes.rowCount) {
    // No-op — answer 200 so DOKU stops retrying for unknown invoices.
    return {
      ignored: true,
      reason: "ORDER_NOT_FOUND",
      orderRef: notification.order.invoice_number
    };
  }
  const order = orderRes.rows[0];
  const status = mapDokuStatus(notification.transaction.status);
  const amount = Number(notification.order.amount);
  const externalRef = resolveDokuExternalRef(notification);
  const paidAt = status === "succeeded" ? parseDokuDate(notification.transaction.date) : null;
  const methodLabel = notification.channel?.id ?? "doku";

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
      methodLabel,
      status,
      paidAt,
      "doku",
      externalRef,
      JSON.stringify(notification)
    ]
  );

  let resolvedPaymentId: string = paymentId;
  let duplicated = false;
  if (insertRes.rowCount === 0) {
    duplicated = true;
    const existing = await client.query<{ id: string; status: string }>(
      "SELECT id, status FROM payments WHERE gateway = $1 AND external_ref = $2",
      ["doku", externalRef]
    );
    if (existing.rowCount) {
      resolvedPaymentId = existing.rows[0].id;
      // Forward-only state machine — out-of-order webhook delivery must
      // not regress an already-settled payment to pending. See the
      // matching comment in midtrans.service.ts (the regression test in
      // doku.unit.test.ts pins this behaviour).
      const STATUS_RANK: Record<string, number> = {
        pending: 0,
        succeeded: 1,
        failed: 1
      };
      const existingRank = STATUS_RANK[existing.rows[0].status] ?? 0;
      const newRank = STATUS_RANK[status] ?? 0;
      if (existing.rows[0].status !== status && newRank >= existingRank) {
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

  // Recompute `orders.payment_status` from the current set of succeeded
  // payments. Same 0.01 tolerance + `pending`/`dp`/`paid` taxonomy as
  // payments.service.ts → recordPayment so dashboards stay consistent
  // when manual + DOKU payments are mixed on one order.
  const sumRes = await client.query<{ total_paid: string | number | null }>(
    `SELECT COALESCE(SUM(amount), 0) AS total_paid FROM payments
       WHERE order_id = $1 AND status = 'succeeded'`,
    [order.id]
  );
  const totalPaid = Number(sumRes.rows[0]?.total_paid ?? 0);
  const totalAmount = Number(order.total_amount);
  let paymentStatus: "paid" | "dp" | "pending";
  if (totalAmount > 0 && totalPaid >= totalAmount - 0.01) paymentStatus = "paid";
  else if (totalPaid > 0) paymentStatus = "dp";
  else paymentStatus = "pending";
  await client.query(
    "UPDATE orders SET payment_status = $1 WHERE id = $2",
    [paymentStatus, order.id]
  );

  return { ignored: false, paymentId: resolvedPaymentId, status, duplicated, orderId: order.id };
}
