import { randomUUID } from "node:crypto";
import { getPool } from "../../infrastructure/db/pool";

type CustomRole = {
  id: string;
  code: string;
  division: "sales" | "gudang" | "admin" | "koordinator";
  branchId: string;
  permissions: string[];
};

export class RbacService {
  async createCustomRole(role: Omit<CustomRole, "id">, createdBy?: string) {
    const id = randomUUID();
    await (await getPool()).query(
      `INSERT INTO custom_roles (id, code, division, branch_id, permissions, created_by)
       VALUES ($1, $2, $3, $4::uuid, $5::jsonb, $6::uuid)`,
      [
        id,
        role.code,
        role.division,
        role.branchId,
        JSON.stringify(role.permissions),
        createdBy ?? null
      ]
    );
    return { id, ...role };
  }

  async listCustomRoles() {
    const rows = await (await getPool()).query<{
      id: string;
      code: string;
      division: "sales" | "gudang" | "admin" | "koordinator";
      branch_id: string;
      permissions: string[];
    }>(
      `SELECT id, code, division, branch_id, permissions
       FROM custom_roles
       ORDER BY created_at DESC`
    );
    return rows.rows.map((row) => ({
      id: row.id,
      code: row.code,
      division: row.division,
      branchId: row.branch_id,
      permissions: row.permissions
    }));
  }
}
