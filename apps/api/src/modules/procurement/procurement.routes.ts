import { randomUUID } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { authGuard, requirePermission } from "../../common/middleware/auth";
import { getPool } from "../../infrastructure/db/pool";

const procurementRouter = Router();

procurementRouter.post(
  "/purchase-orders",
  authGuard,
  requirePermission("orders:update"),
  async (req, res, next) => {
    try {
      const payload = z
        .object({
          supplierId: z.string().uuid(),
          branchId: z.string().uuid(),
          totalAmount: z.number().nonnegative()
        })
        .parse(req.body);

      const id = randomUUID();
      await (await getPool()).query(
        `INSERT INTO purchase_orders (id, supplier_id, branch_id, status, total_amount)
         VALUES ($1, $2::uuid, $3::uuid, 'draft', $4)`,
        [id, payload.supplierId, payload.branchId, payload.totalAmount]
      );
      res.status(201).json({ success: true, data: { id, ...payload, status: "draft" } });
    } catch (error) {
      next(error);
    }
  }
);

procurementRouter.post(
  "/purchase-orders/:id/receive",
  authGuard,
  requirePermission("orders:update"),
  async (req, res, next) => {
    try {
      const result = await (await getPool()).query(
        `UPDATE purchase_orders
         SET status = 'received'
         WHERE id = $1::uuid
         RETURNING id, supplier_id AS "supplierId", branch_id AS "branchId", total_amount AS "totalAmount", status`,
        [req.params.id]
      );
      if (!result.rowCount) return res.status(404).json({ success: false, error: { code: "PO_NOT_FOUND", message: "Purchase order tidak ditemukan" } });
      res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      next(error);
    }
  }
);

procurementRouter.get("/purchase-orders", authGuard, async (_req, res, next) => {
  try {
    const result = await (await getPool()).query(
      `SELECT po.id, po.supplier_id AS "supplierId", po.branch_id AS "branchId", po.total_amount AS "totalAmount", po.status,
              COALESCE(
                json_agg(pos.order_id) FILTER (WHERE pos.order_id IS NOT NULL),
                '[]'::json
              ) AS "sourceOrderIds"
       FROM purchase_orders
       po
       LEFT JOIN purchase_order_sources pos ON pos.purchase_order_id = po.id
       GROUP BY po.id
       ORDER BY po.id DESC
       LIMIT 200`
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
});

export { procurementRouter };
