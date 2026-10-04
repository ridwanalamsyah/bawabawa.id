import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { getPool } from "./pool";

// Arbitrary constant so concurrent instances never run migrations at once.
const MIGRATION_LOCK_KEY = 7_204_331;

/** Every migration file in apply order (legacy init schema first). */
async function migrationFiles() {
  const migrationsDir = path.join(__dirname, "migrations");
  const files = (await readdir(migrationsDir))
    .filter((file) => file.endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b))
    .map((file) => ({ file, absolutePath: path.join(migrationsDir, file) }));
  files.unshift({ file: "001_init_schema.sql", absolutePath: path.join(__dirname, "001_init_schema.sql") });
  return files;
}

/**
 * Applies pending migrations in order, each in its own transaction, under a
 * Postgres advisory lock. Returns the files applied. No-op on the SQLite dev
 * adapter, which builds its own schema.
 */
export async function runMigrations(log: (msg: string) => void = () => {}): Promise<string[]> {
  const pool = await getPool();
  if (!pool.connect) return [];
  const client = await pool.connect();
  const applied: string[] = [];
  try {
    await client.query("SELECT pg_advisory_lock($1)", [MIGRATION_LOCK_KEY]);
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        file_name VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    const done = new Set(
      (await client.query<{ file_name: string }>("SELECT file_name FROM schema_migrations")).rows.map((r) => r.file_name)
    );
    for (const { file, absolutePath } of await migrationFiles()) {
      if (done.has(file)) continue;
      const sql = await readFile(absolutePath, "utf8");
      try {
        await client.query("BEGIN");
        await client.query(sql);
        await client.query("INSERT INTO schema_migrations (file_name) VALUES ($1)", [file]);
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK").catch(() => {});
        throw new Error(`Migration ${file} failed: ${error instanceof Error ? error.message : String(error)}`);
      }
      applied.push(file);
      log(`Applied migration: ${file}`);
    }
    return applied;
  } finally {
    await client.query("SELECT pg_advisory_unlock($1)", [MIGRATION_LOCK_KEY]).catch(() => {});
    client.release();
  }
}

let pending: Promise<void> | null = null;

/**
 * Brings the database schema up to date once per process, so a deploy never
 * runs new code against an old schema. Failures are logged (the app keeps
 * serving) and retried after a minute. Disable with AUTO_MIGRATE=false.
 */
export function ensureSchema(): Promise<void> {
  if (process.env.AUTO_MIGRATE === "false" || process.env.NODE_ENV === "test") return Promise.resolve();
  if (!pending) {
    pending = runMigrations((msg) => console.log(`[auto-migrate] ${msg}`))
      .then(() => undefined)
      .catch((error) => {
        console.error("[auto-migrate] failed", error);
        setTimeout(() => {
          pending = null;
        }, 60_000).unref?.();
      });
  }
  return pending;
}
