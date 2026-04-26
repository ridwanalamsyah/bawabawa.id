import { z } from "zod";

/**
 * Centralized environment validation. Imported from `server.ts` and from any
 * runtime helper that needs typed access to env vars. Crashes fast on startup
 * when required values are missing or malformed so misconfigured deployments
 * never reach the listen() call.
 *
 * Test mode (`NODE_ENV=test`) gets sane defaults so the vitest suite can run
 * without real secrets — never apply this relaxation outside tests.
 */

const isTest = process.env.NODE_ENV === "test";
const optionalInTest = <T extends z.ZodTypeAny>(schema: T, fallback: string) =>
  isTest ? schema.optional().default(fallback as never) : schema;

const csvList = z
  .string()
  .optional()
  .transform((value) => {
    if (!value || !value.trim()) return [] as string[];
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  });

const portSchema = z
  .union([z.string(), z.number()])
  .default(3000)
  .transform((value) => {
    const num = typeof value === "number" ? value : Number(value);
    if (!Number.isInteger(num) || num < 1 || num > 65535) {
      throw new Error(`Invalid PORT value: ${value}`);
    }
    return num;
  });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: portSchema,

  // Database
  DATABASE_URL: z
    .string()
    .url({ message: "DATABASE_URL must be a valid URL (postgres://… or sqlite://…)" })
    .optional(),

  // Auth secrets — required outside tests; tests get deterministic fallbacks.
  JWT_ACCESS_SECRET: optionalInTest(
    z.string().min(16, "JWT_ACCESS_SECRET must be at least 16 chars"),
    "test-jwt-access-secret-please-change"
  ),
  JWT_REFRESH_SECRET: optionalInTest(
    z.string().min(16, "JWT_REFRESH_SECRET must be at least 16 chars"),
    "test-jwt-refresh-secret-please-change"
  ),

  // Bootstrap admin (optional everywhere — defaults handled at call site).
  BOOTSTRAP_ADMIN_EMAIL: z.string().email().optional(),
  BOOTSTRAP_ADMIN_PASSWORD: z.string().min(8).optional(),
  BOOTSTRAP_ADMIN_NAME: z.string().optional(),
  BOOTSTRAP_ADMIN_DIVISION: z.string().optional(),

  // CORS allowlist (comma-separated). Empty list = allow all (dev mode).
  CORS_ALLOWED_ORIGINS: csvList,

  // Public origin used when generating sitemap.xml / robots.txt links.
  PUBLIC_SITE_URL: z.string().url().optional(),

  // Demo / runtime flags.
  DEMO_MODE: z
    .union([z.string(), z.boolean()])
    .optional()
    .transform((value) => value === true || value === "true" || value === "1")
});

export type AppEnv = z.infer<typeof envSchema>;

let cached: AppEnv | undefined;

export function loadEnv(): AppEnv {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const messages = parsed.error.issues
      .map((issue) => `  • ${issue.path.join(".") || "<root>"}: ${issue.message}`)
      .join("\n");
    // eslint-disable-next-line no-console
    console.error(`\n[config/env] Invalid environment variables:\n${messages}\n`);
    throw new Error("Environment validation failed");
  }
  cached = parsed.data;
  return cached;
}

/**
 * Reset the cached env. Only useful inside tests that mutate `process.env`
 * across cases — production code should call `loadEnv()` once at startup.
 */
export function __resetEnvCacheForTests(): void {
  cached = undefined;
}
