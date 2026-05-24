import { randomUUID } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { authGuard, requirePermission } from "../../common/middleware/auth";
import { getPool } from "../../infrastructure/db/pool";

const hrRouter = Router();

hrRouter.post(
  "/employees",
  authGuard,
  requirePermission("users:manage_users"),
  async (req, res, next) => {
    try {
      const payload = z
        .object({
          userId: z.string().uuid().optional(),
          employeeCode: z.string().min(3),
          positionTitle: z.string().min(2),
          salaryBase: z.number().nonnegative(),
          joinedAt: z.string().date()
        })
        .parse(req.body);

      const id = randomUUID();
      await (await getPool()).query(
        `INSERT INTO employees
          (id, user_id, employee_code, position_title, salary_base, joined_at, status)
         VALUES
          ($1, $2::uuid, $3, $4, $5, $6::date, 'active')`,
        [id, payload.userId ?? null, payload.employeeCode, payload.positionTitle, payload.salaryBase, payload.joinedAt]
      );
      res.status(201).json({ success: true, data: { id, ...payload, status: "active" } });
    } catch (error) {
      next(error);
    }
  }
);

hrRouter.post("/attendance", authGuard, async (req, res, next) => {
  try {
    const payload = z
      .object({
        employeeId: z.string().uuid(),
        attendanceDate: z.string().date(),
        status: z.enum(["present", "late", "absent"])
      })
      .parse(req.body);
    await (await getPool()).query(
      `INSERT INTO attendance_logs (id, employee_id, attendance_date, status, check_in_at)
       VALUES ($1, $2::uuid, $3::date, $4, NOW())
       ON CONFLICT (employee_id, attendance_date)
       DO UPDATE SET status = EXCLUDED.status`,
      [randomUUID(), payload.employeeId, payload.attendanceDate, payload.status]
    );
    res.status(201).json({ success: true, data: payload });
  } catch (error) {
    next(error);
  }
});

hrRouter.post(
  "/payroll/run",
  authGuard,
  requirePermission("finance:manage_finance"),
  async (req, res, next) => {
    try {
      const payload = z
        .object({
          month: z.number().int().min(1).max(12),
          year: z.number().int().min(2000)
        })
        .parse(req.body);

      const total = await (await getPool()).query<{ total: string }>(
        "SELECT COALESCE(SUM(salary_base), 0)::text AS total FROM employees WHERE status = 'active'"
      );
      const id = randomUUID();
      await (await getPool()).query(
        `INSERT INTO payroll_runs
          (id, period_month, period_year, status, total_amount, processed_by, processed_at)
         VALUES
          ($1, $2, $3, 'processed', $4, $5::uuid, NOW())`,
        [id, payload.month, payload.year, Number(total.rows[0].total), req.user?.sub ?? null]
      );
      res.status(201).json({
        success: true,
        data: { id, status: "processed", month: payload.month, year: payload.year, totalAmount: Number(total.rows[0].total) }
      });
    } catch (error) {
      next(error);
    }
  }
);

hrRouter.get("/employees", authGuard, async (_req, res, next) => {
  try {
    const rows = await (await getPool()).query(
      `SELECT id, user_id AS "userId", employee_code AS "employeeCode",
              position_title AS "positionTitle", salary_base AS "salaryBase",
              joined_at AS "joinedAt", status
         FROM employees
         ORDER BY joined_at DESC NULLS LAST
         LIMIT 500`
    );
    res.json({ success: true, data: rows.rows });
  } catch (error) {
    next(error);
  }
});

hrRouter.get("/attendance", authGuard, async (_req, res, next) => {
  try {
    const rows = await (await getPool()).query(
      `SELECT a.id, a.employee_id AS "employeeId", a.attendance_date AS "attendanceDate",
              a.status, a.check_in_at AS "checkInAt",
              e.employee_code AS "employeeCode", e.position_title AS "positionTitle"
         FROM attendance_logs a
         LEFT JOIN employees e ON e.id = a.employee_id
         ORDER BY a.attendance_date DESC
         LIMIT 200`
    );
    res.json({ success: true, data: rows.rows });
  } catch (error) {
    next(error);
  }
});

export { hrRouter };
