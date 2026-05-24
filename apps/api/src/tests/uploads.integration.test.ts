import jwt from "jsonwebtoken";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { requireEnv } from "../common/security/env";
import { __resetEnvCacheForTests } from "../config/env";

// Mock @vercel/blob BEFORE we import the app — the upload route holds a
// module reference to `put`, so a vi.mock after app creation is too late.
vi.mock("@vercel/blob", () => ({
  put: vi.fn(async (pathname: string) => ({
    url: `https://blob.test/${pathname}`,
    pathname,
    contentType: "image/png",
    contentDisposition: `inline; filename="${pathname}"`
  }))
}));

import { createApp } from "../app";
import * as blobModule from "@vercel/blob";

const mockedPut = blobModule.put as unknown as ReturnType<typeof vi.fn>;

const ORIGINAL_ENV = { ...process.env };

function resetEnv(): void {
  for (const key of Object.keys(process.env)) {
    if (!(key in ORIGINAL_ENV)) delete process.env[key];
  }
  for (const [key, value] of Object.entries(ORIGINAL_ENV)) {
    process.env[key] = value;
  }
  __resetEnvCacheForTests();
}

function signToken(opts: { sub?: string; permissions?: string[] } = {}): string {
  const secret = requireEnv("JWT_ACCESS_SECRET");
  return jwt.sign(
    {
      sub: opts.sub ?? "user-test",
      permissions: opts.permissions ?? ["cms:manage"]
    },
    secret,
    { expiresIn: "1h" }
  );
}

function tinyPng(): Buffer {
  // 1x1 transparent PNG — smallest valid bitmap, plenty for the route.
  return Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkAAIAAAoAAv/lxKUAAAAASUVORK5CYII=",
    "base64"
  );
}

describe("POST /api/v1/uploads", () => {
  beforeEach(() => {
    resetEnv();
    mockedPut.mockClear();
    process.env.NODE_ENV = "test";
  });
  afterEach(resetEnv);

  it("returns 401 when no bearer token is provided", async () => {
    process.env.BLOB_READ_WRITE_TOKEN = "vercel_blob_rw_test_token_1234567890abc";
    const res = await request(createApp())
      .post("/api/v1/uploads")
      .attach("file", tinyPng(), { filename: "hero.png", contentType: "image/png" });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHENTICATED");
  });

  it("returns 403 when the user lacks cms:manage permission", async () => {
    process.env.BLOB_READ_WRITE_TOKEN = "vercel_blob_rw_test_token_1234567890abc";
    const token = signToken({ permissions: ["orders:read"] });
    const res = await request(createApp())
      .post("/api/v1/uploads")
      .set("Authorization", `Bearer ${token}`)
      .attach("file", tinyPng(), { filename: "hero.png", contentType: "image/png" });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("returns 503 when BLOB_READ_WRITE_TOKEN is unset (fail-closed)", async () => {
    delete process.env.BLOB_READ_WRITE_TOKEN;
    const token = signToken();
    const res = await request(createApp())
      .post("/api/v1/uploads")
      .set("Authorization", `Bearer ${token}`)
      .attach("file", tinyPng(), { filename: "hero.png", contentType: "image/png" });
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe("BLOB_NOT_CONFIGURED");
    // Critical: we MUST NOT have called the Blob SDK.
    expect(mockedPut).not.toHaveBeenCalled();
  });

  it("returns 400 when no file field is sent", async () => {
    process.env.BLOB_READ_WRITE_TOKEN = "vercel_blob_rw_test_token_1234567890abc";
    const token = signToken();
    const res = await request(createApp())
      .post("/api/v1/uploads")
      .set("Authorization", `Bearer ${token}`)
      .field("folder", "media");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("MISSING_FILE");
  });

  it("returns 415 when the MIME type is not in the allow-list (SVG kept out for XSS)", async () => {
    process.env.BLOB_READ_WRITE_TOKEN = "vercel_blob_rw_test_token_1234567890abc";
    const token = signToken();
    const res = await request(createApp())
      .post("/api/v1/uploads")
      .set("Authorization", `Bearer ${token}`)
      .attach("file", Buffer.from("<svg/>"), {
        filename: "evil.svg",
        contentType: "image/svg+xml"
      });
    expect(res.status).toBe(415);
    expect(res.body.error.code).toBe("INVALID_MIME");
    expect(mockedPut).not.toHaveBeenCalled();
  });

  it("returns 413 when the file exceeds 5 MB", async () => {
    process.env.BLOB_READ_WRITE_TOKEN = "vercel_blob_rw_test_token_1234567890abc";
    const token = signToken();
    const oversize = Buffer.alloc(5 * 1024 * 1024 + 1, 0xff);
    const res = await request(createApp())
      .post("/api/v1/uploads")
      .set("Authorization", `Bearer ${token}`)
      .attach("file", oversize, { filename: "big.png", contentType: "image/png" });
    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe("FILE_TOO_LARGE");
    expect(mockedPut).not.toHaveBeenCalled();
  });

  it("uploads a valid PNG and returns the public URL + pathname", async () => {
    process.env.BLOB_READ_WRITE_TOKEN = "vercel_blob_rw_test_token_1234567890abc";
    const token = signToken();
    const res = await request(createApp())
      .post("/api/v1/uploads")
      .set("Authorization", `Bearer ${token}`)
      .field("folder", "blog")
      .field("filename", "panduan-belanja")
      .attach("file", tinyPng(), { filename: "panduan.png", contentType: "image/png" });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.url).toMatch(/^https:\/\/blob\.test\/blog\/panduan-belanja-[a-f0-9]{8}\.png$/);
    expect(res.body.data.pathname).toMatch(/^blog\/panduan-belanja-[a-f0-9]{8}\.png$/);
    expect(res.body.data.contentType).toBe("image/png");
    expect(res.body.data.sizeBytes).toBeGreaterThan(0);

    expect(mockedPut).toHaveBeenCalledTimes(1);
    const [pathname, body, options] = mockedPut.mock.calls[0]!;
    expect(pathname).toMatch(/^blog\/panduan-belanja-[a-f0-9]{8}\.png$/);
    expect(Buffer.isBuffer(body)).toBe(true);
    expect(options).toMatchObject({
      access: "public",
      addRandomSuffix: false,
      contentType: "image/png",
      token: "vercel_blob_rw_test_token_1234567890abc"
    });
  });

  it("falls back to the `media` folder when an unknown folder is requested (defense in depth)", async () => {
    process.env.BLOB_READ_WRITE_TOKEN = "vercel_blob_rw_test_token_1234567890abc";
    const token = signToken();
    const res = await request(createApp())
      .post("/api/v1/uploads")
      .set("Authorization", `Bearer ${token}`)
      .field("folder", "../../etc/passwd")
      .attach("file", tinyPng(), { filename: "x.png", contentType: "image/png" });

    expect(res.status).toBe(201);
    expect(res.body.data.pathname.startsWith("media/")).toBe(true);
  });

  it("returns 502 when the Blob SDK throws (upstream failure surfaces cleanly)", async () => {
    process.env.BLOB_READ_WRITE_TOKEN = "vercel_blob_rw_test_token_1234567890abc";
    mockedPut.mockRejectedValueOnce(new Error("network unreachable"));
    const token = signToken();
    const res = await request(createApp())
      .post("/api/v1/uploads")
      .set("Authorization", `Bearer ${token}`)
      .attach("file", tinyPng(), { filename: "hero.png", contentType: "image/png" });

    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe("BLOB_UPLOAD_FAILED");
    expect(res.body.error.message).toContain("network unreachable");
  });
});
