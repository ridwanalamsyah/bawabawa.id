import { Pool } from "pg";

/**
 * Vitest global setup. Runs ONCE per test run (before workers start)
 * and exits before any test file is imported.
 *
 * Responsibilities:
 *   1. Lock in JWT_ACCESS_SECRET so tokens signed inside test files
 *      verify against the secret captured by `auth.ts` at module load.
 *   2. If DATABASE_URL points at a real Postgres, run the additive DDL
 *      the PR #49–52 suites depend on. Doing it here (single-process)
 *      avoids the `pg_type_typname_nsp_index` race that hits when each
 *      vitest worker tries to CREATE TYPE concurrently.
 */
const DDL = [
  `CREATE TABLE IF NOT EXISTS customers (
     id UUID PRIMARY KEY,
     name TEXT NOT NULL,
     phone TEXT,
     branch_id UUID,
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   )`,
  `CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone)`,

  `CREATE TABLE IF NOT EXISTS orders (
     id UUID PRIMARY KEY,
     customer_id UUID,
     branch_id UUID,
     order_number TEXT UNIQUE NOT NULL,
     status TEXT NOT NULL DEFAULT 'draft',
     payment_status TEXT NOT NULL DEFAULT 'pending',
     subtotal NUMERIC NOT NULL DEFAULT 0,
     discount_amount NUMERIC,
     total_amount NUMERIC NOT NULL DEFAULT 0,
     idempotency_key TEXT UNIQUE NOT NULL,
     source_channel VARCHAR(20) NOT NULL DEFAULT 'web',
     notes TEXT,
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   )`,
  `CREATE INDEX IF NOT EXISTS idx_orders_source_channel ON orders(source_channel)`,

  `CREATE TABLE IF NOT EXISTS vouchers (
     id UUID PRIMARY KEY,
     code TEXT UNIQUE NOT NULL,
     description TEXT,
     discount_type TEXT NOT NULL,
     discount_value NUMERIC NOT NULL,
     max_discount NUMERIC,
     min_order_amount NUMERIC NOT NULL DEFAULT 0,
     max_uses INTEGER,
     per_user_limit INTEGER,
     starts_at TIMESTAMPTZ,
     ends_at TIMESTAMPTZ,
     is_active BOOLEAN NOT NULL DEFAULT TRUE,
     is_public BOOLEAN NOT NULL DEFAULT FALSE,
     banner_label VARCHAR(120),
     banner_priority INTEGER NOT NULL DEFAULT 0,
     used_count INTEGER NOT NULL DEFAULT 0,
     created_by UUID,
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   )`,

  `CREATE TABLE IF NOT EXISTS voucher_redemptions (
     id UUID PRIMARY KEY,
     voucher_id UUID NOT NULL,
     order_id UUID NOT NULL,
     customer_id UUID,
     discount_applied NUMERIC NOT NULL,
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   )`,

  `CREATE TABLE IF NOT EXISTS blog_posts (
     id UUID PRIMARY KEY,
     slug VARCHAR(160) NOT NULL UNIQUE,
     title VARCHAR(240) NOT NULL,
     excerpt VARCHAR(500),
     content_md TEXT NOT NULL,
     category VARCHAR(80),
     read_time VARCHAR(20),
     hero_image_url TEXT,
     is_published BOOLEAN NOT NULL DEFAULT FALSE,
     published_at TIMESTAMPTZ,
     created_by UUID,
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   )`,

  `CREATE TABLE IF NOT EXISTS testimonials (
     id UUID PRIMARY KEY,
     customer_name TEXT NOT NULL,
     city TEXT,
     rating INTEGER NOT NULL DEFAULT 5,
     body TEXT NOT NULL,
     avatar_url TEXT,
     is_verified BOOLEAN NOT NULL DEFAULT FALSE,
     is_published BOOLEAN NOT NULL DEFAULT FALSE,
     published_at TIMESTAMPTZ,
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   )`,

  `CREATE TABLE IF NOT EXISTS audit_logs (
     id UUID PRIMARY KEY,
     actor_id UUID,
     action TEXT NOT NULL,
     module_name TEXT,
     entity_id UUID,
     before_data JSONB,
     after_data JSONB,
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   )`,

  // Idempotency middleware table (used by `idempotency.integration.test.ts`).
  `CREATE TABLE IF NOT EXISTS idempotent_responses (
     id SERIAL PRIMARY KEY,
     actor_id TEXT,
     idempotency_key TEXT NOT NULL,
     request_body_hash TEXT NOT NULL,
     response_status INTEGER NOT NULL,
     response_body JSONB NOT NULL,
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   )`
];

export default async function setup() {
  if (!process.env.JWT_ACCESS_SECRET) {
    process.env.JWT_ACCESS_SECRET = "test-JWT_ACCESS_SECRET";
  }
  process.env.NODE_ENV = "test";

  const connectionString = process.env.DATABASE_URL;
  // Mirror the pool.ts heuristic — only seed schema if we're actually
  // pointing at a Postgres, not SQLite.
  if (!connectionString || connectionString.includes("localhost:5432")) {
    return;
  }

  const pool = new Pool({ connectionString });
  try {
    for (const stmt of DDL) {
      await pool.query(stmt);
    }
  } finally {
    await pool.end();
  }
}
