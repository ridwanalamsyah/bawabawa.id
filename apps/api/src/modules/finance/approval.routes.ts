import { Router } from "express";
import { randomUUID } from "node:crypto";
import { authGuard, requirePermission } from "../../common/middleware/auth";
import { getPool } from "../../infrastructure/db/pool";
import { AppError } from "../../common/errors/app-error";
import { logAudit } from "../../common/audit/audit-log";

const approvalRouter = Router();

approvalRouter.post("/request/:id", authGuard, async (req, res, next) => {
  try {
    const approvalId = randomUUID();
    const levelRequired = Number(req.body.levelRequired ?? 2);
    await (await getPool()).query(
      `INSERT INTO approval_requests
        (id, module_name, entity_id, level_required, current_level, status, requested_by)
       VALUES
        ($1, $2, $3::uuid, $4, 0, 'submitted', $5::uuid)`,
      [
        approvalId,
        String(req.body.moduleName ?? "orders"),
        String(req.params.id),
        levelRequired,
        req.user?.sub ?? null
      ]
    );
    res.status(201).json({
      success: true,
      data: {
        id: approvalId,
        status: "submitted",
        currentLevel: 0,
        levelRequired
      }
    });
    await logAudit({
      actorId: req.user?.sub,
      action: "approval.request",
      moduleName: "approvals",
      entityId: approvalId,
      afterData: { levelRequired }
    });
  } catch (error) {
    next(error);
  }
});

approvalRouter.post(
  "/:id/approve",
  authGuard,
  requirePermission("orders:approve"),
  async (req, res, next) => {
    try {
      const result = await (await getPool()).query<{
        id: string;
        current_level: number;
        level_required: number;
        status: string;
      }>(
        `UPDATE approval_requests
         SET current_level = current_level + 1,
             status = CASE WHEN current_level + 1 >= level_required THEN 'executed' ELSE 'in_review' END
         WHERE id = $1::uuid
         RETURNING id, current_level, level_required, status`,
        [String(req.params.id)]
      );
      if (!result.rowCount) {
        throw new AppError(404, "NOT_FOUND", "Approval tidak ditemukan");
      }
      await (await getPool()).query(
        `INSERT INTO approval_steps
          (id, approval_request_id, step_level, approver_id, status, note, acted_at)
         VALUES ($1, $2::uuid, $3, $4::uuid, 'approved', $5, NOW())`,
        [
          randomUUID(),
          String(req.params.id),
          result.rows[0].current_level,
          req.user?.sub ?? null,
          String(req.body.note ?? "")
        ]
      );
      res.json({
        success: true,
        data: {
          id: result.rows[0].id,
          currentLevel: result.rows[0].current_level,
          levelRequired: result.rows[0].level_required,
          status: result.rows[0].status
        }
      });
      await logAudit({
        actorId: req.user?.sub,
        action: "approval.approve",
        moduleName: "approvals",
        entityId: result.rows[0].id,
        afterData: result.rows[0]
      });
    } catch (error) {
      next(error);
    }
  }
);

approvalRouter.post(
  "/:id/reject",
  authGuard,
  requirePermission("orders:approve"),
  async (req, res, next) => {
    try {
      const result = await (await getPool()).query<{
        id: string;
        current_level: number;
        level_required: number;
      }>(
        `UPDATE approval_requests
         SET status = 'rejected'
         WHERE id = $1::uuid
         RETURNING id, current_level, level_required`,
        [String(req.params.id)]
      );
      if (!result.rowCount) {
        throw new AppError(404, "NOT_FOUND", "Approval tidak ditemukan");
      }
      await (await getPool()).query(
        `INSERT INTO approval_steps
          (id, approval_request_id, step_level, approver_id, status, note, acted_at)
         VALUES ($1, $2::uuid, $3, $4::uuid, 'rejected', $5, NOW())`,
        [
          randomUUID(),
          String(req.params.id),
          result.rows[0].current_level,
          req.user?.sub ?? null,
          String(req.body.note ?? "")
        ]
      );
      res.json({
        success: true,
        data: {
          id: result.rows[0].id,
          currentLevel: result.rows[0].current_level,
          levelRequired: result.rows[0].level_required,
          status: "rejected"
        }
      });
      await logAudit({
        actorId: req.user?.sub,
        action: "approval.reject",
        moduleName: "approvals",
        entityId: result.rows[0].id,
        afterData: { status: "rejected" }
      });
    } catch (error) {
      next(error);
    }
  }
);

export { approvalRouter };
