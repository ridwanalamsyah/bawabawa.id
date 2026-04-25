import { Router } from "express";
import { randomUUID } from "node:crypto";
import { authGuard, requirePermission } from "../../common/middleware/auth";
import { getPool } from "../../infrastructure/db/pool";
import { AppError } from "../../common/errors/app-error";
import { withTransaction } from "../../infrastructure/db/transaction-manager";
import { z } from "zod";

const financeRouter = Router();

financeRouter.post(
  "/invoices/:id/post",
  authGuard,
  requirePermission("finance:manage_finance"),
  async (req, res, next) => {
    try {
      const posted = await withTransaction(async (client) => {
        const invoice = await client.query<{
          id: string;
          order_id: string;
          status: string;
        }>(
          "SELECT id, order_id, status FROM invoices WHERE id = $1::uuid FOR UPDATE",
          [req.params.id]
        );
        if (!invoice.rowCount) {
          throw new AppError(404, "INVOICE_NOT_FOUND", "Invoice tidak ditemukan");
        }

        await client.query(
          "UPDATE invoices SET status = 'posted', posted_at = NOW() WHERE id = $1::uuid",
          [req.params.id]
        );

        const order = await client.query<{ total_amount: string; branch_id: string }>(
          "SELECT total_amount, branch_id FROM orders WHERE id = $1::uuid",
          [invoice.rows[0].order_id]
        );

        await client.query(
          `INSERT INTO financial_transactions (id, branch_id, source_type, source_id, direction, amount)
           VALUES ($1, $2::uuid, 'invoice', $3::uuid, 'in', $4)`,
          [
            randomUUID(),
            order.rows[0]?.branch_id ?? null,
            req.params.id,
            Number(order.rows[0]?.total_amount ?? 0)
          ]
        );

        return { invoiceId: req.params.id, postedAt: new Date().toISOString() };
      });

      res.json({ success: true, data: posted });
    } catch (error) {
      next(error);
    }
  }
);

financeRouter.get("/transactions", authGuard, async (_req, res, next) => {
  try {
    const transactions = await (await getPool()).query(
      `SELECT id, branch_id AS "branchId", source_type AS "sourceType", source_id AS "sourceId",
              direction, amount, posted_at AS "postedAt"
       FROM financial_transactions
       ORDER BY posted_at DESC
       LIMIT 200`
    );
    res.json({ success: true, data: transactions.rows });
  } catch (error) {
    next(error);
  }
});

financeRouter.get("/profit-share", authGuard, async (_req, res, next) => {
  try {
    const result = await (await getPool()).query(
      `SELECT setting_value AS "settingValue"
       FROM platform_settings
       WHERE setting_key = 'profit_share'
       LIMIT 1`
    );
    res.json({
      success: true,
      data: result.rows[0]?.settingValue ?? {
        rules: [],
        reservePercentage: 0
      }
    });
  } catch (error) {
    next(error);
  }
});

financeRouter.put(
  "/profit-share",
  authGuard,
  requirePermission("finance:manage_finance"),
  async (req, res, next) => {
    try {
      const payload = z
        .object({
          rules: z.array(
            z.object({
              owner: z.string().min(2),
              percentage: z.number().nonnegative()
            })
          ),
          reservePercentage: z.number().nonnegative()
        })
        .parse(req.body);
      await (await getPool()).query(
        `INSERT INTO platform_settings (setting_key, setting_value, updated_at)
         VALUES ('profit_share', $1::jsonb, NOW())
         ON CONFLICT (setting_key)
         DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = NOW()`,
        [JSON.stringify(payload)]
      );
      res.json({ success: true, data: payload });
    } catch (error) {
      next(error);
    }
  }
);

export { financeRouter };
