import { randomUUID } from "node:crypto";
import { getPool } from "../../infrastructure/db/pool";
import { AppError } from "../../common/errors/app-error";

/**
 * Parse a JSON column value that may come back as either a string (SQLite)
 * or already-deserialized object (Postgres JSONB via pg driver).
 */
function parseJson<T = unknown>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}

/** Coerce 0/1/true/false to plain boolean. */
function toBool(value: unknown): boolean {
  return value === true || value === 1 || value === "1" || value === "true";
}

// ─── Site Settings (key/value JSON) ─────────────────────────────────────────

export interface SiteSetting {
  key: string;
  value: Record<string, unknown> | unknown[] | null;
  description: string | null;
  updatedAt: string;
}

export class CmsService {
  // ── Settings ────────────────────────────────────────────────────────────
  async listSettings(): Promise<SiteSetting[]> {
    const pool = await getPool();
    const result = await pool.query<{
      setting_key: string;
      value: unknown;
      description: string | null;
      updated_at: string;
    }>(`SELECT setting_key, value, description, updated_at FROM site_settings ORDER BY setting_key`);

    return result.rows.map((row) => ({
      key: row.setting_key,
      value: parseJson(row.value, null),
      description: row.description,
      updatedAt: String(row.updated_at)
    }));
  }

  async getSetting(key: string): Promise<SiteSetting | null> {
    const pool = await getPool();
    const result = await pool.query<{
      setting_key: string;
      value: unknown;
      description: string | null;
      updated_at: string;
    }>(
      `SELECT setting_key, value, description, updated_at FROM site_settings WHERE setting_key = $1`,
      [key]
    );
    if (!result.rowCount) return null;
    const row = result.rows[0];
    return {
      key: row.setting_key,
      value: parseJson(row.value, null),
      description: row.description,
      updatedAt: String(row.updated_at)
    };
  }

  async upsertSetting(
    key: string,
    value: unknown,
    description: string | null,
    userId: string | null
  ): Promise<SiteSetting> {
    const pool = await getPool();
    const json = JSON.stringify(value);
    // Use ON CONFLICT (works for both Postgres and SQLite ≥ 3.24).
    await pool.query(
      `INSERT INTO site_settings (setting_key, value, description, updated_by, updated_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       ON CONFLICT (setting_key) DO UPDATE
         SET value = EXCLUDED.value,
             description = COALESCE(EXCLUDED.description, site_settings.description),
             updated_by = EXCLUDED.updated_by,
             updated_at = CURRENT_TIMESTAMP`,
      [key, json, description, userId]
    );
    const updated = await this.getSetting(key);
    if (!updated) throw new AppError(500, "CMS_UPSERT_FAILED", "Setting tidak ditemukan setelah disimpan");
    return updated;
  }

  // ── Pages ───────────────────────────────────────────────────────────────
  async listPages(opts: { publishedOnly?: boolean } = {}) {
    const pool = await getPool();
    const where = opts.publishedOnly ? "WHERE is_published = 1 OR is_published = TRUE" : "";
    const result = await pool.query(
      `SELECT id, slug, title, content, meta_title, meta_description, og_image,
              is_published, published_at, created_at, updated_at
       FROM cms_pages
       ${where}
       ORDER BY updated_at DESC`
    );
    return result.rows.map((row: any) => this.mapPage(row));
  }

  async getPageBySlug(slug: string) {
    const pool = await getPool();
    const result = await pool.query(
      `SELECT id, slug, title, content, meta_title, meta_description, og_image,
              is_published, published_at, created_at, updated_at
       FROM cms_pages WHERE slug = $1`,
      [slug]
    );
    if (!result.rowCount) return null;
    return this.mapPage(result.rows[0]);
  }

  async getPageById(id: string) {
    const pool = await getPool();
    const result = await pool.query(
      `SELECT id, slug, title, content, meta_title, meta_description, og_image,
              is_published, published_at, created_at, updated_at
       FROM cms_pages WHERE id = $1`,
      [id]
    );
    if (!result.rowCount) return null;
    return this.mapPage(result.rows[0]);
  }

  async createPage(input: PageInput, userId: string | null) {
    const id = randomUUID();
    const pool = await getPool();
    await pool.query(
      `INSERT INTO cms_pages (id, slug, title, content, meta_title, meta_description, og_image,
                              is_published, published_at, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10)`,
      [
        id,
        input.slug,
        input.title,
        JSON.stringify(input.content ?? {}),
        input.metaTitle ?? null,
        input.metaDescription ?? null,
        input.ogImage ?? null,
        input.isPublished ? 1 : 0,
        input.isPublished ? new Date().toISOString() : null,
        userId
      ]
    );
    const page = await this.getPageById(id);
    if (!page) throw new AppError(500, "CMS_CREATE_FAILED", "Page tidak ditemukan setelah dibuat");
    return page;
  }

  async updatePage(id: string, input: PageInput, userId: string | null) {
    const existing = await this.getPageById(id);
    if (!existing) throw new AppError(404, "CMS_PAGE_NOT_FOUND", "Page tidak ditemukan");
    const willPublish = input.isPublished;
    const publishedAt =
      willPublish && !existing.isPublished
        ? new Date().toISOString()
        : willPublish
        ? existing.publishedAt
        : null;
    const pool = await getPool();
    await pool.query(
      `UPDATE cms_pages
         SET slug = $2,
             title = $3,
             content = $4,
             meta_title = $5,
             meta_description = $6,
             og_image = $7,
             is_published = $8,
             published_at = $9,
             updated_by = $10,
             updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [
        id,
        input.slug,
        input.title,
        JSON.stringify(input.content ?? {}),
        input.metaTitle ?? null,
        input.metaDescription ?? null,
        input.ogImage ?? null,
        willPublish ? 1 : 0,
        publishedAt,
        userId
      ]
    );
    const page = await this.getPageById(id);
    if (!page) throw new AppError(500, "CMS_UPDATE_FAILED", "Page tidak ditemukan setelah update");
    return page;
  }

  async deletePage(id: string) {
    const pool = await getPool();
    await pool.query(`DELETE FROM cms_pages WHERE id = $1`, [id]);
  }

  private mapPage(row: any) {
    return {
      id: String(row.id),
      slug: String(row.slug),
      title: String(row.title),
      content: parseJson(row.content, {}) as Record<string, unknown>,
      metaTitle: row.meta_title ?? null,
      metaDescription: row.meta_description ?? null,
      ogImage: row.og_image ?? null,
      isPublished: toBool(row.is_published),
      publishedAt: row.published_at ? String(row.published_at) : null,
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at)
    };
  }

  // ── Sections (keyed structured blocks) ──────────────────────────────────
  async listSections() {
    const pool = await getPool();
    const result = await pool.query(
      `SELECT id, section_key, title, subtitle, body, cta_text, cta_link, image_url,
              metadata, is_active, updated_at
       FROM cms_sections
       ORDER BY section_key`
    );
    return result.rows.map((row: any) => this.mapSection(row));
  }

  async getSection(key: string) {
    const pool = await getPool();
    const result = await pool.query(
      `SELECT id, section_key, title, subtitle, body, cta_text, cta_link, image_url,
              metadata, is_active, updated_at
       FROM cms_sections WHERE section_key = $1`,
      [key]
    );
    if (!result.rowCount) return null;
    return this.mapSection(result.rows[0]);
  }

  async upsertSection(key: string, input: SectionInput, userId: string | null) {
    const existing = await this.getSection(key);
    const pool = await getPool();
    if (existing) {
      await pool.query(
        `UPDATE cms_sections
            SET title = $2, subtitle = $3, body = $4,
                cta_text = $5, cta_link = $6, image_url = $7,
                metadata = $8, is_active = $9,
                updated_by = $10, updated_at = CURRENT_TIMESTAMP
          WHERE section_key = $1`,
        [
          key,
          input.title ?? null,
          input.subtitle ?? null,
          input.body ?? null,
          input.ctaText ?? null,
          input.ctaLink ?? null,
          input.imageUrl ?? null,
          JSON.stringify(input.metadata ?? {}),
          input.isActive === false ? 0 : 1,
          userId
        ]
      );
    } else {
      await pool.query(
        `INSERT INTO cms_sections
           (id, section_key, title, subtitle, body, cta_text, cta_link, image_url, metadata, is_active, updated_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          randomUUID(),
          key,
          input.title ?? null,
          input.subtitle ?? null,
          input.body ?? null,
          input.ctaText ?? null,
          input.ctaLink ?? null,
          input.imageUrl ?? null,
          JSON.stringify(input.metadata ?? {}),
          input.isActive === false ? 0 : 1,
          userId
        ]
      );
    }
    const updated = await this.getSection(key);
    if (!updated) throw new AppError(500, "CMS_UPSERT_FAILED", "Section tidak ditemukan setelah disimpan");
    return updated;
  }

  async deleteSection(key: string) {
    const pool = await getPool();
    await pool.query(`DELETE FROM cms_sections WHERE section_key = $1`, [key]);
  }

  private mapSection(row: any) {
    return {
      id: String(row.id),
      key: String(row.section_key),
      title: row.title ?? null,
      subtitle: row.subtitle ?? null,
      body: row.body ?? null,
      ctaText: row.cta_text ?? null,
      ctaLink: row.cta_link ?? null,
      imageUrl: row.image_url ?? null,
      metadata: parseJson(row.metadata, {}) as Record<string, unknown>,
      isActive: toBool(row.is_active),
      updatedAt: String(row.updated_at)
    };
  }

  // ── Navigation ──────────────────────────────────────────────────────────
  async listNavItems(opts: { activeOnly?: boolean } = {}) {
    const pool = await getPool();
    const where = opts.activeOnly ? "WHERE is_active = 1 OR is_active = TRUE" : "";
    const result = await pool.query(
      `SELECT id, label, href, parent_id, required_permission, required_role,
              sort_order, is_external, is_active
       FROM cms_nav_items
       ${where}
       ORDER BY COALESCE(parent_id, ''), sort_order, label`
    );
    return result.rows.map((row: any) => this.mapNavItem(row));
  }

  async createNavItem(input: NavItemInput) {
    const id = randomUUID();
    const pool = await getPool();
    await pool.query(
      `INSERT INTO cms_nav_items
         (id, label, href, parent_id, required_permission, required_role, sort_order, is_external, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        id,
        input.label,
        input.href,
        input.parentId ?? null,
        input.requiredPermission ?? null,
        input.requiredRole ?? null,
        input.sortOrder ?? 0,
        input.isExternal ? 1 : 0,
        input.isActive === false ? 0 : 1
      ]
    );
    return (await this.getNavItem(id))!;
  }

  async getNavItem(id: string) {
    const pool = await getPool();
    const result = await pool.query(
      `SELECT id, label, href, parent_id, required_permission, required_role,
              sort_order, is_external, is_active
       FROM cms_nav_items WHERE id = $1`,
      [id]
    );
    if (!result.rowCount) return null;
    return this.mapNavItem(result.rows[0]);
  }

  async updateNavItem(id: string, input: NavItemInput) {
    const existing = await this.getNavItem(id);
    if (!existing) throw new AppError(404, "CMS_NAV_NOT_FOUND", "Nav item tidak ditemukan");
    const pool = await getPool();
    await pool.query(
      `UPDATE cms_nav_items
          SET label = $2, href = $3, parent_id = $4,
              required_permission = $5, required_role = $6,
              sort_order = $7, is_external = $8, is_active = $9,
              updated_at = CURRENT_TIMESTAMP
        WHERE id = $1`,
      [
        id,
        input.label,
        input.href,
        input.parentId ?? null,
        input.requiredPermission ?? null,
        input.requiredRole ?? null,
        input.sortOrder ?? 0,
        input.isExternal ? 1 : 0,
        input.isActive === false ? 0 : 1
      ]
    );
    return (await this.getNavItem(id))!;
  }

  async deleteNavItem(id: string) {
    const pool = await getPool();
    await pool.query(`DELETE FROM cms_nav_items WHERE id = $1`, [id]);
  }

  async reorderNavItems(items: { id: string; sortOrder: number }[]) {
    const pool = await getPool();
    for (const item of items) {
      await pool.query(
        `UPDATE cms_nav_items SET sort_order = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [item.id, item.sortOrder]
      );
    }
    return this.listNavItems();
  }

  private mapNavItem(row: any) {
    return {
      id: String(row.id),
      label: String(row.label),
      href: String(row.href),
      parentId: row.parent_id ? String(row.parent_id) : null,
      requiredPermission: row.required_permission ?? null,
      requiredRole: row.required_role ?? null,
      sortOrder: Number(row.sort_order ?? 0),
      isExternal: toBool(row.is_external),
      isActive: toBool(row.is_active)
    };
  }

  // ── Media library ───────────────────────────────────────────────────────
  async listMedia() {
    const pool = await getPool();
    const result = await pool.query(
      `SELECT id, filename, storage_path, public_url, mime_type, size_bytes, alt_text, created_at
       FROM cms_media
       ORDER BY created_at DESC`
    );
    return result.rows.map((row: any) => this.mapMedia(row));
  }

  async createMedia(input: MediaInput, userId: string | null) {
    const id = randomUUID();
    const pool = await getPool();
    await pool.query(
      `INSERT INTO cms_media
         (id, filename, storage_path, public_url, mime_type, size_bytes, alt_text, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        id,
        input.filename,
        input.storagePath,
        input.publicUrl,
        input.mimeType ?? null,
        input.sizeBytes ?? 0,
        input.altText ?? null,
        userId
      ]
    );
    const result = await pool.query(
      `SELECT id, filename, storage_path, public_url, mime_type, size_bytes, alt_text, created_at
       FROM cms_media WHERE id = $1`,
      [id]
    );
    return this.mapMedia(result.rows[0]);
  }

  async deleteMedia(id: string) {
    const pool = await getPool();
    await pool.query(`DELETE FROM cms_media WHERE id = $1`, [id]);
  }

  private mapMedia(row: any) {
    return {
      id: String(row.id),
      filename: String(row.filename),
      storagePath: String(row.storage_path),
      publicUrl: String(row.public_url),
      mimeType: row.mime_type ?? null,
      sizeBytes: Number(row.size_bytes ?? 0),
      altText: row.alt_text ?? null,
      createdAt: String(row.created_at)
    };
  }
}

export interface PageInput {
  slug: string;
  title: string;
  content: Record<string, unknown>;
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogImage?: string | null;
  isPublished?: boolean;
}

export interface SectionInput {
  title?: string | null;
  subtitle?: string | null;
  body?: string | null;
  ctaText?: string | null;
  ctaLink?: string | null;
  imageUrl?: string | null;
  metadata?: Record<string, unknown>;
  isActive?: boolean;
}

export interface NavItemInput {
  label: string;
  href: string;
  parentId?: string | null;
  requiredPermission?: string | null;
  requiredRole?: string | null;
  sortOrder?: number;
  isExternal?: boolean;
  isActive?: boolean;
}

export interface MediaInput {
  filename: string;
  storagePath: string;
  publicUrl: string;
  mimeType?: string | null;
  sizeBytes?: number;
  altText?: string | null;
}
