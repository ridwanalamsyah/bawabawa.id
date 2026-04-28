# ERP Enterprise (Express + Single-File Frontend + PostgreSQL/SQLite)

Monorepo ERP production-grade baseline dengan arsitektur 3 layer:
- `apps/web/public/index.html`: Single-file frontend utama (UI/UX final).
- `apps/api`: Express application layer.
- `apps/api/src/infrastructure/db`: SQL data layer.

## Quick Start (lokal, demo mode)
1. `cp .env.example .env`
2. `npm install`
3. (Opsional Postgres) `docker compose up -d db`
4. Jalankan API: `npm -w apps/api run dev`
5. Buka ERP di browser: `http://localhost:3000/`

Default `NODE_ENV=development` membuat `DEMO_MODE` aktif; form email/password
masih tampil dengan akun seed `admin@erp.com` / `admin123`. Setting Google
OAuth (lihat di bawah) akan membuat tombol "Sign in with Google" muncul
berdampingan dengan form demo.

## Production: Google Sign-In only

Production deployment **wajib** pakai Google OAuth — form email/password tidak
diaktifkan ketika `NODE_ENV=production`.

### 1. Generate OAuth Client ID
1. Buka https://console.cloud.google.com/apis/credentials
2. Create Credentials → OAuth client ID → Web application
3. Authorized JavaScript origins: `https://bawabawa.id`
4. (Opsional) Authorized redirect URIs: `https://bawabawa.id`
5. Copy Client ID-nya (`xxxx.apps.googleusercontent.com`).

Client Secret tidak diperlukan — implementasi pakai ID-token flow lewat Google
Identity Services JS SDK, bukan auth-code flow server-to-server.

### 2. User gating
Tiga skenario didukung lewat env:

| Tujuan | `OAUTH_ALLOWED_DOMAINS` | `OAUTH_REQUIRE_APPROVAL` |
| --- | --- | --- |
| Hanya karyawan domain tertentu auto-approved | `bawabawa.id` | `true` (default) |
| Siapapun bisa daftar, admin approve manual via `/admin/users` | _(kosong)_ | `true` (default) |
| Open sign-up tanpa approval (NOT recommended) | _(kosong)_ | `false` |

Sign-in pertama akan membuat row di tabel `users` dengan `status='pending'`
(kecuali user di domain whitelist atau approval di-disable). Backend menolak
login dengan kode `PENDING_APPROVAL` sampai admin manual switch `status='active'`.

### 3. Deploy ke Fly.io (rekomendasi)
```bash
# Sekali setup
fly auth login
fly launch --no-deploy --copy-config           # baca fly.toml di repo

# Postgres managed
fly postgres create --name bawabawa-db --region sin
fly postgres attach bawabawa-db                # auto-set DATABASE_URL

# Secrets
fly secrets set \
  JWT_ACCESS_SECRET=$(openssl rand -hex 32) \
  JWT_REFRESH_SECRET=$(openssl rand -hex 32) \
  GOOGLE_OAUTH_CLIENT_ID=xxxxxxxxxx.apps.googleusercontent.com \
  OAUTH_ALLOWED_DOMAINS=bawabawa.id \
  PUBLIC_SITE_URL=https://bawabawa.id \
  CORS_ALLOWED_ORIGINS=https://bawabawa.id

fly deploy
```

`fly.toml` sudah memuat `[deploy] release_command` yang menjalankan migrations
sebelum tiap deploy. Health check `/api/v1/health` dipakai oleh load balancer
untuk gating rollout.

### 4. Deploy ke Docker Compose / VPS
```bash
cp .env.example .env
# Isi semua field; minimum: DATABASE_URL, JWT_*_SECRET, GOOGLE_OAUTH_CLIENT_ID,
# PUBLIC_SITE_URL, CORS_ALLOWED_ORIGINS, OAUTH_ALLOWED_DOMAINS.

docker compose up -d db
docker compose run --rm api npm run migrate --workspace @erp/api
docker compose up -d api

curl https://your-host/api/v1/health
```

Atau pakai single-container `Dockerfile` di repo root (Railway/Render/Cloud Run):
```bash
docker build -t bawabawa-id .
docker run --rm -p 3000:3000 --env-file .env bawabawa-id
```

### Production env validation
`apps/api/src/config/env.ts` memvalidasi env saat startup. Kalau
`NODE_ENV=production` tapi salah satu hilang/invalid, server crash sebelum
listen — tidak akan ada deploy yang silent-misconfigured:
- `JWT_ACCESS_SECRET` (≥16 chars)
- `JWT_REFRESH_SECRET` (≥16 chars)
- `DATABASE_URL` (valid URL)
- `GOOGLE_OAUTH_CLIENT_ID` (≥10 chars)
- `DEMO_MODE` ≠ `true`

## API Examples
- `GET  /api/v1/auth/config` — public, dipakai frontend untuk decide sign-in surfaces
- `POST /api/v1/auth/google` — `{ idToken }` → `{ accessToken, refreshToken, user }`
- `GET  /api/v1/auth/me`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `POST /api/v1/erp/sync`
- `GET  /api/v1/rbac/me/permissions`
- `POST /api/v1/orders`
- `POST /api/v1/orders/:id/payments`
- `POST /api/v1/orders/:id/reserve-stock`
- `POST /api/v1/orders/:id/invoice`
- `POST /api/v1/orders/:id/post-finance`
- `POST /api/v1/whatsapp/messages/send`
- `POST /api/v1/import/products`
- `GET  /api/v1/reports/sales.xlsx`
- `GET  /api/v1/cms/settings/public` — brand/SEO untuk hydration tanpa auth
- `GET  /sitemap.xml`, `GET /robots.txt` — di-render dari CMS

## Hosting terpisah (frontend di CDN, API di Fly/VPS)
- **Opsi 1 (paling gampang)**: tetap serve `index.html` dari Express (single-container) → no CORS, no extra config.
- **Opsi 2 (frontend & API beda domain)**:
  - Set backend `CORS_ALLOWED_ORIGINS` ke origin frontend.
  - Di browser, set `localStorage.erp_api_base` ke base API production (contoh: `https://api.bawabawa.id/api/v1`), atau isi field di halaman Settings.
  - Pastikan Authorized JavaScript origins di Google OAuth Client mencakup origin frontend.
