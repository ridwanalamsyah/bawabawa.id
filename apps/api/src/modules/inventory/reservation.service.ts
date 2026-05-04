import { randomUUID } from "node:crypto";
import { AppError } from "../../common/errors/app-error";

type QueryClient = {
  query: <Row = any>(sql: string, params?: any[]) => Promise<{ rows: Row[]; rowCount: number }>;
};

export type ReservationLine = { productId: string; qty: number };

/**
 * Reserve stock atomically for an order. The update only succeeds when the
 * product has enough AVAILABLE stock (`current_stock - reserved_stock >= qty`),
 * so concurrent callers can't double-reserve the same unit even without an
 * explicit row lock. If any line fails the whole transaction rolls back.
 */
export async function reserveForOrder(
  client: QueryClient,
  orderId: string,
  items: ReservationLine[]
) {
  if (!items.length) {
    throw new AppError(422, "EMPTY_RESERVATION", "Order tidak memiliki item untuk direservasi");
  }

  // If this order already has reservations, short-circuit (idempotent).
  const existing = await client.query<{ count: string | number }>(
    "SELECT COUNT(*) AS count FROM order_reservations WHERE order_id = $1 AND status = 'reserved'",
    [orderId]
  );
  if (Number(existing.rows[0]?.count ?? 0) > 0) {
    return { reserved: 0, skipped: true };
  }

  let reserved = 0;
  for (const line of items) {
    if (line.qty <= 0) {
      throw new AppError(422, "INVALID_QTY", `Qty untuk produk ${line.productId} harus > 0`);
    }

    const update = await client.query(
      `UPDATE products
          SET reserved_stock = reserved_stock + $1
        WHERE id = $2
          AND (current_stock - reserved_stock) >= $1`,
      [line.qty, line.productId]
    );
    if (!update.rowCount) {
      throw new AppError(
        409,
        "INSUFFICIENT_STOCK",
        `Stok produk ${line.productId} tidak mencukupi`
      );
    }

    await client.query(
      `INSERT INTO order_reservations (id, order_id, product_id, qty, status)
       VALUES ($1, $2, $3, $4, 'reserved')`,
      [randomUUID(), orderId, line.productId, line.qty]
    );
    reserved += 1;
  }

  return { reserved, skipped: false };
}

/**
 * Release all active reservations for an order. Called on cancel. Idempotent:
 * already-released or already-consumed reservations are left alone.
 */
export async function releaseForOrder(client: QueryClient, orderId: string) {
  const active = await client.query<{ id: string; product_id: string; qty: number }>(
    `SELECT id, product_id, qty
       FROM order_reservations
      WHERE order_id = $1 AND status = 'reserved'`,
    [orderId]
  );
  for (const row of active.rows) {
    await client.query(
      `UPDATE products
          SET reserved_stock = GREATEST(reserved_stock - $1, 0)
        WHERE id = $2`,
      [Number(row.qty), row.product_id]
    );
    await client.query(
      `UPDATE order_reservations
          SET status = 'released', released_at = NOW()
        WHERE id = $1`,
      [row.id]
    );
  }
  return { released: active.rowCount };
}

/**
 * Consume the reservation once items physically ship. Moves qty from
 * reserved_stock → (decrements current_stock) and marks rows 'consumed'.
 * Idempotent on repeat calls.
 */
export async function consumeForOrder(client: QueryClient, orderId: string) {
  const active = await client.query<{ id: string; product_id: string; qty: number }>(
    `SELECT id, product_id, qty
       FROM order_reservations
      WHERE order_id = $1 AND status = 'reserved'`,
    [orderId]
  );
  for (const row of active.rows) {
    await client.query(
      `UPDATE products
          SET current_stock = GREATEST(current_stock - $1, 0),
              reserved_stock = GREATEST(reserved_stock - $1, 0)
        WHERE id = $2`,
      [Number(row.qty), row.product_id]
    );
    await client.query(
      `UPDATE order_reservations
          SET status = 'consumed', consumed_at = NOW()
        WHERE id = $1`,
      [row.id]
    );
  }
  return { consumed: active.rowCount };
}
