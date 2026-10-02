import { randomUUID } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { authGuard, requirePermission } from "../../common/middleware/auth";
import { AppError } from "../../common/errors/app-error";
import { getPool } from "../../infrastructure/db/pool";
import { logAudit } from "../../common/audit/audit-log";

type ProductRow = {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  image_url: string | null;
  origin_store: string | null;
  unit_price: string;
  weight_kg: string | null;
  catalog_category: string | null;
  variants: unknown;
  trip_id: string | null;
  is_catalog: boolean;
  catalog_sort: number;
  current_stock: number;
};

const PRODUCT_COLUMNS = `id, sku, name, description, image_url, origin_store, unit_price, weight_kg,
  catalog_category, variants, trip_id, is_catalog, catalog_sort, current_stock`;

function toProduct(row: ProductRow) {
  const variants = typeof row.variants === "string" ? JSON.parse(row.variants) : row.variants;
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    description: row.description,
    imageUrl: row.image_url,
    originStore: row.origin_store,
    price: Number(row.unit_price),
    weightKg: row.weight_kg == null ? null : Number(row.weight_kg),
    category: row.catalog_category,
    variants: Array.isArray(variants) ? variants : [],
    tripId: row.trip_id,
    isCatalog: Boolean(row.is_catalog),
    sort: row.catalog_sort,
    stock: row.current_stock
  };
}

/**
 * GET /api/v1/catalog — public catalog of fixed-price items. Optional
 * `?tripId=` narrows to products attached to that trip (plus evergreen
 * items with no trip). Never 5xx: an empty list lets the site fall back to
 * the free-form request flow.
 */
export const publicCatalogRouter = Router();
publicCatalogRouter.get("/", async (req, res) => {
  try {
    const tripId = z.string().uuid().optional().safeParse(req.query.tripId || undefined);
    const params: unknown[] = [];
    let tripFilter = "";
    if (tripId.success && tripId.data) {
      params.push(tripId.data);
      tripFilter = `AND (trip_id IS NULL OR trip_id = $1)`;
    }
    const { rows } = await (await getPool()).query<ProductRow>(
      `SELECT ${PRODUCT_COLUMNS}
         FROM products
        WHERE is_catalog = TRUE ${tripFilter}
        ORDER BY catalog_sort DESC, created_at DESC
        LIMIT 200`,
      params
    );
    res.json({ success: true, data: rows.map(toProduct) });
  } catch {
    res.json({ success: true, data: [] });
  }
});

const productSchema = z.object({
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(2000).nullable().optional(),
  imageUrl: z.string().url().max(500).nullable().optional(),
  originStore: z.string().trim().max(120).nullable().optional(),
  price: z.number().int().min(0).max(1_000_000_000),
  weightKg: z.number().min(0.05).max(100).nullable().optional(),
  category: z.string().trim().max(60).nullable().optional(),
  variants: z.array(z.string().trim().min(1).max(60)).max(30).optional(),
  tripId: z.string().uuid().nullable().optional(),
  isCatalog: z.boolean().optional(),
  sort: z.number().int().min(0).max(10_000).optional()
});

export const adminCatalogRouter = Router();

adminCatalogRouter.get("/", authGuard, requirePermission("inventory:manage"), async (_req, res, next) => {
  try {
    const { rows } = await (await getPool()).query<ProductRow>(
      `SELECT ${PRODUCT_COLUMNS} FROM products ORDER BY is_catalog DESC, catalog_sort DESC, created_at DESC LIMIT 500`
    );
    res.json({ success: true, data: rows.map(toProduct) });
  } catch (error) {
    next(error);
  }
});

adminCatalogRouter.post("/", authGuard, requirePermission("inventory:manage"), async (req, res, next) => {
  try {
    const body = productSchema.parse(req.body);
    const id = randomUUID();
    const sku = `CAT-${id.slice(0, 8).toUpperCase()}`;
    const { rows } = await (await getPool()).query<ProductRow>(
      `INSERT INTO products
         (id, sku, name, description, image_url, origin_store, unit_price, current_stock,
          weight_kg, catalog_category, variants, trip_id, is_catalog, catalog_sort)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8, $9, $10::jsonb, $11, $12, $13)
       RETURNING ${PRODUCT_COLUMNS}`,
      [
        id,
        sku,
        body.name,
        body.description ?? null,
        body.imageUrl ?? null,
        body.originStore ?? null,
        body.price,
        body.weightKg ?? null,
        body.category ?? null,
        JSON.stringify(body.variants ?? []),
        body.tripId ?? null,
        body.isCatalog ?? true,
        body.sort ?? 0
      ]
    );
    await logAudit({ actorId: req.user?.sub, action: "catalog.create", moduleName: "inventory", entityId: id, afterData: body });
    res.status(201).json({ success: true, data: toProduct(rows[0]) });
  } catch (error) {
    next(error);
  }
});

adminCatalogRouter.patch("/:id", authGuard, requirePermission("inventory:manage"), async (req, res, next) => {
  try {
    const id = z.string().uuid().parse(req.params.id);
    const body = productSchema.partial().parse(req.body);
    const columns: Record<string, [string, unknown]> = {
      name: ["name", body.name],
      description: ["description", body.description],
      imageUrl: ["image_url", body.imageUrl],
      originStore: ["origin_store", body.originStore],
      price: ["unit_price", body.price],
      weightKg: ["weight_kg", body.weightKg],
      category: ["catalog_category", body.category],
      variants: ["variants", body.variants === undefined ? undefined : JSON.stringify(body.variants)],
      tripId: ["trip_id", body.tripId],
      isCatalog: ["is_catalog", body.isCatalog],
      sort: ["catalog_sort", body.sort]
    };
    const sets: string[] = [];
    const values: unknown[] = [];
    for (const [column, value] of Object.values(columns)) {
      if (value === undefined) continue;
      values.push(value);
      sets.push(`${column} = $${values.length}${column === "variants" ? "::jsonb" : ""}`);
    }
    if (!sets.length) throw new AppError(422, "NO_FIELDS", "Tidak ada field yang diubah");
    values.push(id);
    const { rows } = await (await getPool()).query<ProductRow>(
      `UPDATE products SET ${sets.join(", ")} WHERE id = $${values.length} RETURNING ${PRODUCT_COLUMNS}`,
      values
    );
    if (!rows[0]) throw new AppError(404, "PRODUCT_NOT_FOUND", "Produk tidak ditemukan");
    await logAudit({ actorId: req.user?.sub, action: "catalog.update", moduleName: "inventory", entityId: id, afterData: body });
    res.json({ success: true, data: toProduct(rows[0]) });
  } catch (error) {
    next(error);
  }
});
