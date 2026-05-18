import { Router } from "express";
import multer from "multer";
import { randomUUID } from "crypto";
import { put, type PutBlobResult } from "@vercel/blob";
import { authGuard, requirePermission } from "../../common/middleware/auth";
import { loadEnv } from "../../config/env";
import { logAudit } from "../../common/audit/audit-log";
import {
  UPLOAD_ALLOWED_MIME,
  UPLOAD_MAX_BYTES,
  buildUploadPath,
  isAllowedUploadMime,
  pickUploadExtension,
  resolveUploadFolder,
  sanitizeUploadSlug,
  stripExtension
} from "./blob-upload";

// In-memory multer — files are small (≤5 MB) and we forward straight to
// Blob without ever touching disk. Disk storage would also fail on the
// read-only Vercel serverless filesystem.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: UPLOAD_MAX_BYTES, files: 1 }
});

// Re-use the existing CMS permission for write access; admins and CMS
// editors already have it via the seeded `cms:manage` permission.
const UPLOAD_PERMISSION = "cms:manage";
const requireUploadPermission = requirePermission(UPLOAD_PERMISSION);

const uploadsRouter = Router();

/**
 * POST /api/v1/uploads — admin-only image upload backed by Vercel Blob.
 *
 * Body: multipart/form-data with
 *   - `file`     (binary, required) — the image to upload
 *   - `folder`   (string, optional)  — one of: media | blog | orders | products
 *   - `filename` (string, optional)  — preferred slug; sanitized server-side
 *
 * Behavior:
 *   - 401/403 when not authenticated or missing `cms:manage` permission.
 *   - 503 when `BLOB_READ_WRITE_TOKEN` is not configured (fail closed so
 *     misconfigured deploys never silently accept uploads). Matches the
 *     same defensive pattern as DOKU/Biteship integrations.
 *   - 400/413/415 for malformed bodies, oversize files, disallowed MIMEs.
 *   - 502 if the Blob upstream fails.
 *
 * Response shape on success:
 *   { success: true, data: { url, pathname, contentType, sizeBytes } }
 *
 * The returned URL is what admins paste into CMS / blog / order records.
 * No DB row is created here — the caller's existing POST /cms/media or
 * blog endpoints persist the URL alongside whatever metadata they need.
 */
uploadsRouter.post(
  "/",
  authGuard,
  requireUploadPermission,
  upload.single("file"),
  async (req, res, next) => {
    try {
      const env = loadEnv();
      if (!env.BLOB_READ_WRITE_TOKEN) {
        res.status(503).json({
          success: false,
          error: {
            code: "BLOB_NOT_CONFIGURED",
            message:
              "BLOB_READ_WRITE_TOKEN belum di-set. Buat Blob store di Vercel dashboard dan connect ke project."
          }
        });
        return;
      }

      const file = req.file;
      if (!file) {
        res.status(400).json({
          success: false,
          error: { code: "MISSING_FILE", message: "Field `file` wajib diisi" }
        });
        return;
      }

      if (file.size === 0) {
        res.status(400).json({
          success: false,
          error: { code: "EMPTY_FILE", message: "File kosong" }
        });
        return;
      }

      if (!isAllowedUploadMime(file.mimetype)) {
        res.status(415).json({
          success: false,
          error: {
            code: "INVALID_MIME",
            message: `MIME type tidak diizinkan. Diizinkan: ${UPLOAD_ALLOWED_MIME.join(", ")}`,
            receivedMime: file.mimetype
          }
        });
        return;
      }

      const rawFolder = req.body?.folder ?? req.query?.folder;
      const folder = resolveUploadFolder(rawFolder);

      const ext = pickUploadExtension(file.originalname, file.mimetype);
      const requestedSlug = String(req.body?.filename ?? "");
      const slugBase =
        sanitizeUploadSlug(requestedSlug) || sanitizeUploadSlug(stripExtension(file.originalname));

      const pathname = buildUploadPath(folder, slugBase, randomUUID(), ext);

      let blob: PutBlobResult;
      try {
        blob = await put(pathname, file.buffer, {
          access: "public",
          addRandomSuffix: false,
          contentType: file.mimetype,
          token: env.BLOB_READ_WRITE_TOKEN
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload gagal";
        res.status(502).json({
          success: false,
          error: { code: "BLOB_UPLOAD_FAILED", message }
        });
        return;
      }

      // Audit logging is best-effort — never fail an otherwise-successful
      // upload because the audit table is unreachable. We log the failure
      // via `console.warn` so it shows up in Vercel logs but don't surface
      // it to the caller.
      try {
        await logAudit({
          actorId: req.user?.sub,
          action: "uploads.create",
          moduleName: "cms",
          afterData: {
            folder,
            pathname: blob.pathname,
            sizeBytes: file.size,
            contentType: file.mimetype
          }
        });
      } catch (auditErr) {
        // eslint-disable-next-line no-console
        console.warn("[uploads] audit log failed", auditErr);
      }

      res.status(201).json({
        success: true,
        data: {
          url: blob.url,
          pathname: blob.pathname,
          contentType: file.mimetype,
          sizeBytes: file.size
        }
      });
    } catch (err) {
      next(err);
    }
  }
);

// Multer attaches its own error class for size/mime violations. Translate
// those into our standard envelope so the storefront/admin clients can
// branch on a stable error code instead of parsing `error.message`.
uploadsRouter.use((err: unknown, _req: any, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(413).json({
        success: false,
        error: {
          code: "FILE_TOO_LARGE",
          message: `Ukuran file maksimal ${UPLOAD_MAX_BYTES / (1024 * 1024)} MB`
        }
      });
      return;
    }
    res.status(400).json({
      success: false,
      error: { code: `MULTER_${err.code}`, message: err.message }
    });
    return;
  }
  next(err);
});

export { uploadsRouter };
