import { Router } from "express";
import { authGuard } from "../../common/middleware/auth";
import { getPool } from "../../infrastructure/db/pool";

/**
 * Minimal branches lookup endpoint. The admin manual-order form needs a
 * branch dropdown; this returns the rows we already have in `branches`
 * so the form can populate. Authed (we don't want random scrapers
 * listing internal branch codes), but no special permission required —
 * any logged-in admin user can read it.
 */
export const branchesRouter = Router();

branchesRouter.get("/", authGuard, async (_req, res, next) => {
  try {
    const db = await getPool();
    const result = await db.query<{ id: string; code: string; name: string }>(
      "SELECT id, code, name FROM branches ORDER BY name ASC"
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
});
