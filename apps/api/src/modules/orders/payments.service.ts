import { randomUUID } from "node:crypto";
import { AppError } from "../../common/errors/app-error";

type QueryClient = {
  query: <Row = any>(sql: string, params?: any[]) => Promise<{ rows: Row[]; rowCount: number }>;
};

export type PaymentMethod =
  | "cash"
  | "qris"
  | "bank_transfer"
  | "card"
  | "ewallet_gopay"
  | "ewallet_ovo"
  | "ewallet_dana"
  | "ewallet_shopee";

export const ALLOWED_METHODS: PaymentMethod[] = [
  "cash",
  "qris",
  "bank_transfer",
  "card",
  "ewallet_gopay",
  "ewallet_ovo",
  "ewallet_dana",
  "ewallet_shopee"
];

export type Split = {
  customerId?: string;
  label?: string;
  amount: number;
};

/**
 * Split an order's total across multiple payers. The amounts must sum to the
 * order total (within 0.01 rounding). Once split, payments can be attached
 * to each bill independently so multi-customer orders (e.g. group dinner,
 * batch order) stay reconciled.
 */
export async function splitOrderBill(
  client: QueryClient,
  orderId: string,
  splits: Split[]
) {
  if (splits.length < 2) {
    throw new AppError(422, "INVALID_SPLIT", "Minimal 2 split untuk bagi tagihan");
  }

  // FOR UPDATE locks the order row so a second concurrent splitOrderBill
  // call for the same order blocks here instead of racing the
  // COUNT(*)-based "already split?" guard below and double-inserting splits.
  const orderRow = await client.query<{ total_amount: string }>(
    "SELECT total_amount FROM orders WHERE id = $1 FOR UPDATE",
    [orderId]
  );
  if (!orderRow.rowCount) {
    throw new AppError(404, "ORDER_NOT_FOUND", "Order tidak ditemukan");
  }

  const existing = await client.query<{ count: string | number }>(
    "SELECT COUNT(*) AS count FROM order_splits WHERE order_id = $1",
    [orderId]
  );
  if (Number(existing.rows[0]?.count ?? 0) > 0) {
    throw new AppError(409, "ALREADY_SPLIT", "Order sudah dibagi sebelumnya");
  }

  const orderTotal = Number(orderRow.rows[0].total_amount);
  const splitTotal = splits.reduce((sum, s) => sum + s.amount, 0);
  if (Math.abs(splitTotal - orderTotal) > 0.01) {
    throw new AppError(
      422,
      "SPLIT_TOTAL_MISMATCH",
      `Total split (${splitTotal}) tidak sama dengan order total (${orderTotal})`
    );
  }

  const created: Array<{ id: string; amount: number; label?: string; customerId?: string }> = [];
  for (const split of splits) {
    if (split.amount <= 0) {
      throw new AppError(422, "INVALID_SPLIT_AMOUNT", "Amount split harus > 0");
    }
    const id = randomUUID();
    await client.query(
      `INSERT INTO order_splits
         (id, order_id, customer_id, label, amount_due, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')`,
      [id, orderId, split.customerId ?? null, split.label ?? null, split.amount]
    );
    created.push({
      id,
      amount: split.amount,
      label: split.label,
      customerId: split.customerId
    });
  }

  return { orderId, splits: created };
}

/**
 * Record a payment against an order (or a specific split within a multi-bill
 * order). Supports partial payments — multiple payments on the same order
 * are summed and compared against `orders.total_amount` to auto-flip the
 * top-level `orders.payment_status` to 'dp' (partial) or 'paid' (full).
 */
export async function recordPayment(
  client: QueryClient,
  input: {
    orderId: string;
    amount: number;
    method: PaymentMethod;
    splitId?: string;
    reference?: string;
  }
) {
  if (!ALLOWED_METHODS.includes(input.method)) {
    throw new AppError(422, "INVALID_METHOD", `Metode pembayaran tidak dikenal: ${input.method}`);
  }
  if (input.amount <= 0) {
    throw new AppError(422, "INVALID_AMOUNT", "Amount harus > 0");
  }

  // FOR UPDATE serializes concurrent recordPayment calls on the same order,
  // so the SUM(payments) recomputation below sees a stable set of committed
  // payments and the derived payment_status (pending/dp/paid) is consistent.
  const orderRow = await client.query<{ total_amount: string; payment_status: string }>(
    "SELECT total_amount, payment_status FROM orders WHERE id = $1 FOR UPDATE",
    [input.orderId]
  );
  if (!orderRow.rowCount) {
    throw new AppError(404, "ORDER_NOT_FOUND", "Order tidak ditemukan");
  }

  if (input.splitId) {
    // Lock the split row too so two concurrent payments against the same
    // split can't both read the stale amount_paid, both pass the overpay
    // check, and both increment — pushing amount_paid over amount_due.
    const splitRow = await client.query<{ amount_due: string; amount_paid: string }>(
      "SELECT amount_due, amount_paid FROM order_splits WHERE id = $1 AND order_id = $2 FOR UPDATE",
      [input.splitId, input.orderId]
    );
    if (!splitRow.rowCount) {
      throw new AppError(404, "SPLIT_NOT_FOUND", "Split tidak ditemukan untuk order ini");
    }
    const due = Number(splitRow.rows[0].amount_due);
    const alreadyPaid = Number(splitRow.rows[0].amount_paid);
    if (alreadyPaid + input.amount > due + 0.01) {
      throw new AppError(
        422,
        "OVERPAY_SPLIT",
        `Pembayaran melebihi split (due ${due}, sudah bayar ${alreadyPaid})`
      );
    }
  }

  const paymentId = randomUUID();
  await client.query(
    `INSERT INTO payments
       (id, order_id, split_id, amount, method, status, reference, paid_at)
     VALUES ($1, $2, $3, $4, $5, 'succeeded', $6, NOW())`,
    [
      paymentId,
      input.orderId,
      input.splitId ?? null,
      input.amount,
      input.method,
      input.reference ?? null
    ]
  );

  if (input.splitId) {
    await client.query(
      `UPDATE order_splits
          SET amount_paid = amount_paid + $1,
              status = CASE
                WHEN amount_paid + $1 >= amount_due THEN 'paid'
                WHEN amount_paid + $1 > 0 THEN 'partial'
                ELSE status
              END
        WHERE id = $2`,
      [input.amount, input.splitId]
    );
  }

  const paidSumRow = await client.query<{ paid_sum: string | number | null }>(
    `SELECT COALESCE(SUM(amount), 0) AS paid_sum
       FROM payments
      WHERE order_id = $1 AND status = 'succeeded'`,
    [input.orderId]
  );
  const paidSum = Number(paidSumRow.rows[0]?.paid_sum ?? 0);
  const orderTotal = Number(orderRow.rows[0].total_amount);
  const newStatus = paidSum >= orderTotal - 0.01 ? "paid" : paidSum > 0 ? "dp" : "pending";

  await client.query("UPDATE orders SET payment_status = $1 WHERE id = $2", [
    newStatus,
    input.orderId
  ]);

  return {
    paymentId,
    orderId: input.orderId,
    splitId: input.splitId,
    amount: input.amount,
    method: input.method,
    paidSum,
    orderTotal,
    paymentStatus: newStatus
  };
}

export async function listPaymentsForOrder(client: QueryClient, orderId: string) {
  const result = await client.query<{
    id: string;
    split_id: string | null;
    amount: string;
    method: string;
    status: string;
    reference: string | null;
    paid_at: string | null;
  }>(
    `SELECT id, split_id, amount, method, status, reference, paid_at
       FROM payments
      WHERE order_id = $1
      ORDER BY paid_at ASC NULLS LAST`,
    [orderId]
  );
  return result.rows.map((row) => ({
    id: row.id,
    splitId: row.split_id,
    amount: Number(row.amount),
    method: row.method,
    status: row.status,
    reference: row.reference,
    paidAt: row.paid_at
  }));
}

export async function listSplitsForOrder(client: QueryClient, orderId: string) {
  const result = await client.query<{
    id: string;
    customer_id: string | null;
    label: string | null;
    amount_due: string;
    amount_paid: string;
    status: string;
  }>(
    `SELECT id, customer_id, label, amount_due, amount_paid, status
       FROM order_splits
      WHERE order_id = $1
      ORDER BY created_at ASC`,
    [orderId]
  );
  return result.rows.map((row) => ({
    id: row.id,
    customerId: row.customer_id,
    label: row.label,
    amountDue: Number(row.amount_due),
    amountPaid: Number(row.amount_paid),
    status: row.status
  }));
}
