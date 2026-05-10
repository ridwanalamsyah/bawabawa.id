# Panduan Deploy bawabawa.id (Free Tier)

Panduan ini menjelaskan cara menerbitkan website bawabawa.id ke produksi
**tanpa biaya bulanan** menggunakan kombinasi Vercel (frontend), Fly.io
(backend), Neon (Postgres), dan Cloudflare R2 (penyimpanan gambar).

> Estimasi total waktu: **45–60 menit** untuk deploy pertama kali.
>
> Stack ini sengaja dipilih supaya semuanya punya **paket gratis permanen**,
> custom domain, SSL otomatis, dan cukup untuk traffic awal sampai ribuan
> pengunjung per hari.

---

## Ringkasan Arsitektur

```
                ┌──────────────────────────┐
                │  bawabawa.id (Vercel)    │  ← landing page + admin SPA
                └────────────┬─────────────┘
                             │ HTTPS (CORS allowed)
                             ▼
                ┌──────────────────────────┐
                │  api.bawabawa.id (Fly)   │  ← Express API (Node 22)
                └────────────┬─────────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        ┌──────────┐  ┌─────────────┐  ┌──────────────┐
        │ Neon     │  │ Cloudflare  │  │ Google OAuth │
        │ Postgres │  │ R2 (gambar) │  │ (sign-in)    │
        └──────────┘  └─────────────┘  └──────────────┘
```

---

## Prasyarat (Persiapkan Dulu)

Sebelum mulai, siapkan akun gratis di:

| Layanan | URL | Kegunaan |
|---|---|---|
| **GitHub** | https://github.com | Repository sumber (sudah ada) |
| **Vercel** | https://vercel.com/signup | Hosting frontend |
| **Fly.io** | https://fly.io/app/sign-up | Hosting backend |
| **Neon** | https://neon.tech | Database Postgres |
| **Cloudflare** | https://dash.cloudflare.com/sign-up | Storage R2 (opsional, untuk gambar) |
| **Google Cloud** | https://console.cloud.google.com | OAuth Sign-In |

Pastikan juga **domain `bawabawa.id`** sudah Anda miliki dan bisa diatur DNS-nya.

Tools yang perlu terpasang di komputer Anda:

```bash
# Node.js 20+
node --version   # harus ≥ 20

# Git
git --version

# Fly.io CLI (akan dipakai di Langkah 4)
curl -L https://fly.io/install.sh | sh
```

---

## Langkah 1 — Siapkan Database (Neon)

Neon menawarkan Postgres serverless gratis selamanya (0.5 GB storage,
otomatis sleep saat idle).

1. Buka **https://console.neon.tech/app/projects** → **New Project**.
2. Pilih:
   - **Project name**: `bawabawa-id`
   - **Postgres version**: 16 (atau terbaru)
   - **Region**: pilih yang terdekat dengan user Anda. Untuk Indonesia,
     **Singapore** atau **Tokyo** ideal. Region ini juga harus sama dengan
     region Fly.io di Langkah 4 supaya latensi rendah.
3. Setelah project dibuat, klik **Connection Details** dan salin:
   - **Connection string** (format: `postgres://user:password@host/dbname?sslmode=require`)
4. Simpan connection string ini. Kita pakai di Langkah 4 sebagai `DATABASE_URL`.
5. Jalankan migrasi awal — Neon menyediakan SQL editor di dashboard:

   - Klik tab **SQL Editor** di project Neon Anda.
   - Buka file `infra/sql/0001_init.sql` dari repo lokal Anda.
   - Salin semua isinya, paste ke SQL Editor, klik **Run**.
   - Ulangi untuk setiap file di `infra/sql/` secara berurutan
     (`0002_*`, `0003_*`, dst).

> **Tips:** Jika ada banyak file SQL, gunakan `psql` lokal:
>
> ```bash
> for f in infra/sql/*.sql; do psql "$NEON_URL" -f "$f"; done
> ```

---

## Langkah 2 — Setup Google OAuth

1. Buka **https://console.cloud.google.com/apis/credentials**.
2. Pilih atau buat project (mis. `bawabawa-id`).
3. Klik **Create Credentials** → **OAuth client ID**.
   - Application type: **Web application**
   - Name: `bawabawa-id-web`
   - **Authorized JavaScript origins** (PENTING):
     ```
     https://bawabawa.id
     https://www.bawabawa.id
     ```
     (Tambahkan juga `http://localhost:5173` jika perlu development.)
   - **Authorized redirect URIs**: kosongkan (kita pakai ID-token flow).
4. Klik **Create**, salin **Client ID** (format `xxx.apps.googleusercontent.com`).
   Simpan untuk Langkah 4.

---

## Langkah 3 — (Opsional) Setup Cloudflare R2 untuk Gambar

R2 memberikan 10 GB storage gratis dan tidak ada biaya egress. Cocok
untuk menyimpan gambar produk, logo, dan aset OG.

1. Login ke **https://dash.cloudflare.com**.
2. Pilih **R2** dari sidebar → **Create bucket**.
   - Bucket name: `bawabawa-media`
   - Location: **Asia-Pacific** atau **automatic**
3. Setelah bucket dibuat, klik tab **Settings** → **Public Access** →
   aktifkan **Allow Access**. Salin **Public bucket URL**
   (format: `https://pub-xxx.r2.dev`).
4. Klik **Manage R2 API Tokens** → **Create API Token**:
   - Permissions: **Object Read & Write**
   - Bucket: `bawabawa-media`
5. Salin **Access Key ID**, **Secret Access Key**, dan **Endpoint URL**.

> Untuk versi awal Anda **boleh skip langkah ini**. Frontend bisa pakai URL
> gambar langsung dari sumber publik (Imgur, Unsplash, dsb). Aktifkan R2
> ketika Anda butuh upload gambar dari admin panel.

---

## Langkah 4 — Deploy Backend ke Fly.io

Fly.io memberikan 3 VM kecil + 3 GB volume gratis selamanya.

```bash
# Login ke Fly.io
fly auth login

# Dari root repo, launch app baru
fly launch --name bawabawa-id-api --region sin --no-deploy
```

Saat prompt:
- **App name**: `bawabawa-id-api` (atau nama unik lain)
- **Region**: `sin` (Singapore — terdekat dengan Indonesia)
- **Postgres**: **No** (kita pakai Neon)
- **Redis**: **No**
- **Deploy now**: **No**

Ini akan membuat (atau memperbarui) `fly.toml` di root repo. Pastikan
isinya seperti ini:

```toml
app = "bawabawa-id-api"
primary_region = "sin"

[build]

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 256
```

Set **environment variables** sebagai Fly secrets:

```bash
# Generate JWT secrets
JWT_ACCESS=$(openssl rand -hex 32)
JWT_REFRESH=$(openssl rand -hex 32)

fly secrets set \
  NODE_ENV=production \
  PORT=3000 \
  PUBLIC_SITE_URL=https://bawabawa.id \
  CORS_ALLOWED_ORIGINS=https://bawabawa.id,https://www.bawabawa.id \
  DATABASE_URL="postgres://..." \
  JWT_ACCESS_SECRET="$JWT_ACCESS" \
  JWT_REFRESH_SECRET="$JWT_REFRESH" \
  GOOGLE_OAUTH_CLIENT_ID="xxx.apps.googleusercontent.com" \
  OAUTH_ALLOWED_DOMAINS=bawabawa.id \
  --app bawabawa-id-api
```

Jika Anda set up R2 di Langkah 3, tambahkan:

```bash
fly secrets set \
  R2_ENDPOINT="https://xxx.r2.cloudflarestorage.com" \
  R2_ACCESS_KEY_ID="..." \
  R2_SECRET_ACCESS_KEY="..." \
  R2_BUCKET=bawabawa-media \
  R2_PUBLIC_BASE_URL="https://pub-xxx.r2.dev" \
  --app bawabawa-id-api
```

Deploy:

```bash
fly deploy --app bawabawa-id-api
```

Setelah deploy selesai, cek:

```bash
fly status --app bawabawa-id-api
curl https://bawabawa-id-api.fly.dev/healthz
# Harus respon: {"status":"ok",...}
```

### Custom Domain untuk API (opsional tapi direkomendasikan)

```bash
fly certs add api.bawabawa.id --app bawabawa-id-api
fly certs show api.bawabawa.id --app bawabawa-id-api
```

Tambahkan record DNS sesuai instruksi yang ditampilkan (biasanya CNAME
`api.bawabawa.id` → `bawabawa-id-api.fly.dev`).

---

## Langkah 5 — Deploy Frontend ke Vercel

1. Login ke **https://vercel.com/new**.
2. **Import Git Repository** → pilih `ridwanalamsyah/bawabawa.id`.
3. Konfigurasi:
   - **Framework Preset**: Vite
   - **Root Directory**: `apps/web`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install --prefix ../..`
4. Tambahkan **Environment Variables**:
   ```
   VITE_API_BASE_URL=https://api.bawabawa.id/api/v1
   ```
   (Atau `https://bawabawa-id-api.fly.dev/api/v1` jika belum pakai
   custom domain.)
5. Klik **Deploy**. Tunggu ~2 menit.

### Custom Domain (Vercel)

1. Setelah deploy berhasil, buka tab **Settings** → **Domains**.
2. Tambah `bawabawa.id` dan `www.bawabawa.id`.
3. Vercel akan menampilkan record DNS yang harus ditambahkan
   (umumnya `A` record `76.76.21.21` untuk apex, dan `CNAME`
   `cname.vercel-dns.com` untuk subdomain).
4. Tambahkan record di provider DNS Anda. SSL otomatis aktif setelah
   verifikasi (~5 menit).

---

## Langkah 6 — Verifikasi Akhir

Setelah semua deploy selesai, lakukan smoke test:

```bash
# 1. API healthcheck
curl https://api.bawabawa.id/api/v1/auth/config
# Harus respon: {"success":true,"data":{"googleClientId":"...","demoMode":false,"allowEmailLogin":false}}

# 2. Frontend
open https://bawabawa.id
# - Landing page tampil
# - Klik "Masuk" → tombol Google Sign-In muncul
# - Coba sign in dengan akun Google Anda yang masuk OAUTH_ALLOWED_DOMAINS
```

Checklist sebelum diumumkan:

- [ ] Frontend dapat diakses via `https://bawabawa.id`
- [ ] API merespon di `https://api.bawabawa.id/api/v1/auth/config`
- [ ] Google Sign-In berhasil → user terdaftar di tabel `users` (cek lewat Neon SQL Editor)
- [ ] Setelah login, dashboard menampilkan KPI real (Penjualan, Produk Terlaris, dll)
- [ ] CMS admin (`/admin/cms/settings`) bisa diedit dan perubahan ter-sinkron ke landing page
- [ ] Robots.txt & Sitemap.xml tersedia (`https://bawabawa.id/robots.txt`)

---

## Langkah 7 — Monitoring & Backup (Direkomendasikan)

Free tier yang bisa langsung dihubungkan:

### Sentry (error monitoring)
1. Daftar di **https://sentry.io/signup/** (paket free 5K events/bulan).
2. Buat project Node.js untuk backend dan project React untuk frontend.
3. Copy **DSN** masing-masing, tambahkan ke env:
   - Backend (Fly secret): `SENTRY_DSN=...`
   - Frontend (Vercel env): `VITE_SENTRY_DSN=...`

### UptimeRobot (uptime monitoring)
1. Daftar di **https://uptimerobot.com** (50 monitor gratis).
2. Tambah monitor HTTP(S) ke:
   - `https://bawabawa.id` (frontend)
   - `https://api.bawabawa.id/api/v1/auth/config` (backend healthcheck)
3. Set interval 5 menit, dan email Anda sebagai contact.

### Backup Database (Neon)
Neon free tier sudah include **point-in-time recovery 7 hari**. Untuk
backup manual mingguan:

```bash
pg_dump "$DATABASE_URL" > backup-$(date +%Y%m%d).sql
# Upload ke R2 atau Google Drive
```

Tambahkan sebagai cron job di Fly.io atau GitHub Actions schedule.

---

## Pemeliharaan Rutin

| Frekuensi | Aktivitas |
|---|---|
| **Setiap deploy** | Tag commit di Git (`git tag v1.0.x && git push --tags`) |
| **Mingguan** | Review error log Sentry, backup database |
| **Bulanan** | Update dependency (`npm outdated`), rotate JWT secrets jika perlu |
| **Quartalan** | Review traffic & resource usage di Vercel/Fly/Neon dashboard |

---

## Troubleshooting

### Frontend dapat diakses, tapi sign-in tidak bekerja

- Cek **Authorized JavaScript origins** di Google Cloud Console — pastikan
  domain produksi (`https://bawabawa.id`) sudah ditambahkan.
- Buka DevTools → Network → cek request ke `/auth/config`. Jika 404 atau
  CORS error, berarti `VITE_API_BASE_URL` di Vercel salah, atau
  `CORS_ALLOWED_ORIGINS` di Fly belum mencakup origin frontend.

### Dashboard menampilkan 0 di semua KPI

- Database belum berisi data. Login ke Neon → SQL Editor → jalankan seed
  data dari `infra/sql/seed/` jika ada, atau buat data via UI admin.

### `fly deploy` gagal dengan "out of memory"

- Tingkatkan memory di `fly.toml`:
  ```toml
  [[vm]]
    memory_mb = 512
  ```
  Free tier Fly.io termasuk hingga 256 MB × 3 VM. Untuk 1 VM 512 MB tetap
  free, tapi ≥768 MB total akan kena charge.

### Vercel build error: "Cannot find module @erp/shared"

- Pastikan **Install Command** di Vercel di-set ke `npm install --prefix ../..`
  agar workspace dependencies ter-resolve.

---

## Biaya Estimasi

Untuk traffic awal (≤10K pengunjung/bulan), seluruh stack ini **gratis**.

| Layanan | Free Tier Limit | Saat Mulai Berbayar |
|---|---|---|
| Vercel Hobby | 100 GB bandwidth | > 100 GB/bulan |
| Fly.io | 3 VM × 256 MB | Tambahan VM atau RAM > 256 MB |
| Neon | 0.5 GB DB, 100 jam compute | DB > 0.5 GB |
| Cloudflare R2 | 10 GB storage, $0 egress | > 10 GB |
| Google OAuth | Unlimited untuk login standar | — |
| Sentry | 5K events/bulan | > 5K events |
| UptimeRobot | 50 monitor, 5 menit interval | Interval lebih sering |

Total perkiraan biaya saat traffic Anda tumbuh ke 50K-100K MAU:
**~$10–25/bulan** (terutama untuk upgrade Neon dan Fly.io VM).

---

## Pertanyaan?

Lihat `README.md` untuk dokumentasi development lokal, atau buka issue
di GitHub repository untuk masalah deployment spesifik.

Selamat publish! 🚀
