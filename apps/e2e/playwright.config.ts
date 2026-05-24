import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for the bawabawa.id marketing site end-to-end
 * suite. Defaults to the production Vercel deployment because:
 *   1. There is no public CI Postgres to seed an ephemeral copy of the
 *      ERP behind apps/site.
 *   2. The PR #49–52 contracts under test are about how the marketing
 *      site degrades / hydrates from real ERP data — running against
 *      the live deployment is the most honest signal.
 *
 * Override with `BAWABAWA_E2E_BASE_URL` to point at a Vercel preview or
 * a localhost dev server.
 */
const baseURL =
  process.env.BAWABAWA_E2E_BASE_URL ?? "https://bawabawa-id.vercel.app";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  timeout: 30_000,
  expect: { timeout: 7_000 },
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
