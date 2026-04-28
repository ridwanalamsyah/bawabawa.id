# =============================================================================
# bawabawa.id — production Docker image (single-container)
#
# Builds the Express API and bundles the static frontend (apps/web/public)
# into one runtime image. The API serves /api/* endpoints and falls back to
# the SPA's index.html for any other GET, so deploys only need to expose
# port 3000 — no separate web tier required.
#
# Native modules (argon2, sqlite3) need build tooling so the builder stage
# pulls python3+make+g++. The runner stage stays lean (alpine + node).
# =============================================================================

# ───────────────────────────── builder stage ─────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

RUN apk add --no-cache python3 make g++ libc6-compat

COPY package.json package-lock.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN npm ci

COPY . .

WORKDIR /app/apps/api
RUN npm run build

# ───────────────────────────── runner stage ──────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

# argon2 ships a prebuilt binary on alpine, but glibc-style binaries fail at
# load time without libc6-compat. Keep the runtime layer minimal otherwise.
RUN apk add --no-cache libc6-compat tini

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

COPY package.json package-lock.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json

# Install production deps only.
RUN apk add --no-cache --virtual .build python3 make g++ \
 && npm ci --omit=dev \
 && apk del .build \
 && npm cache clean --force

# Compiled API output.
COPY --from=builder /app/apps/api/dist apps/api/dist
# Compiled SQL migrations + raw SQL files (Express resolves them at runtime).
COPY --from=builder /app/apps/api/src/infrastructure/db/migrations apps/api/src/infrastructure/db/migrations
COPY --from=builder /app/apps/api/src/infrastructure/db/001_init_schema.sql apps/api/src/infrastructure/db/001_init_schema.sql
# Static frontend (single-file index.html + any /assets the user uploads).
COPY --from=builder /app/apps/web/public apps/web/public

USER node
WORKDIR /app/apps/api
EXPOSE 3000

# Tini reaps zombies when running as PID 1.
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/server.js"]
