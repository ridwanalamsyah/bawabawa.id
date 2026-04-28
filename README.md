# ERP Enterprise (Express API + React/Vite Web + PostgreSQL/SQLite)

Monorepo ERP production-grade baseline dengan arsitektur 3 layer:
- `apps/web`: React + Vite frontend (Apple Liquid Glass, mobile-first, dark mode, RBAC, CMS).
- `apps/api`: Express application layer (API-only surface).
- `apps/api/src/infrastructure/db`: SQL data layer (Postgres in prod, SQLite fallback in dev).

## Quick Start
1. Copy `.env.example` to `.env`.
2. `npm install`
3. (Opsional Postgres) `docker compose up -d db`
4. Jalankan API: `npm -w apps/api run dev` (http://localhost:3000)
5. Jalankan Web: `npm -w apps/web run dev` (http://localhost:5173)
6. Login demo: `admin@erp.com` / `admin123` (aktif saat `DEMO_MODE=1`).

## API Examples
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/logout-all`
- `POST /api/v1/erp/sync`
- `GET /api/v1/rbac/me/permissions`
- `POST /api/v1/orders`
- `POST /api/v1/orders/:id/payments`
- `POST /api/v1/orders/:id/reserve-stock`
- `POST /api/v1/orders/:id/invoice`
- `POST /api/v1/orders/:id/post-finance`
- `POST /api/v1/whatsapp/messages/send`
- `POST /api/v1/import/products`
- `GET /api/v1/reports/sales.xlsx`
- `GET /api/v1/cms/settings/public`
- `GET /sitemap.xml`, `GET /robots.txt`

## Cloud Publish Tutorial (Ringkas)
1. Siapkan server cloud Linux + Docker.
2. Clone repo, copy env:
   - `cp .env.example .env.production`
3. Isi env penting: `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ALLOWED_ORIGINS`, `PUBLIC_SITE_URL`.
4. Jalankan migration:
   - `npm run migrate --workspace @erp/api`
5. Build & run (API + Web sebagai dua service):
   - `docker compose -f docker-compose.yml build`
   - `docker compose -f docker-compose.yml up -d`
6. Verifikasi:
   - `GET /api/v1/health`
   - `GET /api/v1/health/ready`
   - `GET /api/v1/metrics`

Catatan: transaksi sistem diarahkan ke API + database cloud, bukan hardcoded file statis.

## Hosting (Frontend & Backend)
Express (`apps/api`) sekarang **API-only**. Frontend React harus di-host terpisah:

- **Satu VPS / Docker host**: gunakan `docker-compose.yml` yang sudah menyediakan service `api` (port 3000) dan `web` (port 5173 via `vite preview`). Taruh Nginx di depan untuk route `/api/*` → api:3000, selain itu → web:5173.
- **Split hosting (Vercel/Netlify + Render/Railway)**:
  - Deploy `apps/web` ke Vercel / Netlify (build: `npm -w apps/web run build`, output: `apps/web/dist`).
  - Deploy `apps/api` ke Render / Railway / Fly.
  - Set `CORS_ALLOWED_ORIGINS` di API ke origin frontend (mis. `https://bawabawa-web.vercel.app`).
  - Di browser, set `localStorage.erp_api_base` ke base API production, atau isi endpoint API di halaman Settings CMS.
