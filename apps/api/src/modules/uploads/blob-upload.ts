/**
 * Pure helpers used by the upload route. Extracted so they remain
 * unit-testable without spinning up an Express request context.
 */

export const UPLOAD_MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export const UPLOAD_ALLOWED_MIME = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/avif"
] as const;

export type UploadAllowedMime = (typeof UPLOAD_ALLOWED_MIME)[number];

export const UPLOAD_ALLOWED_FOLDERS = ["media", "blog", "orders", "products"] as const;

export type UploadFolder = (typeof UPLOAD_ALLOWED_FOLDERS)[number];

/**
 * Pick a sensible file extension. Prefers the original filename's
 * extension when it looks valid (alphanumeric, 2–5 chars), and falls
 * back to one derived from the MIME type so we never store a file
 * without an extension that browsers refuse to inline-render.
 */
export function pickUploadExtension(originalName: string, mime: string): string {
  const dot = originalName.lastIndexOf(".");
  if (dot > 0) {
    const ext = originalName.slice(dot).toLowerCase();
    if (/^\.[a-z0-9]{2,5}$/.test(ext)) return ext;
  }
  if (mime === "image/png") return ".png";
  if (mime === "image/jpeg") return ".jpg";
  if (mime === "image/webp") return ".webp";
  if (mime === "image/gif") return ".gif";
  if (mime === "image/avif") return ".avif";
  return ".bin";
}

export function stripExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(0, dot) : name;
}

/**
 * Normalize an arbitrary string into a Blob-friendly slug — lowercase,
 * ASCII letters / digits / hyphens only, max 64 characters. Never
 * returns a leading or trailing hyphen and collapses consecutive
 * separators. Returns an empty string when the input has no usable
 * characters (callers should fall back to a default like `image`).
 */
export function sanitizeUploadSlug(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFKD")
    // Drop the combining marks NFKD just peeled off (U+0300–U+036F). Without
    // this, "é" → "e" + combining acute → the acute survives and becomes a
    // hyphen in the next replace pass, yielding "e-" instead of "e".
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export function resolveUploadFolder(raw: unknown): UploadFolder {
  return (UPLOAD_ALLOWED_FOLDERS as readonly string[]).includes(String(raw ?? ""))
    ? (String(raw) as UploadFolder)
    : "media";
}

export function isAllowedUploadMime(mime: string): mime is UploadAllowedMime {
  return (UPLOAD_ALLOWED_MIME as readonly string[]).includes(mime);
}

/**
 * Build the storage path under which a Blob object will be saved. Folder
 * + sanitized slug + 8 random hex chars + extension. Random suffix keeps
 * uploads with identical filenames from clobbering each other.
 */
export function buildUploadPath(
  folder: UploadFolder,
  slugBase: string,
  randomSuffix: string,
  extension: string
): string {
  const slug = sanitizeUploadSlug(slugBase) || "image";
  // Trim the random suffix to 8 chars even when the caller hands us a
  // longer string (uuid v4 has 32 hex chars without dashes); we don't
  // need more than 8 chars of entropy for collision avoidance.
  const suffix = randomSuffix.replace(/[^a-z0-9]/gi, "").toLowerCase().slice(0, 8) || "00000000";
  return `${folder}/${slug}-${suffix}${extension}`;
}
