import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { getPool } from "./pool";
import { withTransaction } from "./transaction-manager";

async function ensureMigrationsTable() {
  await (await getPool()).query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      file_name VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function runMigrations() {
  await ensureMigrationsTable();
  const legacyInitFile = path.join(__dirname, "001_init_schema.sql");
  const migrationsDir = path.join(__dirname, "migrations");
  const files = (await readdir(migrationsDir))
    .filter((file) => file.endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b))
    .map((file) => ({ file, absolutePath: path.join(migrationsDir, file) }));

  files.unshift({
    file: "001_init_schema.sql",
    absolutePath: legacyInitFile
  });

  for (const migration of files) {
    const file = migration.file;
    const existing = await (await getPool()).query(
      "SELECT 1 FROM schema_migrations WHERE file_name = $1",
      [file]
    );
    if (existing.rowCount) continue;

    const sql = await readFile(migration.absolutePath, "utf8");
    await withTransaction(async (client) => {
      await client.query(sql);
      await client.query(
        "INSERT INTO schema_migrations (file_name) VALUES ($1)",
        [file]
      );
    });
    // eslint-disable-next-line no-console
    console.log(`Applied migration: ${file}`);
  }
}

runMigrations()
  .then(async () => {
    await (await getPool()).end();
  })
  .catch(async (error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    await (await getPool()).end();
    process.exit(1);
  });
