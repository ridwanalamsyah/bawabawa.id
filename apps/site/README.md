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

Lihat `src/lib/erp-client.ts` untuk klien HTTP minimal yang dipakai oleh
route handler di sisi server. Pola umum: panggil `erpSafe()` dulu, kalau ERP
tidak menjawab dalam timeout pendek, fallback ke mock dataset di
`src/lib/mock/*` supaya halaman tetap render. Contoh:

- `GET /api/health` → probe `GET /api/v1/health` di ERP, fallback `status: "fallback"`
- `POST /api/auth/login` → forward ke `POST /api/v1/auth/login`, fallback ke mock account demo
- `GET /api/orders` → forward ke `GET /api/v1/orders`, fallback ke `src/lib/mock/orders`

Konfigurasi via env (lihat `.env.example`):

```
ERP_API_BASE_URL=http://localhost:4000
ERP_API_TOKEN=...
NEXT_PUBLIC_SITE_URL=https://bawabawa.id
```

Route handler lain (`/api/trips`, `/api/customers`, `/api/analytics/overview`,
`/api/webhooks/erp`, `/api/events/stream`) tinggal mengikuti pola yang sama
ketika modul ERP-nya siap.

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
