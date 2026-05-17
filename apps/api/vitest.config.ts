import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/tests/**/*.test.ts"],
    // Boots Postgres-only test schema once if DATABASE_URL is set
    // (PR #49–52 integration suites). When DATABASE_URL is unset,
    // those suites `describe.skipIf` themselves out and globalSetup
    // is a noop, so default `npm run test` continues to use SQLite.
    globalSetup: ["./src/tests/helpers/global-setup.ts"]
  }
});
