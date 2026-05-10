import { Router } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { authGuard } from "../../common/middleware/auth";
import { idempotency } from "../../common/middleware/idempotency";
import { AppError } from "../../common/errors/app-error";
import { withTransaction } from "../../infrastructure/db/transaction-manager";
import { getPool } from "../../infrastructure/db/pool";

const inventoryRouter = Router();

inventoryRouter.post("/adjustments", authGuard, idempotency(), (req, res, next) => {
  z.object({
    productId: z.string().uuid(),
    branchId: z.string().uuid(),
    qty: z.number().int(),
    reason: z.string().min(3)
  })
    .parseAsync(req.body)
    .then(async (payload) => {
      if (payload.qty === 0) {
        throw new AppError(422, "INVALID_QTY", "Qty tidak boleh 0");
      }

      const movement = await withTransaction(async (client) => {
        const productResult = await client.query<{
          current_stock: number;
        }>("SELECT current_stock FROM products WHERE id = $1 FOR UPDATE", [
          payload.productId
        ]);
        if (!productResult.rowCount) {
          throw new AppError(404, "PRODUCT_NOT_FOUND", "Produk tidak ditemukan");
        }

        const qtyBefore = Number(productResult.rows[0].current_stock);
        const qtyAfter = qtyBefore + payload.qty;
        if (qtyAfter < 0) {
          throw new AppError(
            409,
            "INSUFFICIENT_STOCK",
            "Stok tidak cukup untuk adjustment ini"
          );
        }

        await client.query(
          "UPDATE products SET current_stock = $1 WHERE id = $2",
          [qtyAfter, payload.productId]
        );
        const id = randomUUID();
        await client.query(
          `INSERT INTO inventory_logs
            (id, product_id, branch_id, movement_type, qty_before, qty_change, qty_after, reference_type)
           VALUES ($1, $2, $3, 'adjustment', $4, $5, $6, $7)`,
          [id, payload.productId, payload.branchId, qtyBefore, payload.qty, qtyAfter, payload.reason]
        );
        return { id, ...payload, qtyBefore, qtyAfter };
      });
      res.status(201).json({ success: true, data: movement });
    })
    .catch(next);
});

/**
 * Public-facing item listing consumed by `apps/site` at /api/items.
 * Intentionally NOT behind `authGuard` so the marketing site can render
 * categories and popular items without an admin token. Filters: `q`,
 * `category`, `page`, `limit`, `active`.
 */
inventoryRouter.get("/items", async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const offset = (page - 1) * limit;
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const category = typeof req.query.category === "string" ? req.query.category.trim() : "";

    const filters: string[] = [];
    const params: any[] = [];
    if (q) {
      params.push(`%${q.toLowerCase()}%`);
      filters.push(`LOWER(p.name) LIKE $${params.length}`);
    }
    if (category) {
      params.push(category);
      filters.push(`(c.name = $${params.length} OR c.id::text = $${params.length})`);
    }
    const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
    params.push(limit, offset);

    const rows = await (await getPool()).query<{
      id: string;
      sku: string;
      name: string;
      category: string | null;
      unitPrice: string;
      currentStock: number;
      createdAt: string;
    }>(
      `SELECT p.id, p.sku, p.name,
              c.name AS category,
              p.unit_price AS "unitPrice",
              p.current_stock AS "currentStock",
              p.created_at AS "createdAt"
         FROM products p
         LEFT JOIN categories c ON c.id = p.category_id
         ${where}
         ORDER BY p.created_at DESC
         LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const data = rows.rows.map((row) => ({
      ...row,
      unitPrice: Number(row.unitPrice ?? 0),
      currentStock: Number(row.currentStock ?? 0),
    }));

    res.json(data);
  } catch (error) {
    next(error);
  }
});

inventoryRouter.get("/movements", authGuard, async (_req, res, next) => {
  try {
    const rows = await (await getPool()).query(
      `SELECT id, product_id AS "productId", branch_id AS "branchId", movement_type AS "movementType",
              qty_before AS "qtyBefore", qty_change AS "qtyChange", qty_after AS "qtyAfter",
              reference_type AS "referenceType", created_at AS "createdAt"
       FROM inventory_logs
       ORDER BY created_at DESC
       LIMIT 200`
    );
    res.json({ success: true, data: rows.rows });
  } catch (error) {
    next(error);
  }
});

export { inventoryRouter };
