import { randomUUID } from "node:crypto";
import { getPool } from "../../infrastructure/db/pool";
import { AppError } from "../../common/errors/app-error";
import type { OrderStatus } from "@erp/shared";

type Order = {
  id: string;
  orderNumber: string;
  customerId: string;
  branchId: string;
  totalAmount: number;
  paymentStatus: "pending" | "dp" | "paid";
  status: OrderStatus;
  idempotencyKey: string;
  createdAt: string;
};

const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  draft: ["confirmed", "cancelled"],
  confirmed: ["payment_pending", "cancelled"],
  payment_pending: ["payment_dp", "payment_paid", "cancelled"],
  payment_dp: ["payment_paid", "cancelled"],
  payment_paid: ["stock_reserved"],
  stock_reserved: ["packed"],
  packed: ["shipped"],
  shipped: ["invoiced"],
  invoiced: ["posted_finance"],
  posted_finance: [],
  cancelled: []
};

export class OrdersService {
  private async nextOrderNumber(
    db: { query: <Row = any>(sql: string, params?: any[]) => Promise<{ rows: Row[]; rowCount: number }> }
  ): Promise<string> {
    const value = `${Date.now()}`.slice(-6);
    const randomPart = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    const candidate = `SO-${value}${randomPart}`;
    const exists = await db.query(
      "SELECT 1 FROM orders WHERE order_number = $1",
      [candidate]
    );
    return exists.rowCount ? this.nextOrderNumber(db) : candidate;
  }

  private async toOrder(row: {
    id: string;
    order_number: string;
    customer_id: string;
    branch_id: string;
    total_amount: string;
    payment_status: "pending" | "dp" | "paid";
    status: OrderStatus;
    idempotency_key: string;
    created_at: string;
  }): Promise<Order> {
    return {
      id: row.id,
      orderNumber: row.order_number,
      customerId: row.customer_id,
      branchId: row.branch_id,
      totalAmount: Number(row.total_amount),
      paymentStatus: row.payment_status,
      status: row.status,
      idempotencyKey: row.idempotency_key,
      createdAt: row.created_at
    };
  }

  async createOrder(input: {
    customerId: string;
    branchId: string;
    totalAmount: number;
    idempotencyKey: string;
    client?: { query: <Row = any>(sql: string, params?: any[]) => Promise<{ rows: Row[]; rowCount: number }> };
  }) {
    const db = input.client ?? (await getPool());
    const existing = await db.query<{
      id: string;
      order_number: string;
      customer_id: string;
      branch_id: string;
      total_amount: string;
      payment_status: "pending" | "dp" | "paid";
      status: OrderStatus;
      idempotency_key: string;
      created_at: string;
    }>(
      `SELECT id, order_number, customer_id, branch_id, total_amount, payment_status, status, idempotency_key, created_at
       FROM orders
       WHERE idempotency_key = $1
       LIMIT 1`,
      [input.idempotencyKey]
    );

    if (existing.rowCount) {
      return this.toOrder(existing.rows[0]);
    }

    const orderId = randomUUID();
    const orderNumber = await this.nextOrderNumber(db);
    await db.query(
      `INSERT INTO orders
        (id, branch_id, customer_id, order_number, status, payment_status, total_amount, idempotency_key)
       VALUES
        ($1, $2, $3, $4, 'draft', 'pending', $5, $6)`,
      [
        orderId,
        input.branchId,
        input.customerId,
        orderNumber,
        input.totalAmount,
        input.idempotencyKey
      ]
    );

    return this.getById(orderId, input.client);
  }

  async transition(orderId: string, toStatus: OrderStatus, client?: { query: <Row = any>(sql: string, params?: any[]) => Promise<{ rows: Row[]; rowCount: number }> }) {
    const order = await this.getById(orderId, client);
    if (!order) throw new AppError(404, "ORDER_NOT_FOUND", "Order tidak ditemukan");

    const allowed = allowedTransitions[order.status];
    if (!allowed.includes(toStatus)) {
      throw new AppError(409, "INVALID_STATUS_TRANSITION", "Transisi status tidak valid");
    }

    const paymentStatus =
      toStatus === "payment_dp"
        ? "dp"
        : toStatus === "payment_paid"
          ? "paid"
          : order.paymentStatus;

    await (client ?? (await getPool())).query(
      "UPDATE orders SET status = $1, payment_status = $2 WHERE id = $3",
      [toStatus, paymentStatus, orderId]
    );
    return this.getById(orderId, client);
  }

  async getById(orderId: string, client?: { query: <Row = any>(sql: string, params?: any[]) => Promise<{ rows: Row[]; rowCount: number }> }) {
    const result = await (client ?? (await getPool())).query<{
      id: string;
      order_number: string;
      customer_id: string;
      branch_id: string;
      total_amount: string;
      payment_status: "pending" | "dp" | "paid";
      status: OrderStatus;
      idempotency_key: string;
      created_at: string;
    }>(
      `SELECT id, order_number, customer_id, branch_id, total_amount, payment_status, status, idempotency_key, created_at
       FROM orders
       WHERE id = $1
       LIMIT 1`,
      [orderId]
    );
    if (!result.rowCount) return undefined;
    return this.toOrder(result.rows[0]);
  }

  async listRecent(limit = 100, client?: { query: <Row = any>(sql: string, params?: any[]) => Promise<{ rows: Row[]; rowCount: number }> }) {
    const rows = await (client ?? (await getPool())).query<{
      id: string;
      order_number: string;
      customer_id: string;
      branch_id: string;
      total_amount: string;
      payment_status: "pending" | "dp" | "paid";
      status: OrderStatus;
      idempotency_key: string;
      created_at: string;
    }>(
      `SELECT id, order_number, customer_id, branch_id, total_amount, payment_status, status, idempotency_key, created_at
       FROM orders
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    );
    return Promise.all(rows.rows.map((row) => this.toOrder(row)));
  }
}
