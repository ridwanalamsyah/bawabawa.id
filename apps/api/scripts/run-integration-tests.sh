#!/usr/bin/env bash
# Run the PR #49–52 integration suites against an ephemeral Postgres
# container. Existing SQLite-only tests still run as part of the same
# invocation; vitest just adds the integration suites on top because
# DATABASE_URL is now set.
#
# Usage:  npm run test:integration --workspace @erp/api
#
# Required tooling: docker (for the ephemeral Postgres). If you prefer
# to point at a managed Postgres, export DATABASE_URL before running:
#     DATABASE_URL=postgres://user:pass@host:5432/db npm run test:integration
set -euo pipefail

CONTAINER_NAME="${BAWABAWA_TEST_PG_NAME:-bawabawa-test-pg}"
HOST_PORT="${BAWABAWA_TEST_PG_PORT:-55432}"

if [[ -n "${DATABASE_URL:-}" ]]; then
  echo "Using preset DATABASE_URL=${DATABASE_URL}"
else
  if ! command -v docker >/dev/null 2>&1; then
    echo "ERROR: docker not found and no DATABASE_URL set." >&2
    exit 1
  fi

  if ! docker inspect "$CONTAINER_NAME" >/dev/null 2>&1; then
    echo "Starting Postgres container '$CONTAINER_NAME' on port $HOST_PORT..."
    docker run -d \
      --name "$CONTAINER_NAME" \
      -e POSTGRES_PASSWORD=test \
      -e POSTGRES_USER=test \
      -e POSTGRES_DB=test \
      -p "$HOST_PORT":5432 \
      postgres:16-alpine >/dev/null

    # Wait for readiness.
    for _ in {1..30}; do
      if docker exec "$CONTAINER_NAME" pg_isready -U test -q; then
        break
      fi
      sleep 1
    done
  else
    docker start "$CONTAINER_NAME" >/dev/null 2>&1 || true
  fi

  # 127.0.0.1 (not localhost) — pool.ts routes localhost:5432 to SQLite.
  export DATABASE_URL="postgres://test:test@127.0.0.1:${HOST_PORT}/test"
fi

export JWT_ACCESS_SECRET="${JWT_ACCESS_SECRET:-test-JWT_ACCESS_SECRET}"
export NODE_ENV="test"

# Run ONLY the PR #49–52 integration suites by default; the rest of the
# test surface (auth/cms/idempotency/etc.) is SQLite-specific and is
# covered by `npm run test`.
DEFAULT_FILES=(
  "src/tests/reports-public.integration.test.ts"
  "src/tests/orders-manual.integration.test.ts"
  "src/tests/orders-manual.unit.test.ts"
  "src/tests/vouchers-public-banner.integration.test.ts"
  "src/tests/blog.integration.test.ts"
)

# Disable file-level parallelism: every PR #49–52 suite truncates the
# same handful of tables in beforeEach, so two workers racing would wipe
# each other's seed rows.
VITEST_ARGS=(--no-file-parallelism)

if [[ $# -gt 0 ]]; then
  npx vitest run "${VITEST_ARGS[@]}" "$@"
else
  npx vitest run "${VITEST_ARGS[@]}" "${DEFAULT_FILES[@]}"
fi

