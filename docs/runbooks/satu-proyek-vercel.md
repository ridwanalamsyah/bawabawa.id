# Satu proyek Vercel: situs + API

Sejak perubahan ini, proyek Vercel **`bawabawa-id`** (Root Directory `apps/site`)
juga menjalankan API ERP (`apps/api`). API tersedia di domain yang sama:

    https://bawabawa-id.vercel.app/api/v1/...

Proyek lama **`bawabawa-id-api`** tidak dibutuhkan lagi, tetapi **jangan dihapus**
sebelum langkah 1–5 di bawah selesai dan situs sudah dicek berjalan normal di
produksi.

## Cara kerjanya (singkat)

- `apps/api` dikompilasi ke `apps/api/dist` saat build situs (`prebuild`).
- Server Next.js menyalakan aplikasi Express itu di dalam proses yang sama
  (`apps/site/src/lib/erp-internal.ts`).
- `apps/site/src/app/api/v1/[...path]/route.ts` meneruskan setiap request
  `/api/v1/*` ke Express apa adanya — semua rute, middleware auth, rate limit,
  validasi, upload, dan webhook bertanda tangan tetap sama.
- Route BFF situs (`/api/...`) memanggil Express langsung di server, tanpa
  lewat internet dan tanpa CORS.
- Cron harian `/api/v1/cron/run` kini didaftarkan di `apps/site/vercel.json` (01.30 UTC).

## Langkah untuk pemilik

1. **Salin env** dari proyek `bawabawa-id-api` ke proyek `bawabawa-id`
   (Settings → Environment Variables). Salin nilainya langsung di dashboard
   Vercel; jangan ditulis di chat atau kode.

   Wajib:
   - `DATABASE_URL`
   - `JWT_ACCESS_SECRET`
   - `JWT_REFRESH_SECRET`
   - `GOOGLE_OAUTH_CLIENT_ID`
   - `CRON_SECRET`
   - `SITE_PROXY_SECRET` (biasanya sudah ada di `bawabawa-id`; nilainya harus sama)

   Salin bila ada di proyek lama:
   - Login: `OAUTH_ALLOWED_DOMAINS`, `OAUTH_REQUIRE_APPROVAL`, `PUBLIC_SIGNUP`,
     `DEMO_MODE`, `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD`,
     `BOOTSTRAP_ADMIN_NAME`, `BOOTSTRAP_ADMIN_DIVISION`
   - Upload gambar: `BLOB_READ_WRITE_TOKEN` (atau hubungkan Blob store yang
     sama ke proyek `bawabawa-id`)
   - Ongkir BiteShip: `BITESHIP_API_KEY`, `BITESHIP_WEBHOOK_TOKEN`, `BITESHIP_BASE_URL`
   - Pembayaran DOKU: `DOKU_CLIENT_ID`, `DOKU_SECRET_KEY`, `DOKU_IS_PRODUCTION`
   - Email Resend: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_REPLY_TO`,
     `RESEND_WEBHOOK_SECRET`, `RESEND_BASE_URL`
   - WhatsApp Fonnte: `FONNTE_DEVICE_TOKEN`, `FONNTE_WEBHOOK_TOKEN`, `FONNTE_BASE_URL`
   - Rate limit bersama: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
     (atau `KV_REST_API_URL`, `KV_REST_API_TOKEN`)
   - Bisnis: `OPS_WHATSAPP_NUMBER`, `KILAT_PER_KG`, `KILAT_MIN_KG`,
     `PICKUP_POINT_ADDRESS`, `PPN_ENABLED`, `PAYMENT_INSTRUCTIONS`
   - Lain-lain: `PUBLIC_SITE_URL`, `TRUST_PROXY_HOPS`, `AUTO_MIGRATE`,
     `CORS_ALLOWED_ORIGINS` (hanya perlu bila ada aplikasi di domain lain yang
     memanggil API dari browser)

2. **Hapus** env `ERP_API_BASE_URL` dan `NEXT_PUBLIC_ERP_API_URL` dari proyek
   `bawabawa-id`. Selama `ERP_API_BASE_URL` masih ada, situs tetap memanggil
   proyek lama.

3. **Redeploy** proyek `bawabawa-id` (Deployments → … → Redeploy).

4. **Cek**:
   - `https://bawabawa-id.vercel.app/api/v1/health` → `{"success":true,"data":{"status":"ok"}}`
   - `https://bawabawa-id.vercel.app/api/v1/health/ready` → `"db":"up"`
   - Login admin dengan Google, buka pesanan, katalog, dan unggah satu gambar.
   - Kirim satu permintaan order uji dari `/request`.

5. **Ganti URL webhook** di dashboard layanan luar dari
   `https://bawabawa-id-api.vercel.app/api/v1/webhooks/...` ke
   `https://bawabawa-id.vercel.app/api/v1/webhooks/...`:
   DOKU (`/doku`), BiteShip (`/biteship`), Resend (`/resend`), Fonnte (`/fonnte`).

6. Setelah semuanya normal beberapa hari, proyek `bawabawa-id-api` boleh
   dihapus — terpisah, dengan persetujuan pemilik. Sampai saat itu cron harian
   berjalan di kedua proyek: proyek lama pukul 01.00 UTC, proyek gabungan pukul
   01.30 UTC. Jamnya sengaja dibedakan agar tidak bentrok; pesan yang sudah
   terkirim dan pengingat yang sudah dikirim tidak diulang.

## Pengembangan lokal

`npm run dev --workspace @erp/site` sudah ikut menjalankan API. Untuk memakai
API yang berjalan terpisah (`npm run dev --workspace @erp/api`), set
`ERP_API_BASE_URL=http://localhost:3000`.
