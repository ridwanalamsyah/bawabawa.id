import { Router } from "express";
import { z } from "zod";
import { authGuard } from "../../common/middleware/auth";
import { getPool } from "../../infrastructure/db/pool";

const erpRouter = Router();

const syncSchema = z.object({
  tenant: z.string().optional(),
  ops: z.array(
    z.object({
      id: z.string(),
      eventType: z.string(),
      payload: z.unknown(),
      ts: z.string().optional(),
      retries: z.number().optional(),
      status: z.string().optional()
    })
  )
});

let didEnsureTable = false;
async function ensureSyncTable() {
  if (didEnsureTable) return;
  didEnsureTable = true;
  const db = await getPool();
  // Portable schema (works on Postgres & SQLite)
  await db.query(
    `CREATE TABLE IF NOT EXISTS erp_sync_ops (
      id TEXT PRIMARY KEY,
      tenant TEXT,
      event_type TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      actor_id TEXT,
      client_ts TEXT,
      received_at TEXT NOT NULL
    )`
  );
}

// Minimal sync endpoint for the ERP client.
// In production, you can extend this to persist ops and/or return server state.
erpRouter.post("/sync", authGuard, async (req, res, next) => {
  try {
    const body = syncSchema.parse(req.body);
    await ensureSyncTable();

    const db = await getPool();
    const actorId = String(req.user?.sub ?? "");
    const receivedAt = new Date().toISOString();

    for (const op of body.ops) {
      await db.query(
        `INSERT INTO erp_sync_ops (id, tenant, event_type, payload_json, actor_id, client_ts, received_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT(id) DO NOTHING`,
        [
          op.id,
          body.tenant ?? null,
          op.eventType,
          JSON.stringify(op.payload ?? null),
          actorId || null,
          op.ts ?? null,
          receivedAt
        ]
      );
    }

    res.json({
      success: true,
      data: {
        applied: body.ops.length,
        tenant: body.tenant ?? null
      }
    });
  } catch (error) {
    next(error);
  }
});

export { erpRouter };

