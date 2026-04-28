# ERP Enterprise (Express + Single-File Frontend + PostgreSQL/SQLite)

Monorepo ERP production-grade baseline dengan arsitektur 3 layer:
- `apps/web/public/index.html`: Single-file frontend utama (UI/UX final).
- `apps/api`: Express application layer.
- `apps/api/src/infrastructure/db`: SQL data layer.

## Quick Start
1. Copy `.env.example` to `.env`.
2. `npm install`
3. (Opsional Postgres) `docker compose up -d db`
4. Jalankan API: `npm -w apps/api run dev`
5. Buka ERP di browser: `http://localhost:3000/`

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

## Cloud Publish Tutorial (Ringkas)
1. Siapkan server cloud Linux + Docker.
2. Clone repo, copy env:
   - `cp .env.example .env.production`
3. Isi env penting: `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ALLOWED_ORIGINS`.
4. Jalankan migration:
   - `npm run migrate --workspace @erp/api`
5. Build & run:
   - `docker compose -f docker-compose.yml build`
   - `docker compose -f docker-compose.yml up -d`
6. Verifikasi:
   - `GET /api/v1/health`
   - `GET /api/v1/health/ready`
   - `GET /api/v1/metrics`

Catatan: transaksi sistem diarahkan ke API + database cloud, bukan hardcoded file statis.

## Hosting terpisah (Netlify/Vercel untuk frontend)
- **Opsi 1 (paling gampang)**: tetap serve `index.html` dari backend (Nginx/VPS/Render/Railway) → tidak ada CORS (same-origin).
- **Opsi 2 (frontend & backend beda domain)**:
  - Set env backend `CORS_ALLOWED_ORIGINS` ke origin frontend (contoh: `https://erp-frontend.vercel.app`).
  - Di browser, set `localStorage.erp_api_base` ke base API production (contoh: `https://api.example.com/api/v1`).
  - Atau isi `Sync Endpoint Cloud` di halaman Settings (aplikasi akan menurunkan base API dari nilai itu).
