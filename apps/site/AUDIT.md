# `apps/site` ↔ ERP Integration Audit

This document maps every public-site feature to the corresponding ERP
endpoint (`apps/api/src/modules/...`) plus the cache tag the site uses for
on-demand revalidation. It is the single source of truth for the
"if I change X in the ERP, where does it appear on the site?" question.

## Visual identity

| Concern | Source | Notes |
| --- | --- | --- |
| Color tokens | `apps/web/src/design-system/tokens.css` | Ported into `apps/site/src/app/globals.css` (cream, sage `#7c9885`, warm tan `#d4a373`, dark olive `#2a2c28`). |
| Fonts | Plus Jakarta Sans + Playfair Display + JetBrains Mono | Loaded via `next/font/google` in `src/app/layout.tsx`. |
| Glass primitives | `--glass-bg`, `--glass-bg-strong`, `--glass-shadow*` | Identical names + values on both surfaces. |
| Theme storage | `localStorage["bb_themeMode"]` + `data-theme="dark"` + `bb:theme-change` event | A user that toggles dark mode on the ERP (apps/web) gets the same mode on the public site, and vice versa. Legacy key `bawabawa-theme` is still read for backwards compatibility. |
| Spacing / radii / motion | `--space-*`, `--radius-*`, `--motion-*` | Verbatim copy of ERP tokens. |
| Shell + navbar primitives | `.bb-shell`, `.bb-navbar`, `.bb-card` | Ported into globals.css so admin-style chrome renders identically when reused inside the site. |

## Data flow — Web → ERP (write path)

| Site action | Route handler | ERP endpoint | Method |
| --- | --- | --- | --- |
| User login | `POST /api/auth/login` | `POST /api/v1/auth/login` | proxied |
| Update order | `PATCH /api/orders/[id]` | `PATCH /api/v1/orders/{id}` | proxied |
| Initiate payment | `POST /api/payments` | `POST /api/v1/payments/doku/charge` | proxied |

When the ERP is unreachable each handler falls back to the bundled mock
dataset under `src/lib/mock/*` so pages still render in demo mode.

## Data flow — ERP → Web (read path)

| Page/component | Route handler | ERP endpoint | Cache tags |
| --- | --- | --- | --- |
| Landing hero / brand / SEO | `GET /api/cms` | `GET /api/v1/cms/settings/public` | `cms-public` |
| Items / categories on landing & request flow | `GET /api/items` | `GET /api/v1/inventory/items` | `inventory`, `items` |
| Open Trip schedule | `GET /api/trips` | `GET /api/v1/shipping/trips` | `trips` |
| Customer dashboard orders | `GET /api/orders` | `GET /api/v1/orders` | `orders` |
| Order detail / timeline | `GET /api/orders/[id]` | `GET /api/v1/orders/{id}` | `orders` |
| Live tracking timeline | `GET /api/tracking/[id]` | `GET /api/v1/shipping/orders/{id}/tracking` | `tracking` |
| Admin → customers | `GET /api/customers` | `GET /api/v1/crm/contacts` | `customers` |
| Admin → reports overview | `GET /api/analytics/overview` | `GET /api/v1/reports/summary` | `dashboard` |
| Auth session | `GET /api/auth/me` | bearer-token (optional `GET /api/v1/auth/me` proxy can be added later) | — |
| Health probe | `GET /api/health` | `GET /api/v1/health` | — |

## Data flow — ERP → Web (push / realtime)

| ERP event | Site handler | Cache tags invalidated |
| --- | --- | --- |
| `cms.settings_updated` | `POST /api/webhooks/erp` | `cms-public`, `landing` |
| `inventory.item_upserted` / `inventory.item_deleted` | `POST /api/webhooks/erp` | `inventory`, `categories`, `landing` |
| `order.created` | `POST /api/webhooks/erp` | `orders`, `dashboard` |
| `order.status_changed` | `POST /api/webhooks/erp` | `orders`, `dashboard`, `tracking` |
| `order.invoice_issued` | `POST /api/webhooks/erp` | `orders`, `invoices` |
| `payment.reconciled` / `payment.refund_succeeded` | `POST /api/webhooks/erp` | `orders`, `invoices`, `payments` |
| `shipment.update` | `POST /api/webhooks/erp` | `tracking`, `trips` |
| `shipment.delivered` | `POST /api/webhooks/erp` | `tracking`, `trips`, `orders` |
| `customer.upsert` | `POST /api/webhooks/erp` | `customers` |
| `voucher.applied` | `POST /api/webhooks/erp` | `vouchers`, `orders` |

The webhook handler verifies the `x-bawabawa-signature` HMAC, then calls
`revalidateTag()` for each cache tag in the table above. Any RSC or fetch
that opted in via `next: { tags: [...] }` will re-render on the next
request — i.e. **add an item in ERP → it shows up on the public site
without redeploy**.

For the dashboard tracking page we additionally expose
`GET /api/events/stream` as a Server-Sent Events endpoint that the client
subscribes to for live "shopper sedang packing", "kurir on the way" updates.
This complements the cache-tag invalidation: the SSE stream pushes UI
updates, the webhook makes the next reload show fresh data.

## Source-of-truth links inside this monorepo

| Site code | ERP code |
| --- | --- |
| `apps/site/src/lib/erp-client.ts` | `apps/api/src/server.ts`, `apps/api/src/routes.ts` |
| `apps/site/src/app/api/auth/login/route.ts` | `apps/api/src/modules/auth/auth.routes.ts` |
| `apps/site/src/app/api/orders/route.ts` | `apps/api/src/modules/orders/orders.routes.ts` |
| `apps/site/src/app/api/items/route.ts` | `apps/api/src/modules/inventory/inventory.routes.ts` |
| `apps/site/src/app/api/cms/route.ts` | `apps/api/src/modules/cms/cms.routes.ts` |
| `apps/site/src/app/api/trips/route.ts` | `apps/api/src/modules/shipping/biteship.routes.ts` |
| `apps/site/src/app/api/tracking/[id]/route.ts` | `apps/api/src/modules/shipping/biteship.routes.ts` |
| `apps/site/src/app/api/payments/route.ts` | `apps/api/src/modules/payments/doku.routes.ts` |
| `apps/site/src/app/api/customers/route.ts` | `apps/api/src/modules/crm/crm.routes.ts` |
| `apps/site/src/app/api/analytics/overview/route.ts` | `apps/api/src/modules/reports/reports.routes.ts` |
| `apps/site/src/app/api/webhooks/erp/route.ts` | ERP outbox / webhook dispatcher |

## Configuration

The ERP base URL is configured per environment via `.env`:

```
ERP_API_BASE_URL=http://localhost:4000
ERP_API_TOKEN=...
NEXT_PUBLIC_ERP_API_URL=
NEXT_PUBLIC_SITE_URL=https://bawabawa.id
```

Defaults to a relative `/api/v1` path so when the site is deployed behind
the same reverse proxy as the ERP no env wiring is required.

## What still uses mock data only

These flows do not yet have a 1-1 ERP endpoint:

- Wishlist (`/dashboard/wishlist`) — needs `apps/api/src/modules/customers/wishlist.*`
- In-app live chat (`/dashboard/chat`) — needs websocket transport
- Notification bell (`/dashboard/notifications`) — needs `notifications.list`
- Saved addresses (`/dashboard/addresses`) — could reuse customers module
- Admin role permissions UI (`/admin/roles`) — RBAC API exists, table view is mocked
- Admin CMS editor (`/admin/cms`) — read-only audit list only

Each is rendered from `src/lib/mock/*` and clearly marked as such. They are
the natural next batch of integrations once their ERP modules exist.
