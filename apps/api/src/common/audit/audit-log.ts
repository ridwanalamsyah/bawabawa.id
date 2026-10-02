import { randomUUID } from "node:crypto";
import { getPool } from "../../infrastructure/db/pool";

/**
 * Best-effort: every caller writes the audit row *after* its mutation has
 * committed, so letting an audit failure (e.g. a stale actor id) bubble up
 * would turn a successful change into a 500 and invite duplicate retries.
 */
export async function logAudit(input: {
  actorId?: string;
  action: string;
  moduleName: string;
  entityId?: string;
  beforeData?: unknown;
  afterData?: unknown;
}) {
  try {
    await (await getPool()).query(
      `INSERT INTO audit_logs
        (id, actor_id, action, module_name, entity_id, before_data, after_data)
       VALUES ($1, $2::uuid, $3, $4, $5::uuid, $6::jsonb, $7::jsonb)`,
      [
        randomUUID(),
        input.actorId ?? null,
        input.action,
        input.moduleName,
        input.entityId ?? null,
        input.beforeData ? JSON.stringify(input.beforeData) : null,
        input.afterData ? JSON.stringify(input.afterData) : null
      ]
    );
  } catch (error) {
    console.error("[audit] failed to record", input.action, error);
  }
}
