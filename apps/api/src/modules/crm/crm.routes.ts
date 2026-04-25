import { randomUUID } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { authGuard } from "../../common/middleware/auth";
import { getPool } from "../../infrastructure/db/pool";

const crmRouter = Router();

crmRouter.post("/customers", authGuard, async (req, res, next) => {
  try {
    const payload = z
      .object({
        name: z.string().min(2),
        phone: z.string().min(8),
        branchId: z.string().uuid()
      })
      .parse(req.body);

    const id = randomUUID();
    await (await getPool()).query(
      `INSERT INTO customers (id, name, phone, branch_id)
       VALUES ($1, $2, $3, $4::uuid)`,
      [id, payload.name, payload.phone, payload.branchId]
    );
    res.status(201).json({ success: true, data: { id, ...payload } });
  } catch (error) {
    next(error);
  }
});

crmRouter.get("/customers", authGuard, async (_req, res, next) => {
  try {
    const result = await (await getPool()).query(
      `SELECT id, name, phone, branch_id AS "branchId"
       FROM customers
       ORDER BY name ASC`
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
});

crmRouter.post("/leads", authGuard, async (req, res, next) => {
  try {
    const payload = z
      .object({
        customerId: z.string().uuid().optional(),
        name: z.string().min(2),
        ownerId: z.string().uuid().optional(),
        expectedValue: z.number().nonnegative().default(0)
      })
      .parse(req.body);
    const id = randomUUID();
    await (await getPool()).query(
      `INSERT INTO crm_leads (id, customer_id, name, stage, owner_id, expected_value)
       VALUES ($1, $2::uuid, $3, 'new', $4::uuid, $5)`,
      [id, payload.customerId ?? null, payload.name, payload.ownerId ?? req.user?.sub ?? null, payload.expectedValue]
    );
    res.status(201).json({ success: true, data: { id, ...payload, stage: "new" } });
  } catch (error) {
    next(error);
  }
});

crmRouter.get("/leads", authGuard, async (_req, res, next) => {
  try {
    const result = await (await getPool()).query(
      `SELECT id, customer_id AS "customerId", name, stage, owner_id AS "ownerId",
              expected_value AS "expectedValue", created_at AS "createdAt"
       FROM crm_leads
       ORDER BY created_at DESC`
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
});

export { crmRouter };
