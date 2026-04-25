import { Pool } from "pg";
import { Database } from "sqlite3";
import { open } from "sqlite";

let sharedPool: Pool | null = null;
let sqliteDb: any = null;

export type DbQueryResult<Row = any> = { rows: Row[]; rowCount: number };
export type DbClient = {
  query: <Row = any>(sql: string, params?: any[]) => Promise<DbQueryResult<Row>>;
  end: () => Promise<void>;
  connect?: () => Promise<{ query: DbClient["query"]; release: () => void }>;
};

export async function getPool(): Promise<DbClient> {
  const connectionString = process.env.DATABASE_URL;
  const useSqlite = !connectionString || connectionString.includes("localhost:5432");

  if (useSqlite) {
    console.log("Using SQLite for local development");
    const db = await getSqliteDb();
    return {
      async query(sql: string, params?: any[]) {
        const normalized = sql.replace(/\$\d+/g, "?");
        const head = normalized.trim().toUpperCase();
        if (head.startsWith("SELECT") || head.startsWith("WITH") || head.startsWith("PRAGMA")) {
          const rows = await db.all(normalized, params ?? []);
          return { rows, rowCount: rows.length };
        }
        const result = await db.run(normalized, params ?? []);
        return { rows: [], rowCount: Number(result?.changes ?? 0) };
      },
      async end() {
        try {
          await db.close();
        } catch {
          // ignore
        }
      }
    };
  }

  if (!sharedPool) {
    sharedPool = new Pool({ connectionString });
  }

  const pool = sharedPool;
  return {
    async query<Row = any>(sql: string, params?: any[]) {
      const result = await pool.query(sql, params);
      return { rows: result.rows as Row[], rowCount: Number(result.rowCount ?? result.rows.length ?? 0) };
    },
    async end() {
      await pool.end();
    },
    async connect() {
      const client = await pool.connect();
      return {
        async query<Row = any>(sql: string, params?: any[]) {
          const result = await client.query(sql, params);
          return { rows: result.rows as Row[], rowCount: Number(result.rowCount ?? result.rows.length ?? 0) };
        },
        release() {
          client.release();
        }
      };
    }
  };
}

async function getSqliteDb() {
  if (!sqliteDb) {
    sqliteDb = await open({
      filename: './erp.db',
      driver: Database
    });
    
    // Create basic schema for testing
    await createTestSchema();
  }
  return sqliteDb;
}

async function createTestSchema() {
  const db = await getSqliteDb();
  
  // Create users table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      division TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Create test user if not exists
  const existingUser = await db.get("SELECT * FROM users WHERE email = 'admin@erp.com'");
  if (!existingUser) {
    const crypto = require('crypto');
    const passwordHash = crypto.createHash('sha256').update('admin123').digest('hex');
    
    await db.run(`
      INSERT INTO users (id, email, password_hash, full_name, division) 
      VALUES (?, ?, ?, ?, ?)
    `, ['admin-id', 'admin@erp.com', passwordHash, 'Admin User', 'IT']);
  }
}

export async function pingDatabase() {
  try {
    const db = await getPool();
    await db.query("SELECT 1");
  } catch (error) {
    console.error("Database ping failed:", error);
    throw error;
  }
}
