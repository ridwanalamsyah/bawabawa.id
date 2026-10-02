# @erp/site — Bawabawa.id Public Website

Public marketing + customer site untuk Bawabawa.id (jasa titip Bandung →
Samarinda). Dibangun di atas Next.js 16 App Router, React 19, TailwindCSS v4,
Framer Motion, dan Radix Primitives.

Site ini menjadi bagian dari monorepo ERP yang sama (`apps/site` di samping
`apps/api` dan `apps/web`). Tujuan: experience publik (landing, request titip,
open trip, dashboard customer) konsisten secara visual dan operasional dengan
ERP internal.

## Halaman utama

| Route | Deskripsi |
| --- | --- |
| `/` | Landing cinematic — hero, live stats, kategori, testimonial, FAQ |
| `/open-trip` | Daftar jadwal trip Bandung → Samarinda dengan filter status |
| `/request` | Multi-step request barang + kalkulator fee + ringkasan |
| `/dashboard` | Dashboard customer: tracking, orders, invoice, wishlist, chat |
| `/admin` | Console internal: orders, trips, customers, payments, analytics, ERP, CMS, support, roles |

API routes ada di `src/app/api/*` — route `route.ts` mengikuti konvensi
Next.js 16 (Web `Request` / `Response`, async `params`/`searchParams`).

## ERP integration

Semua data asli datang dari ERP (`apps/api`) lewat `src/lib/erp-client.ts`.
Tidak ada lagi fallback ke data mock di halaman pelanggan — kalau ERP tidak
menjawab, halaman menampilkan empty/error state yang jujur.

Alur pemesanan:

| Halaman | Route handler | ERP endpoint |
| --- | --- | --- |
| `/request`, `/katalog/checkout` | `POST /api/orders` | `POST /api/v1/public/order-requests` |
| `/track/[token]` | `GET /api/order-requests/[token]` (+ `/approve`, `/cancel`) | `/api/v1/public/order-requests/:token` |
| `/katalog` | server component | `GET /api/v1/catalog`, `GET /api/v1/trips` |
| `/dashboard` | `GET /api/order-requests/mine` | `GET /api/v1/order-requests/mine` |
| `/admin/orders`, `/admin/payments` | `/api/admin/order-requests/*` | `/api/v1/admin/orders/requests/*` |
| `/admin/catalog` | `/api/admin/catalog/*`, `/api/admin/uploads` | `/api/v1/admin/catalog/*`, `/api/v1/uploads` |

Token ERP (access + refresh) hanya disimpan di cookie httpOnly
(`bb_erp_token`, `bb_erp_refresh`) dan di-refresh otomatis oleh `src/proxy.ts`
dan BFF (`src/lib/erp-authed-fetch.ts`) — tidak pernah dikirim ke JavaScript browser.

Konfigurasi via env:

```
ERP_API_BASE_URL=https://bawabawa-api.vercel.app
SESSION_JWT_SECRET=<openssl rand -hex 32>
ERP_WEBHOOK_SECRET=<sama dengan di API>   # HMAC ERP → site, header x-bawabawa-signature + x-bawabawa-timestamp
SITE_PROXY_SECRET=<sama dengan di API>    # rate-limit per pembeli, bukan per server
NEXT_PUBLIC_SITE_URL=https://bawabawa.id
NEXT_PUBLIC_WA_NUMBER=62812xxxxxxx
NEXT_PUBLIC_PPN_ENABLED=false             # true hanya jika sudah PKP
NEXT_PUBLIC_KILAT_PER_KG=                 # tarif Kilat per kg; kosong = tier Kilat disembunyikan
NEXT_PUBLIC_KILAT_MIN_KG=1                # berat minimum tagihan Kilat
NEXT_PUBLIC_PICKUP_POINT=                 # alamat titik ambil sendiri; kosong = opsi ambil sendiri disembunyikan
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=             # aktifkan event funnel (lib/analytics.ts)
```

`NEXT_PUBLIC_KILAT_*` harus sama dengan `KILAT_*` di API — API tetap jadi
sumber harga final, situs hanya menampilkan estimasi.

## Local dev

Dari root repo:

```bash
npm install
npm run dev --workspace @erp/site     # http://localhost:3100
```

Atau jalankan API + site bersamaan:

```bash
npm run dev --workspace @erp/api      # http://localhost:4000
npm run dev --workspace @erp/site     # http://localhost:3100
```

## Lint / typecheck / build

Site mengikuti workspace scripts standard di repo ini. CI menjalankan keempat
script ini lewat `npm run <script> --workspaces --if-present`:

```bash
npm run lint --workspace @erp/site
npm run typecheck --workspace @erp/site
npm run build --workspace @erp/site
```

## Design system

Palet sage / olive / cream / emerald didefinisikan sebagai HSL CSS variables di
`src/app/globals.css`. Theme provider di `src/components/theme/theme-provider.tsx`
menyimpan preferensi user di `localStorage` (`bawabawa-theme`) dan menyinkronkan
dengan `prefers-color-scheme`.
