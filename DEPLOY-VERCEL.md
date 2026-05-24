# Deploy Bawabawa.id — All-Vercel Free Tier (no credit card)

This is the **no-CC deployment path**. All three services (public site, ERP web SPA, ERP API) run on **Vercel Hobby**, with the database on **Neon Free**. Total monthly cost: **Rp 0**, no credit card required.

| Layer | Project name | Root Directory | Notes |
|---|---|---|---|
| Public site (Next.js 16) | `bawabawa-site` | `apps/site` | First-class Next.js host. |
| ERP web (Vite SPA, internal) | `bawabawa-web` | `apps/web` | Static export. |
| ERP API (Express) | `bawabawa-api` | `apps/api` | Wrapped as a single Vercel serverless function via `api/index.ts`. |
| Postgres | Neon project `bawabawa` | — | `DATABASE_URL` only piece API needs. |

> **Why not Render / Koyeb?** As of May 2026 both require a credit card for Blueprint / Web Service deploys, even on the free plan. Vercel Hobby does not.

---

## Pre-generated secrets (copy these as-is)

```env
JWT_ACCESS_SECRET=acb62a2fb3b29763945ed5be7aea6fd724a5ac1373a0514fa143195dfa295bd9
JWT_REFRESH_SECRET=f0976a4c7aa35525a5579617d14337e543ae821f22492033878d8e9274d72a52
SESSION_JWT_SECRET=74a552266aaf8117b0b4c6cf8a29d03481453b732aef9d14f147b2afb9e7fab5
ERP_WEBHOOK_SECRET=baa18bdfb582b4732965f991b1dc33306a78818734afb95d
```

All four are random 32-byte hex strings, safe to use directly.

---

## One-time setup (≈20 minutes total)

### 1. Provision the database (Neon, ~3 min)

If you already created the `bawabawa` Neon project, skip to step 2. Otherwise:

1. Sign up at https://console.neon.tech/signup with GitHub.
2. Create project: name `bawabawa`, region **AWS Asia Pacific (Singapore)**, Postgres 16.
3. From the dashboard, copy the **pooled** connection string. Format:
   `postgresql://neondb_owner:npg_…@ep-…-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`
4. Save it as `DATABASE_URL` — paste it into the API project later.

> **Migrations already applied?** This repo's 15 migrations were applied to the existing `bawabawa` Neon project. You only re-run them when new migration files are added in `apps/api/src/infrastructure/db/migrations/`.

---

### 2. Deploy the ERP API (Vercel, ~7 min)

1. Sign up / log in at https://vercel.com/signup with GitHub.
2. **Add New… → Project** → import `ridwanalamsyah/bawabawa.id`.
3. **Project Name:** `bawabawa-api`.
4. **Root Directory:** click the `Edit` button next to "Root Directory" and set it to **`apps/api`**. Don't forget the prefix — Vercel doesn't auto-detect monorepo subfolders.
5. **Framework Preset:** `Other`. Vercel won't auto-detect Express — that's expected. The `vercel.json` at `apps/api/vercel.json` handles the build.
6. **Environment Variables** — paste these one by one (Add → Key + Value):

   ```env
   NODE_ENV=production

   # Database (Neon pooled URL from step 1)
   DATABASE_URL=postgresql://neondb_owner:npg_DR17rywVdBub@ep-nameless-violet-aol57e24-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

   # JWT secrets
   JWT_ACCESS_SECRET=acb62a2fb3b29763945ed5be7aea6fd724a5ac1373a0514fa143195dfa295bd9
   JWT_REFRESH_SECRET=f0976a4c7aa35525a5579617d14337e543ae821f22492033878d8e9274d72a52

   # Required-in-production placeholder. Replace with a real Google OAuth
   # Client ID later when you wire Google sign-in. Email/password login is
   # disabled in production (by design), but all other endpoints still work.
   GOOGLE_OAUTH_CLIENT_ID=placeholder.apps.googleusercontent.com

   # Webhook signing (used when ERP fires updates toward the public site)
   ERP_WEBHOOK_SECRET=baa18bdfb582b4732965f991b1dc33306a78818734afb95d

   # CORS — leave blank for now, fill in once site + web URLs are known:
   # CORS_ALLOWED_ORIGINS=https://bawabawa-site.vercel.app,https://bawabawa-web.vercel.app

   # Optional integrations (leave empty for MVP):
   # DOKU_CLIENT_ID=
   # DOKU_SECRET_KEY=
   # DOKU_IS_PRODUCTION=false
   # BLOB_READ_WRITE_TOKEN=vercel_blob_rw_…
   # RESEND_API_KEY=
   # RESEND_FROM_EMAIL=
   # FONNTE_DEVICE_TOKEN=
   # BITESHIP_API_KEY=
   ```

7. Click **Deploy**. Vercel runs the build (~2–4 min). Once green, copy the production URL — looks like `https://bawabawa-api.vercel.app`.
8. Smoke-test: `https://bawabawa-api.vercel.app/api/v1/health` should return `{"success":true,"data":{"status":"ok"}}`.

> **Cold start expectation:** First hit after ~10 minutes of idle is ~1–2 s while the lambda spins up. Subsequent hits within the warm window are <100 ms. No need for a keep-warm ping — Neon's pooler keeps DB connections cheap and Vercel's lambda revival is fast.

---

### 3. Deploy the public site (Vercel, ~5 min)

1. **Add New… → Project** → import the same repo again.
2. **Project Name:** `bawabawa-site`.
3. **Root Directory:** `apps/site`.
4. **Framework Preset:** `Next.js` (auto-detected).
5. **Environment Variables:**

   ```env
   # Where to call the ERP API (URL from step 2)
   ERP_API_BASE_URL=https://bawabawa-api.vercel.app

   # Site-level session signing
   SESSION_JWT_SECRET=74a552266aaf8117b0b4c6cf8a29d03481453b732aef9d14f147b2afb9e7fab5

   # ERP webhook receiver verifies this HMAC
   ERP_WEBHOOK_SECRET=baa18bdfb582b4732965f991b1dc33306a78818734afb95d

   # Public URL (used in canonical tags, OG, sitemap)
   NEXT_PUBLIC_SITE_URL=https://bawabawa-site.vercel.app
   ```

6. Click **Deploy**. ~2 min.
7. Smoke-test: open `https://bawabawa-site.vercel.app` — landing page should load with hero, KPI cards, glass surfaces.
8. Test auth gate: `https://bawabawa-site.vercel.app/admin` → redirects to `/login?next=/admin`.
9. Test login: `aulia.putri@example.com` / `password` (customer) and `indra@bawabawa.id` / `password` (owner). Mock auth handles these because ERP email/password is disabled in production until Google OAuth is configured.

---

### 4. Deploy the ERP web SPA (Vercel, ~3 min)

1. **Add New… → Project** → import the same repo again.
2. **Project Name:** `bawabawa-web`.
3. **Root Directory:** `apps/web`.
4. **Framework Preset:** `Vite` (auto-detected).
5. **Environment Variables:**

   ```env
   VITE_API_BASE_URL=https://bawabawa-api.vercel.app
   ```

6. Click **Deploy**. ~2 min.
7. Open `https://bawabawa-web.vercel.app` — should load the ERP login screen.

---

### 5. Tighten CORS on the API

Back in the **bawabawa-api** project → Settings → Environment Variables → add:

```env
CORS_ALLOWED_ORIGINS=https://bawabawa-site.vercel.app,https://bawabawa-web.vercel.app
```

Click **Save**, then in the Deployments tab → … → **Redeploy** the latest commit.

---

## Verification checklist

After all four services are live:

- [ ] `https://bawabawa-api.vercel.app/api/v1/health` → 200 `{"status":"ok"}`
- [ ] `https://bawabawa-api.vercel.app/api/v1/inventory/items` → 200 (returns ERP list, may be empty until seeded)
- [ ] `https://bawabawa-site.vercel.app/` → landing page renders, glass + gradient visible
- [ ] `https://bawabawa-site.vercel.app/admin` → 307 redirect to `/login?next=/admin`
- [ ] `https://bawabawa-site.vercel.app/login` → log in with `indra@bawabawa.id` / `password` → lands on `/admin` dashboard
- [ ] `https://bawabawa-web.vercel.app/` → ERP login screen renders

---

## What's NOT set up yet (Phase 3+ work)

- **Google OAuth** — placeholder client ID is in env. Real users can't self-register until you create a Google Cloud OAuth client and replace `GOOGLE_OAUTH_CLIENT_ID`.
- **DOKU Checkout** — payment routes are wired but keys are empty. UI shows mock checkout. Provide DOKU sandbox `CLIENT_ID` + `SECRET_KEY` when ready.
- **Vercel Blob** — admin uploads return 503 until `BLOB_READ_WRITE_TOKEN` is set (Vercel Dashboard → Storage → Blob → Connect Project).
- **Resend (email)** + **Fonnte (WhatsApp)** — same pattern; transactional notifications skip until keys are present.
- **Biteship (shipping)** — same pattern; tracking webhooks no-op until key is present.

---

## Updating the deploy

Every `git push` to `main` triggers an automatic redeploy on all three Vercel projects (Vercel watches the GitHub branch). To deploy from a feature branch, open a Pull Request — Vercel posts a preview URL per project per PR.
