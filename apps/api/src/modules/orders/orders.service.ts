import { randomUUID } from "node:crypto";
import { getPool } from "../../infrastructure/db/pool";
import { AppError } from "../../common/errors/app-error";
import type { OrderStatus } from "@erp/shared";

/**
 * Source of an order. Defaults to "web" for normal checkout flows. The
 * admin manual-input form lets staff record orders coming from external
 * channels (DM, telephone, walk-in, etc) so we can later attribute
 * conversions per channel in reports.
 */
export type OrderSourceChannel =
  | "web"
  | "instagram"
  | "whatsapp"
  | "dm"
  | "telepon"
  | "email"
  | "marketplace"
  | "walkin"
  | "lainnya";

const VALID_SOURCE_CHANNELS: ReadonlyArray<OrderSourceChannel> = [
  "web",
  "instagram",
  "whatsapp",
  "dm",
  "telepon",
  "email",
  "marketplace",
  "walkin",
  "lainnya"
];

type Order = {
  id: string;
  orderNumber: string;
  customerId: string;
  branchId: string;
  totalAmount: number;
  paymentStatus: "pending" | "dp" | "paid";
  status: OrderStatus;
  idempotencyKey: string;
  sourceChannel: OrderSourceChannel;
  notes: string | null;
  createdAt: string;
};

const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  draft: ["confirmed", "cancelled"],
  confirmed: ["payment_pending", "cancelled"],
  payment_pending: ["payment_dp", "payment_paid", "cancelled"],
  payment_dp: ["payment_paid", "cancelled"],
  payment_paid: ["stock_reserved", "cancelled"],
  stock_reserved: ["packed", "cancelled"],
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
    source_channel?: string | null;
    notes?: string | null;
    created_at: string;
  }): Promise<Order> {
    const rawChannel = (row.source_channel ?? "web") as OrderSourceChannel;
    const channel: OrderSourceChannel = VALID_SOURCE_CHANNELS.includes(rawChannel)
      ? rawChannel
      : "web";
    return {
      id: row.id,
      orderNumber: row.order_number,
      customerId: row.customer_id,
      branchId: row.branch_id,
      totalAmount: Number(row.total_amount),
      paymentStatus: row.payment_status,
      status: row.status,
      idempotencyKey: row.idempotency_key,
      sourceChannel: channel,
      notes: row.notes ?? null,
      createdAt: row.created_at
    };
  }

  async createOrder(input: {
    customerId: string;
    branchId: string;
    totalAmount: number;
    idempotencyKey: string;
    sourceChannel?: OrderSourceChannel;
    notes?: string | null;
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
      source_channel?: string | null;
      notes?: string | null;
      created_at: string;
    }>(
      `SELECT id, order_number, customer_id, branch_id, total_amount, payment_status, status, idempotency_key, source_channel, notes, created_at
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
    const channel = input.sourceChannel ?? "web";
    await db.query(
      `INSERT INTO orders
        (id, branch_id, customer_id, order_number, status, payment_status, total_amount, idempotency_key, source_channel, notes)
       VALUES
        ($1, $2, $3, $4, 'draft', 'pending', $5, $6, $7, $8)`,
      [
        orderId,
        input.branchId,
        input.customerId,
        orderNumber,
        input.totalAmount,
        input.idempotencyKey,
        channel,
        input.notes ?? null
      ]
    );

    return this.getById(orderId, input.client);
  }

  /**
   * Find an existing customer by phone number, or create a new "manual"
   * customer record. Used by the admin manual order form so we don't have
   * to pre-create customer rows for one-off Instagram / phone orders.
   *
   * Phone normalization: strip non-digits, prefix '62' for indonesian
   * numbers starting with '0'. Two customers with the same digits will
   * collide intentionally so repeat manual orders accumulate against one
   * customer record.
   */
  async upsertManualCustomer(input: {
    name: string;
    phone: string;
    branchId: string;
    client?: { query: <Row = any>(sql: string, params?: any[]) => Promise<{ rows: Row[]; rowCount: number }> };
  }): Promise<{ id: string }> {
    const db = input.client ?? (await getPool());
    const normalizedPhone = input.phone.replace(/\D+/g, "").replace(/^0/, "62");
    if (!normalizedPhone) {
      throw new AppError(422, "INVALID_PHONE", "Nomor telepon tidak valid");
    }
    const existing = await db.query<{ id: string }>(
      `SELECT id FROM customers WHERE phone = $1 LIMIT 1`,
      [normalizedPhone]
    );
    if (existing.rowCount) {
      return { id: existing.rows[0].id };
    }
    const id = randomUUID();
    await db.query(
      `INSERT INTO customers (id, name, phone, branch_id) VALUES ($1, $2, $3, $4)`,
      [id, input.name.trim(), normalizedPhone, input.branchId]
    );
    return { id };
  }

  /**
   * Create an order from the admin manual-entry form. Differs from
   * `createOrder` in two ways:
   *
   *   1. It can create the customer row on the fly from a name + phone,
   *      so the admin doesn't have to pre-register the customer.
   *   2. It generates its own idempotency key (random UUID) since the
   *      admin's form is a one-shot click — not a retry-prone webhook —
   *      and asking the admin to type one in would be friction.
   *
   * Requires the caller to have permission `orders:create`.
   */
  async createManualOrder(input: {
    customerName: string;
    customerPhone: string;
    branchId: string;
    totalAmount: number;
    sourceChannel: OrderSourceChannel;
    notes?: string | null;
  }) {
    if (!VALID_SOURCE_CHANNELS.includes(input.sourceChannel)) {
      throw new AppError(422, "INVALID_SOURCE_CHANNEL", "Channel tidak dikenali");
    }
    const customer = await this.upsertManualCustomer({
      name: input.customerName,
      phone: input.customerPhone,
      branchId: input.branchId
    });
    return this.createOrder({
      customerId: customer.id,
      branchId: input.branchId,
      totalAmount: input.totalAmount,
      idempotencyKey: `manual-${randomUUID()}`,
      sourceChannel: input.sourceChannel,
      notes: input.notes ?? null
    });
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
      source_channel: string | null;
      notes: string | null;
      created_at: string;
    }>(
      `SELECT id, order_number, customer_id, branch_id, total_amount, payment_status, status, idempotency_key, source_channel, notes, created_at
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
      source_channel: string | null;
      notes: string | null;
      created_at: string;
    }>(
      `SELECT id, order_number, customer_id, branch_id, total_amount, payment_status, status, idempotency_key, source_channel, notes, created_at
       FROM orders
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    );
    return Promise.all(rows.rows.map((row) => this.toOrder(row)));
  }

  async listByCreatedBy(userId: string, limit = 50) {
    const pool = await getPool();
    const rows = await pool.query<{
      id: string;
      order_number: string;
      customer_id: string;
      branch_id: string;
      total_amount: string;
      payment_status: "pending" | "dp" | "paid";
      status: OrderStatus;
      idempotency_key: string;
      source_channel: string | null;
      notes: string | null;
      created_at: string;
    }>(
      `SELECT id, order_number, customer_id, branch_id, total_amount, payment_status, status, idempotency_key, source_channel, notes, created_at
       FROM orders
       WHERE created_by = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    return Promise.all(rows.rows.map((row) => this.toOrder(row)));
  }
}
