# Publish Production End-to-End (Cloud)

## 1) Siapkan Cloud Server
- Provision VM Linux (Ubuntu 22.04+), minimal 2 vCPU dan 4 GB RAM.
- Install Docker Engine dan Docker Compose plugin.
- Install reverse proxy (Nginx/Caddy), aktifkan HTTPS dengan Let's Encrypt.

## 2) Ambil Source dan Konfigurasi
- Clone repository ke server.
- Buat file environment:
  - `cp .env.example .env.production`
- Isi nilai production:
  - `JWT_ACCESS_SECRET`
  - `JWT_REFRESH_SECRET`
  - `DATABASE_URL`
  - `VITE_API_BASE_URL`
  - `CORS_ALLOWED_ORIGINS`
- Jangan simpan secret di source code, gunakan secret manager atau env server.

## 3) Jalankan Migration
- Jalankan migration agar schema sinkron:
  - `npm run migrate --workspace @erp/api`

## 4) Build dan Deploy Container
- Build image production:
  - `docker compose -f docker-compose.yml build`
- Jalankan service:
  - `docker compose -f docker-compose.yml up -d`

## 5) Validasi Setelah Deploy
- Health check:
  - `GET /api/v1/health` harus `success: true`
  - `GET /api/v1/health/ready` harus `db: up`
  - `GET /api/v1/metrics` harus mengembalikan metrik request.
- Cek UI:
  - Login berhasil.
  - Akses modul `/sales`, `/inventory`, `/procurement`, `/finance`, `/crm`, `/hr`, `/admin`.

## 6) Release Gate Sebelum Go-Live
- Lulus `npm run typecheck`.
- Lulus `npm run test`.
- Lulus `npm run build`.
- Dependency security audit tidak ada temuan critical/high yang belum ditangani.

## 7) Operasional Harian di Cloud
- Semua transaksi berjalan lewat API ke database cloud (bukan hardcoded file lokal).
- Pantau latency, error rate, dan kesehatan DB setiap hari.
- Siapkan rollback deployment plan untuk rilis berikutnya.
