import { Router } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { authGuard } from "../../common/middleware/auth";
import { AppError } from "../../common/errors/app-error";
import { withTransaction } from "../../infrastructure/db/transaction-manager";
import { getPool } from "../../infrastructure/db/pool";

const inventoryRouter = Router();

inventoryRouter.post("/adjustments", authGuard, (req, res, next) => {
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
