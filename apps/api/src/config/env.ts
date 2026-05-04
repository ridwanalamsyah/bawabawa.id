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

  // Demo / runtime flags. When unset, defaults to true outside production so
  // local `npm run dev` still works without Google credentials, and false in
  // production where Google OAuth is mandatory (enforced by the refinement
  // below).
  DEMO_MODE: z
    .union([z.string(), z.boolean()])
    .optional()
    .transform((value) => {
      if (value === true || value === "true" || value === "1") return true;
      if (value === false || value === "false" || value === "0") return false;
      const node = process.env.NODE_ENV;
      return node !== "production" && node !== "test";
    }),

  // Google OAuth (Identity Services / ID-token flow). Required outside dev
  // demo mode — when DEMO_MODE=true and we're not in production, the API
  // still mounts the legacy email/password form for local convenience.
  GOOGLE_OAUTH_CLIENT_ID: z.string().min(10).optional(),

  // Optional comma-separated list of email domains that are auto-approved
  // (status='active') on first Google login. Anyone outside the list still
  // signs in but lands on status='pending' awaiting admin approval.
  // Example: OAUTH_ALLOWED_DOMAINS=bawabawa.id,bawabawa.co.id
  OAUTH_ALLOWED_DOMAINS: csvList,

  // When set to "false", new Google logins land in status='active' directly
  // (NOT recommended for public deployments). Default is "true".
  OAUTH_REQUIRE_APPROVAL: z
    .union([z.string(), z.boolean()])
    .optional()
    .transform((value) => value !== false && value !== "false" && value !== "0"),

  // Midtrans payment gateway. Server key is used to verify webhook
  // signatures; client key is exposed to the frontend Snap SDK. Both
  // optional — when unset the webhook endpoint returns 503 and Snap is not
  // mounted on the storefront. Sandbox keys start with `SB-Mid-` while
  // production keys start with `Mid-`.
  MIDTRANS_SERVER_KEY: z.string().min(20).optional(),
  MIDTRANS_CLIENT_KEY: z.string().min(20).optional(),
  MIDTRANS_IS_PRODUCTION: z
    .union([z.string(), z.boolean()])
    .optional()
    .transform((value) => value === true || value === "true" || value === "1"),

  // Resend transactional email. When unset, /api/v1/emails endpoints
  // return 503 and outbox flush is a no-op. Verify your sending domain
  // (SPF/DKIM) at https://resend.com/domains before going live.
  RESEND_API_KEY: z.string().min(20).optional(),
  RESEND_FROM_EMAIL: z.string().email().optional(),
  RESEND_REPLY_TO: z.string().email().optional(),
  RESEND_BASE_URL: z
    .string()
    .url()
    .optional()
    .default("https://api.resend.com")
}).superRefine((env, ctx) => {
  // Production deployments must use Google OAuth — no demo accounts allowed.
  if (env.NODE_ENV === "production") {
    if (env.DEMO_MODE === true) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["DEMO_MODE"],
        message: "DEMO_MODE must be disabled when NODE_ENV=production"
      });
    }
    if (!env.GOOGLE_OAUTH_CLIENT_ID) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["GOOGLE_OAUTH_CLIENT_ID"],
        message:
          "GOOGLE_OAUTH_CLIENT_ID is required in production (Google sign-in is the only auth flow)"
      });
    }
    if (!env.DATABASE_URL) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["DATABASE_URL"],
        message: "DATABASE_URL is required in production"
      });
    }
  }
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
