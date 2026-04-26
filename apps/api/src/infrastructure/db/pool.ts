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

  // CMS tables (mirror migrations/004_cms.sql with SQLite-compatible types).
  await db.exec(`
    CREATE TABLE IF NOT EXISTS site_settings (
      setting_key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      description TEXT,
      updated_by TEXT,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cms_pages (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '{}',
      meta_title TEXT,
      meta_description TEXT,
      og_image TEXT,
      is_published INTEGER NOT NULL DEFAULT 0,
      published_at DATETIME,
      created_by TEXT,
      updated_by TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cms_sections (
      id TEXT PRIMARY KEY,
      section_key TEXT UNIQUE NOT NULL,
      title TEXT,
      subtitle TEXT,
      body TEXT,
      cta_text TEXT,
      cta_link TEXT,
      image_url TEXT,
      metadata TEXT NOT NULL DEFAULT '{}',
      is_active INTEGER NOT NULL DEFAULT 1,
      updated_by TEXT,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cms_nav_items (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      href TEXT NOT NULL,
      parent_id TEXT,
      required_permission TEXT,
      required_role TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_external INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cms_media (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      storage_path TEXT NOT NULL,
      public_url TEXT NOT NULL,
      mime_type TEXT,
      size_bytes INTEGER NOT NULL DEFAULT 0,
      alt_text TEXT,
      uploaded_by TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await seedCmsDefaults(db);
}

async function seedCmsDefaults(db: any) {
  const crypto = require('crypto');
  const defaults: { key: string; value: unknown; description: string }[] = [
    {
      key: 'brand',
      value: {
        name: 'bawabawa.id',
        shortName: 'bawabawa.id',
        tagline: 'Sistem Manajemen Bisnis Terpadu',
        monogram: 'BW',
        logoUrl: null,
        primaryColor: '#7c9885',
        accentColor: '#d4a373'
      },
      description: 'Brand identity (name, monogram, colors).'
    },
    {
      key: 'contact',
      value: {
        email: 'halo@bawabawa.id',
        phone: '+62 812-0000-0000',
        address: 'Jakarta, Indonesia',
        supportHours: 'Senin – Jumat · 09:00 – 18:00 WIB'
      },
      description: 'Public contact information.'
    },
    {
      key: 'social',
      value: {
        instagram: 'https://instagram.com/bawabawa.id',
        linkedin: 'https://www.linkedin.com/company/bawabawa-id',
        twitter: null,
        youtube: null
      },
      description: 'Public social profile links.'
    },
    {
      key: 'seo',
      value: {
        defaultTitle: 'bawabawa.id — Enterprise Resource Planning',
        defaultDescription:
          'Platform ERP modular untuk operasi sales, finance, inventory, procurement, dan HR di satu kanvas.',
        ogImage: null,
        twitterCard: 'summary_large_image'
      },
      description: 'Defaults for <head> meta tags and Open Graph.'
    },
    {
      key: 'feature_flags',
      value: {
        enableDarkMode: true,
        enableMobileMenu: true,
        showWelcomeToast: true
      },
      description: 'Runtime feature flags.'
    }
  ];

  for (const setting of defaults) {
    await db.run(
      `INSERT OR IGNORE INTO site_settings (setting_key, value, description) VALUES (?, ?, ?)`,
      [setting.key, JSON.stringify(setting.value), setting.description]
    );
  }

  const existingNav = await db.get('SELECT COUNT(1) AS n FROM cms_nav_items');
  if (!existingNav || Number(existingNav.n) === 0) {
    const links = [
      ['Dashboard', '/', null, 10],
      ['Sales', '/sales', null, 20],
      ['Orders', '/orders', 'orders:read', 30],
      ['Inventory', '/inventory', null, 40],
      ['Procurement', '/procurement', null, 50],
      ['Finance', '/finance', 'finance:manage_finance', 60],
      ['CRM', '/crm', null, 70],
      ['HR', '/hr', null, 80],
      ['Admin', '/admin', 'users:manage_users', 90]
    ] as const;
    for (const [label, href, perm, order] of links) {
      await db.run(
        `INSERT INTO cms_nav_items (id, label, href, required_permission, sort_order)
         VALUES (?, ?, ?, ?, ?)`,
        [crypto.randomUUID(), label, href, perm, order]
      );
    }
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
