import { getPool } from "../../infrastructure/db/pool";

/**
 * Mirrors the heuristic in `infrastructure/db/pool.ts`: a real Postgres
 * is in use only if DATABASE_URL is set and does NOT point to the local
 * dev placeholder.
 *
 * Tests that exercise PR #49–52 endpoints need a real Postgres because:
 *   - blog/voucher routes rely on BOOLEAN columns (SQLite stores them
 *     as INTEGER and `WHERE is_published = TRUE` 5xx-s).
 *   - blog PATCH uses `RETURNING id`; the SQLite driver in `pool.ts`
 *     returns rowCount only, so `result.rows[0]` is undefined.
 *
 * When this returns false, the suites `describe.skipIf(!hasPostgres)`
 * themselves out so `npm run test` still passes with zero extra setup;
 * `npm run test:integration` is the opt-in entry point that boots
 * Postgres + sets DATABASE_URL.
 */
export const hasPostgres =
  !!process.env.DATABASE_URL &&
  !process.env.DATABASE_URL.includes("localhost:5432");

/**
 * Schema is created once by `helpers/global-setup.ts` before any vitest
 * worker starts. This stays as a no-op so test files keep the explicit
 * beforeAll without worrying about the wiring.
 */
export async function ensureSchema() {
  // intentional noop — global setup handles it
}

/**
 * Wipe rows the PR #49–52 suites touch. Tolerant if a table doesn't
 * yet exist (test runner spun up against a fresh DB or against SQLite
 * where these suites would skip anyway).
 */
export async function resetData() {
  if (!hasPostgres) return;
  const db = await getPool();
  const tables = [
    "blog_posts",
    "voucher_redemptions",
    "vouchers",
    "orders",
    "customers",
    "testimonials",
    "audit_logs"
  ];
  try {
    await db.query(
      `TRUNCATE TABLE ${tables.join(", ")} RESTART IDENTITY CASCADE`
    );
  } catch {
    for (const t of tables) {
      try {
        await db.query(`DELETE FROM ${t}`);
      } catch {
        /* table may not exist on this backend */
      }
    }
  }
}
