import { Router } from "express";
import { z } from "zod";
import { randomUUID } from "crypto";
import { authGuard, requirePermission } from "../../common/middleware/auth";
import { logAudit } from "../../common/audit/audit-log";
import { getPool } from "../../infrastructure/db/pool";
import { AppError } from "../../common/errors/app-error";

/**
 * Trips (Open Trip) routes split in two:
 *   - publicTripsRouter mounted at `/trips` — unauthed GETs of published,
 *     non-closed trips. Used by the marketing /open-trip page.
 *   - adminTripsRouter mounted at `/admin/trips` — CRUD, gated by
 *     `cms:manage` permission (same as blog/cms editing).
 *
 * Mock trips on the site previously implied an automatic schedule. With
 * this module the admin owns the schedule explicitly: nothing appears
 * on /open-trip until they create + publish a trip.
 */

const codeRegex = /^[A-Z0-9-]{4,40}$/;

type TripRow = {
  id: string;
  code: string;
  origin: string;
  destination: string;
  depart_at: string;
  arrive_estimate_at: string | null;
  capacity_kg: number;
  booked_kg: number;
  base_fee: string | number;
  per_kg_fee: string | number;
  status: string;
  popular_categories: string[] | null;
  notes: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

function rowToDto(row: TripRow) {
  return {
    id: row.id,
    code: row.code,
    origin: row.origin,
    destination: row.destination,
    departAt: row.depart_at,
    arriveEstimateAt: row.arrive_estimate_at,
    capacityKg: row.capacity_kg,
    bookedKg: row.booked_kg,
    baseFee: Number(row.base_fee),
    perKgFee: Number(row.per_kg_fee),
    status: row.status,
    popularCategories: row.popular_categories ?? [],
    notes: row.notes,
    isPublished: row.is_published,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ─── Public ─────────────────────────────────────────────────────────────────
export const publicTripsRouter = Router();

publicTripsRouter.get("/", async (_req, res) => {
  try {
    const db = await getPool();
    const result = await db.query<TripRow>(
      `SELECT id, code, origin, destination, depart_at, arrive_estimate_at,
              capacity_kg, booked_kg, base_fee, per_kg_fee, status,
              popular_categories, notes, is_published, created_at, updated_at
         FROM trips
        WHERE is_published = TRUE AND status <> 'closed'
        ORDER BY depart_at ASC
        LIMIT 24`
    );
    res.json({ success: true, data: result.rows.map(rowToDto) });
  } catch {
    // Marketing site reads this — never 5xx, degrade to empty list.
    res.json({ success: true, data: [] });
  }
});

// ─── Admin ──────────────────────────────────────────────────────────────────
export const adminTripsRouter = Router();

const tripInput = z.object({
  code: z.string().regex(codeRegex, "Kode trip hanya A-Z, 0-9, dan -"),
  origin: z.string().min(2).max(80),
  destination: z.string().min(2).max(80),
  departAt: z.string().datetime(),
  arriveEstimateAt: z.string().datetime().nullable().optional(),
  capacityKg: z.number().int().min(0).max(10000),
  bookedKg: z.number().int().min(0).max(10000).optional(),
  baseFee: z.number().min(0).optional(),
  perKgFee: z.number().min(0).optional(),
  status: z.enum(["open", "in_transit", "fullbooked", "closed"]).optional(),
  popularCategories: z.array(z.string().min(1).max(40)).max(8).optional(),
  notes: z.string().max(500).nullable().optional(),
  isPublished: z.boolean().optional(),
});

const tripPatchInput = tripInput.partial();

adminTripsRouter.get(
  "/",
  authGuard,
  requirePermission("cms:manage"),
  async (_req, res, next) => {
    try {
      const db = await getPool();
      const result = await db.query<TripRow>(
        `SELECT id, code, origin, destination, depart_at, arrive_estimate_at,
                capacity_kg, booked_kg, base_fee, per_kg_fee, status,
                popular_categories, notes, is_published, created_at, updated_at
           FROM trips
          ORDER BY depart_at ASC NULLS LAST, created_at DESC
          LIMIT 200`
      );
      res.json({ success: true, data: result.rows.map(rowToDto) });
    } catch (err) {
      next(err);
    }
  }
);

adminTripsRouter.post(
  "/",
  authGuard,
  requirePermission("cms:manage"),
  (req, res, next) => {
    tripInput
      .parseAsync(req.body)
      .then(async (input) => {
        const id = randomUUID();
        const db = await getPool();
        try {
          await db.query(
            `INSERT INTO trips
               (id, code, origin, destination, depart_at, arrive_estimate_at,
                capacity_kg, booked_kg, base_fee, per_kg_fee, status,
                popular_categories, notes, is_published, created_by)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13,$14,$15)`,
            [
              id,
              input.code,
              input.origin,
              input.destination,
              input.departAt,
              input.arriveEstimateAt ?? null,
              input.capacityKg,
              input.bookedKg ?? 0,
              input.baseFee ?? 0,
              input.perKgFee ?? 0,
              input.status ?? "open",
              JSON.stringify(input.popularCategories ?? []),
              input.notes ?? null,
              input.isPublished ?? false,
              req.user?.sub ?? null,
            ]
          );
        } catch (err) {
          if (err instanceof Error && /duplicate key/i.test(err.message)) {
            throw new AppError(409, "TRIP_CODE_TAKEN", "Kode trip sudah dipakai");
          }
          throw err;
        }
        await logAudit({
          actorId: req.user?.sub,
          action: "trip.create",
          moduleName: "cms",
          entityId: id,
          afterData: { code: input.code, isPublished: input.isPublished === true },
        });
        res.status(201).json({ success: true, data: { id, code: input.code } });
      })
      .catch(next);
  }
);

adminTripsRouter.patch(
  "/:id",
  authGuard,
  requirePermission("cms:manage"),
  (req, res, next) => {
    tripPatchInput
      .parseAsync(req.body)
      .then(async (input) => {
        const id = String(req.params.id);
        const sets: string[] = ["updated_at = NOW()"];
        const values: unknown[] = [];
        const push = (col: string, value: unknown) => {
          values.push(value);
          sets.push(`${col} = $${values.length}`);
        };
        if (input.code !== undefined) push("code", input.code);
        if (input.origin !== undefined) push("origin", input.origin);
        if (input.destination !== undefined) push("destination", input.destination);
        if (input.departAt !== undefined) push("depart_at", input.departAt);
        if (input.arriveEstimateAt !== undefined)
          push("arrive_estimate_at", input.arriveEstimateAt);
        if (input.capacityKg !== undefined) push("capacity_kg", input.capacityKg);
        if (input.bookedKg !== undefined) push("booked_kg", input.bookedKg);
        if (input.baseFee !== undefined) push("base_fee", input.baseFee);
        if (input.perKgFee !== undefined) push("per_kg_fee", input.perKgFee);
        if (input.status !== undefined) push("status", input.status);
        if (input.popularCategories !== undefined) {
          values.push(JSON.stringify(input.popularCategories));
          sets.push(`popular_categories = $${values.length}::jsonb`);
        }
        if (input.notes !== undefined) push("notes", input.notes);
        if (input.isPublished !== undefined) push("is_published", input.isPublished);
        if (values.length === 0) {
          throw new AppError(422, "NO_FIELDS", "Tidak ada field yang diubah");
        }
        values.push(id);
        const db = await getPool();
        const result = await db.query<{ id: string }>(
          `UPDATE trips SET ${sets.join(", ")} WHERE id = $${values.length} RETURNING id`,
          values
        );
        if (!result.rowCount) {
          throw new AppError(404, "TRIP_NOT_FOUND", "Trip tidak ditemukan");
        }
        await logAudit({
          actorId: req.user?.sub,
          action: "trip.update",
          moduleName: "cms",
          entityId: id,
          afterData: input,
        });
        res.json({ success: true, data: { id } });
      })
      .catch(next);
  }
);

adminTripsRouter.delete(
  "/:id",
  authGuard,
  requirePermission("cms:manage"),
  async (req, res, next) => {
    try {
      const id = String(req.params.id);
      const db = await getPool();
      const result = await db.query(`DELETE FROM trips WHERE id = $1`, [id]);
      if (!result.rowCount) {
        throw new AppError(404, "TRIP_NOT_FOUND", "Trip tidak ditemukan");
      }
      await logAudit({
        actorId: req.user?.sub,
        action: "trip.delete",
        moduleName: "cms",
        entityId: id,
      });
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  }
);
