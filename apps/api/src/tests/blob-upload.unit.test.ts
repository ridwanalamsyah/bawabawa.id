import { describe, expect, it } from "vitest";
import {
  UPLOAD_ALLOWED_FOLDERS,
  UPLOAD_ALLOWED_MIME,
  UPLOAD_MAX_BYTES,
  buildUploadPath,
  isAllowedUploadMime,
  pickUploadExtension,
  resolveUploadFolder,
  sanitizeUploadSlug,
  stripExtension
} from "../modules/uploads/blob-upload";

describe("blob-upload helpers", () => {
  describe("UPLOAD_MAX_BYTES", () => {
    it("is exactly 5 MB so admins can drop high-DPR photos but not raw camera files", () => {
      // 5 MB matches the conservative multer limit; bumping this requires
      // also re-checking the Vercel Blob plan and serverless function
      // payload limits.
      expect(UPLOAD_MAX_BYTES).toBe(5 * 1024 * 1024);
    });
  });

  describe("UPLOAD_ALLOWED_MIME", () => {
    it("only permits image MIME types — never PDFs, SVGs, or video", () => {
      // SVG is excluded because it can carry inline <script>; PDFs because
      // they're a different storage workflow; video because Vercel Blob has
      // per-file size caps that we'd want to enforce separately.
      for (const mime of UPLOAD_ALLOWED_MIME) {
        expect(mime.startsWith("image/")).toBe(true);
      }
      expect(UPLOAD_ALLOWED_MIME).not.toContain("image/svg+xml");
      expect(UPLOAD_ALLOWED_MIME).not.toContain("application/pdf");
    });
  });

  describe("isAllowedUploadMime", () => {
    it("accepts every type in the allow-list", () => {
      for (const mime of UPLOAD_ALLOWED_MIME) {
        expect(isAllowedUploadMime(mime)).toBe(true);
      }
    });
    it("rejects everything else, including SVG and tampered headers", () => {
      expect(isAllowedUploadMime("image/svg+xml")).toBe(false);
      expect(isAllowedUploadMime("application/pdf")).toBe(false);
      expect(isAllowedUploadMime("text/html")).toBe(false);
      expect(isAllowedUploadMime("")).toBe(false);
      expect(isAllowedUploadMime("IMAGE/PNG")).toBe(false); // case-sensitive on purpose
    });
  });

  describe("resolveUploadFolder", () => {
    it("passes through every known folder verbatim", () => {
      for (const f of UPLOAD_ALLOWED_FOLDERS) {
        expect(resolveUploadFolder(f)).toBe(f);
      }
    });
    it("falls back to `media` for any unknown or invalid value", () => {
      expect(resolveUploadFolder("../etc/passwd")).toBe("media");
      expect(resolveUploadFolder("random")).toBe("media");
      expect(resolveUploadFolder("")).toBe("media");
      expect(resolveUploadFolder(undefined)).toBe("media");
      expect(resolveUploadFolder(null)).toBe("media");
      expect(resolveUploadFolder(42)).toBe("media");
    });
  });

  describe("pickUploadExtension", () => {
    it("prefers the original extension when it's plausible", () => {
      expect(pickUploadExtension("hero.png", "image/png")).toBe(".png");
      expect(pickUploadExtension("foo.JPG", "image/jpeg")).toBe(".jpg");
      expect(pickUploadExtension("photo.webp", "image/webp")).toBe(".webp");
    });
    it("falls back to MIME-derived extensions when the filename has none", () => {
      expect(pickUploadExtension("untitled", "image/png")).toBe(".png");
      expect(pickUploadExtension("", "image/jpeg")).toBe(".jpg");
      expect(pickUploadExtension("DSC_0001", "image/webp")).toBe(".webp");
      expect(pickUploadExtension("clip", "image/gif")).toBe(".gif");
      expect(pickUploadExtension("photo", "image/avif")).toBe(".avif");
    });
    it("ignores suspicious dotfiles and over-long extensions", () => {
      expect(pickUploadExtension(".env", "image/png")).toBe(".png");
      expect(pickUploadExtension("photo.thisistoolong", "image/png")).toBe(".png");
      expect(pickUploadExtension("photo.", "image/png")).toBe(".png");
    });
    it("returns .bin for an entirely unknown MIME (defense in depth — the route filters MIME first)", () => {
      expect(pickUploadExtension("data", "application/octet-stream")).toBe(".bin");
    });
  });

  describe("stripExtension", () => {
    it("removes the trailing extension when present", () => {
      expect(stripExtension("hero.png")).toBe("hero");
      expect(stripExtension("my.photo.jpg")).toBe("my.photo");
    });
    it("returns the original string when there is no dot", () => {
      expect(stripExtension("hero")).toBe("hero");
      expect(stripExtension("")).toBe("");
    });
    it("keeps dotfiles intact (no extension to strip)", () => {
      expect(stripExtension(".env")).toBe(".env");
    });
  });

  describe("sanitizeUploadSlug", () => {
    it("lowercases and replaces non-alphanumerics with single hyphens", () => {
      expect(sanitizeUploadSlug("Hero Banner.png")).toBe("hero-banner-png");
      expect(sanitizeUploadSlug("Halaman Tentang")).toBe("halaman-tentang");
      expect(sanitizeUploadSlug("a / b / c")).toBe("a-b-c");
    });
    it("trims leading/trailing hyphens that would create ugly paths", () => {
      expect(sanitizeUploadSlug("---hero---")).toBe("hero");
      expect(sanitizeUploadSlug("___")).toBe("");
    });
    it("strips diacritics so accented Indonesian/European characters survive", () => {
      expect(sanitizeUploadSlug("Café Über")).toBe("cafe-uber");
    });
    it("caps length at 64 characters to keep Blob paths bounded", () => {
      const long = "a".repeat(200);
      expect(sanitizeUploadSlug(long).length).toBe(64);
    });
    it("preserves single hyphens between alphanumerics", () => {
      expect(sanitizeUploadSlug("open-trip-bandung")).toBe("open-trip-bandung");
    });
  });

  describe("buildUploadPath", () => {
    it("composes `folder/slug-suffix.ext` correctly", () => {
      expect(buildUploadPath("blog", "panduan-belanja", "deadbeef", ".png"))
        .toBe("blog/panduan-belanja-deadbeef.png");
    });
    it("re-sanitizes the slug input — callers shouldn't have to pre-clean it", () => {
      expect(buildUploadPath("media", "Hero Banner!!!", "12345678", ".jpg"))
        .toBe("media/hero-banner-12345678.jpg");
    });
    it("falls back to `image` when the slug sanitizes to empty", () => {
      expect(buildUploadPath("media", "@@@@@", "abcdef12", ".png"))
        .toBe("media/image-abcdef12.png");
    });
    it("trims a uuid-shaped random suffix to 8 hex chars", () => {
      const uuid = "550e8400-e29b-41d4-a716-446655440000";
      expect(buildUploadPath("orders", "receipt", uuid, ".webp"))
        .toBe("orders/receipt-550e8400.webp");
    });
    it("never emits double-slash even if the slug had separators", () => {
      const path = buildUploadPath("media", "a/b/c", "00000000", ".png");
      expect(path).not.toContain("//");
    });
  });
});
