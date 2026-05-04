import { AppError } from "../../common/errors/app-error";
import { withTransaction } from "../../infrastructure/db/transaction-manager";
import { OrdersService } from "./orders.service";
import {
  consumeForOrder,
  releaseForOrder,
  reserveForOrder
} from "../inventory/reservation.service";
import { randomUUID } from "node:crypto";

export class WorkflowService {
  constructor(private readonly ordersService: OrdersService) {}

  async processPayment(orderId: string, isDownPayment: boolean) {
    return withTransaction(async (client) => {
      const targetStatus = isDownPayment ? "payment_dp" : "payment_paid";
      const updated = await this.ordersService.transition(orderId, targetStatus, client);
      if (!isDownPayment) {
        await this.autoOpenPurchaseOrder(client);
      }
      return updated;
    });
  }

  private async autoOpenPurchaseOrder(client: {
    query: (
      text: string,
      params?: unknown[]
    ) => Promise<{ rowCount: number | null; rows: Record<string, unknown>[] }>;
  }) {
    const candidates = await client.query(
      `SELECT o.id, o.branch_id, o.total_amount
       FROM orders o
       LEFT JOIN purchase_order_sources pos ON pos.order_id = o.id
       WHERE pos.order_id IS NULL
         AND o.status IN ('payment_paid', 'stock_reserved', 'packed', 'shipped', 'invoiced')
       ORDER BY o.created_at ASC
       LIMIT 20`
    );
    if (!candidates.rowCount || candidates.rows.length < 3) return;

    const branchId = (candidates.rows[0].branch_id as string | null) ?? null;
    const totalAmount = candidates.rows.reduce(
      (sum, row) => sum + Number(row.total_amount ?? 0),
      0
    );
    const purchaseOrderId = randomUUID();
    await client.query(
      `INSERT INTO purchase_orders (id, supplier_id, branch_id, status, total_amount)
       VALUES ($1::uuid, NULL, $2::uuid, 'draft', $3)`,
      [purchaseOrderId, branchId, totalAmount]
    );
    for (const row of candidates.rows) {
      await client.query(
        `INSERT INTO purchase_order_sources (id, purchase_order_id, order_id)
         VALUES ($1::uuid, $2::uuid, $3::uuid)
         ON CONFLICT (purchase_order_id, order_id) DO NOTHING`,
        [randomUUID(), purchaseOrderId, row.id]
      );
    }
  }

  async reserveStock(orderId: string) {
    return withTransaction(async (client) => {
      const order = await this.ordersService.getById(orderId, client);
      if (!order) {
        throw new AppError(404, "ORDER_NOT_FOUND", "Order tidak ditemukan");
      }
      if (order.status !== "payment_paid") {
        throw new AppError(409, "PAYMENT_NOT_SETTLED", "Pembayaran belum lunas");
      }

      const items = await client.query<{ product_id: string; qty: number }>(
        "SELECT product_id, qty FROM order_items WHERE order_id = $1",
        [orderId]
      );
      if (items.rowCount > 0) {
        await reserveForOrder(
          client,
          orderId,
          items.rows.map((row) => ({ productId: row.product_id, qty: Number(row.qty) }))
        );
      }

      return this.ordersService.transition(orderId, "stock_reserved", client);
    });
  }

  async shipOrder(orderId: string) {
    return withTransaction(async (client) => {
      const order = await this.ordersService.getById(orderId, client);
      if (!order) {
        throw new AppError(404, "ORDER_NOT_FOUND", "Order tidak ditemukan");
      }
      if (order.status !== "packed") {
        throw new AppError(409, "ORDER_NOT_PACKED", "Order belum di-pack");
      }
      await consumeForOrder(client, orderId);
      return this.ordersService.transition(orderId, "shipped", client);
    });
  }

  async cancelOrder(orderId: string) {
    return withTransaction(async (client) => {
      const order = await this.ordersService.getById(orderId, client);
      if (!order) {
        throw new AppError(404, "ORDER_NOT_FOUND", "Order tidak ditemukan");
      }
      const cancellable = [
        "draft",
        "confirmed",
        "payment_pending",
        "payment_dp",
        "payment_paid",
        "stock_reserved"
      ];
      if (!cancellable.includes(order.status)) {
        throw new AppError(409, "ORDER_NOT_CANCELLABLE", "Order tidak bisa dibatalkan pada status ini");
      }
      await releaseForOrder(client, orderId);
      return this.ordersService.transition(orderId, "cancelled", client);
    });
  }

  async postToFinance(orderId: string) {
    return withTransaction(async (client) => {
      const order = await this.ordersService.getById(orderId, client);
      if (!order) {
        throw new AppError(404, "ORDER_NOT_FOUND", "Order tidak ditemukan");
      }
      if (order.status !== "invoiced") {
        throw new AppError(409, "ORDER_NOT_INVOICED", "Order belum invoiced");
      }
      await client.query(
        `INSERT INTO financial_transactions (id, source_type, source_id, direction, amount)
         VALUES ($1, 'order', $2::uuid, 'in', $3)`,
        [randomUUID(), order.id, order.totalAmount]
      );
      return this.ordersService.transition(orderId, "posted_finance", client);
    });
  }
}
