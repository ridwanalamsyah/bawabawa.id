import { Router } from "express";
import { authGuard, requirePermission } from "../../common/middleware/auth";
import { z } from "zod";
import { RbacService } from "./rbac.service";

const rbacRouter = Router();
const service = new RbacService();

rbacRouter.get("/me/permissions", authGuard, async (req, res) => {
  res.json({
    success: true,
    data: {
      userId: req.user?.sub,
      roles: req.user?.roles ?? [],
      permissions: req.user?.permissions ?? []
    }
  });
});

rbacRouter.post(
  "/roles/custom",
  authGuard,
  requirePermission("users:manage_users"),
  async (req, res, next) => {
    const input = z
      .object({
        code: z.string().min(2),
        division: z.enum(["sales", "gudang", "admin", "koordinator"]),
        branchId: z.string().min(1),
        permissions: z.array(z.string()).min(1)
      })
      .parse(req.body);
    try {
      const role = await service.createCustomRole(input, req.user?.sub);
      res.status(201).json({
        success: true,
        data: role
      });
    } catch (error) {
      next(error);
    }
  }
);

rbacRouter.get(
  "/roles/custom",
  authGuard,
  requirePermission("users:manage_users"),
  async (_req, res, next) => {
    try {
      res.json({ success: true, data: await service.listCustomRoles() });
    } catch (error) {
      next(error);
    }
  }
);

export { rbacRouter };
