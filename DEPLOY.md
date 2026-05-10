# Deploy Bawabawa.id

Production stack runs on three free-tier services:

| Layer | Service | Free tier | Why |
|---|---|---|---|
| Public site (Next.js) | **Vercel Hobby** | 100 GB bandwidth, custom domain, auto-deploy from GitHub | First-class Next.js host, zero config |
| ERP web (Vite SPA) | **Vercel Hobby** | same | Same project family, simple |
| ERP API (Express) | **Render Web Service** | 750 h/month, sleeps 15 min idle | Docker out of the box |
| Postgres | **Neon** | 0.5 GB storage, scale-to-zero | `DATABASE_URL` is the only piece API needs |
| Redis (queue) | **Upstash Redis** | 10 k commands/day | Optional — only if `REDIS_URL` is set |
| File storage | **Cloudflare R2** | 10 GB free, no egress | Optional — for product photos / proof-of-delivery |

The whole stack costs **Rp 0/month** at MVP scale. Two caveats:

1. Render free tier sleeps after 15 minutes of no traffic — first hit after sleep takes ~30 s. Mitigate with a free **cron-job.org** ping to `/api/v1/health` every 10 minutes.
2. Neon free tier scales storage to zero after a few days idle — same wake-up cost (~5 s) on first query. Negligible for MVP.

## One-time setup (≈25 minutes)

### 1. Provision the database (Neon, ~3 min)

1. Sign up at https://console.neon.tech/signup with GitHub
2. Create project: name `bawabawa`, region **AWS Asia Pacific (Singapore)**, Postgres 16
3. From the project dashboard, copy the **pooled** connection string. It looks like `postgres://user:pass@ep-xxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`
4. Save it — you'll paste this as `DATABASE_URL` later.

### 2. Deploy the ERP API (Render, ~10 min)

1. Sign up at https://dashboard.render.com with GitHub
2. **New +** → **Blueprint** → connect this repo (`ridwanalamsyah/bawabawa.id`)
3. Render reads `render.yaml` and proposes one service: `bawabawa-api` (Docker)
4. Click **Apply** to create it
5. Once the service is created, open it → **Environment** tab → fill in:
   - `DATABASE_URL` — paste the Neon pooled connection string from step 1
   - `JWT_SECRET` — any random string ≥ 32 chars (`openssl rand -hex 32`)
   - `ALLOWED_ORIGINS` — comma-separated list of frontend URLs, e.g. `https://bawabawa-site.vercel.app,https://bawabawa-web.vercel.app`
   - `WEBHOOK_SECRET` — any random string ≥ 32 chars (used to sign webhooks fired toward the public site)
   - `BAWABAWA_SITE_WEBHOOK_URL` — the public site's webhook receiver, e.g. `https://bawabawa-site.vercel.app/api/webhooks/erp`
   - `MIDTRANS_SERVER_KEY` / `MIDTRANS_CLIENT_KEY` — from the Midtrans sandbox dashboard (set to `sandbox_dummy` if you want to skip payments for now)
   - `BITESHIP_API_KEY`, `FONNTE_TOKEN`, `RESEND_API_KEY` — optional integrations; leave blank to disable
6. Click **Save Changes** → Render redeploys
7. Run the migration once: in Render → **Shell** tab, run `node /app/apps/api/dist/infrastructure/db/migrate.js`. Subsequent deploys do not need this — only the very first time, or when new migration files are added.
8. Confirm `https://<your-render-url>.onrender.com/api/v1/health` returns `{ "status": "ok" }`

### 3. Deploy the public site (Vercel, ~5 min)

1. Sign up at https://vercel.com/signup with GitHub
2. **Add New…** → **Project** → import `ridwanalamsyah/bawabawa.id`
3. Vercel asks: "Where is your project?" → set **Root Directory = `apps/site`**
4. Framework auto-detected as **Next.js**. Don't override build / install commands — `apps/site/vercel.json` overrides them already to install from the monorepo root
5. **Environment Variables** (add for Production + Preview):
   - `ERP_API_BASE_URL` — `https://<your-render-url>.onrender.com/api/v1`
   - `BAWABAWA_WEBHOOK_SECRET` — same value you set as `WEBHOOK_SECRET` on Render
6. **Deploy**. Vercel gives you a URL like `bawabawa-id-site.vercel.app`. Copy it back into Render's `ALLOWED_ORIGINS` and `BAWABAWA_SITE_WEBHOOK_URL`.

### 4. Deploy the ERP internal web (Vercel, ~5 min)

1. Same Vercel account → **Add New…** → **Project** → import same repo (separate project)
2. Set **Root Directory = `apps/web`**
3. Framework auto-detected as **Vite**
4. **Environment Variables**:
   - `VITE_API_URL` — `https://<your-render-url>.onrender.com/api/v1`
5. **Deploy**. Copy the URL back into Render's `ALLOWED_ORIGINS`.

### 5. Keep Render warm (optional, ~2 min)

Render free tier sleeps after 15 min of inactivity. Free workaround:

1. Sign up at https://cron-job.org (free)
2. Create a job: title `bawabawa-warm`, URL `https://<your-render-url>.onrender.com/api/v1/health`, schedule **every 10 minutes**
3. Save. The API now stays awake during business hours.

## Continuous deployment

After the one-time setup, your workflow is:

```bash
git checkout -b devin/<your-branch>
# … edit files …
git commit -am "feat: ..."
git push origin devin/<your-branch>
# Open PR on GitHub
```

- Vercel auto-deploys a **preview URL** for every PR (both site + web projects).
- Render auto-deploys to production when you merge to `main` (default branch in `render.yaml`).
- The site uses tag-based ISR: when ERP fires events to `/api/webhooks/erp`, the corresponding cache tags are invalidated and the next request re-renders without a redeploy. See `apps/site/AUDIT.md` for the event ↔ tag map.

## Custom domain (when you're ready)

1. Buy `bawabawa.id` from your registrar
2. In Vercel **Settings → Domains** for the site project, add `bawabawa.id`
3. Add the CNAME record at the registrar pointing to `cname.vercel-dns.com`
4. Repeat for `app.bawabawa.id` → ERP web project, and `api.bawabawa.id` → an external HTTPS proxy in front of Render (or upgrade Render to paid for a custom domain)
5. Update `ALLOWED_ORIGINS` and `BAWABAWA_SITE_WEBHOOK_URL` on Render once the domain resolves

## Local development reminder

```bash
docker run -d --name bb-pg -p 5432:5432 \
  -e POSTGRES_USER=erp -e POSTGRES_PASSWORD=erp -e POSTGRES_DB=erp_db \
  postgres:16

DATABASE_URL=postgres://erp:erp@127.0.0.1:5432/erp_db \
  npm run migrate --workspace @erp/api

# Terminal 1
DATABASE_URL=postgres://erp:erp@127.0.0.1:5432/erp_db PORT=4000 \
  npm run dev --workspace @erp/api

# Terminal 2
ERP_API_BASE_URL=http://127.0.0.1:4000/api/v1 \
  npm run dev --workspace @erp/site

# Terminal 3 (optional — ERP internal web)
VITE_API_URL=http://127.0.0.1:4000/api/v1 \
  npm run dev --workspace @erp/web
```

Site → http://localhost:3100, ERP web → http://localhost:5173, API → http://localhost:4000.
