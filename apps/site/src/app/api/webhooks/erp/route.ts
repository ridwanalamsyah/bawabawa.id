import { revalidateTag } from "next/cache";
import { audit, verifyWebhookSignature } from "@/lib/auth";

/**
 * Incoming webhook receiver from the internal ERP (apps/api).
 * Two-way sync flow:
 *   ERP → Web (this endpoint, fan-out tag invalidation + audit log)
 *   Web → ERP (handled inline by route handlers via erp-client)
 *
 * Expected events (mirrors apps/api modules):
 *   - cms.settings_updated
 *   - inventory.item_upserted, inventory.item_deleted
 *   - order.status_changed, order.created, order.invoice_issued
 *   - payment.reconciled, payment.refund_succeeded
 *   - shipment.update, shipment.delivered
 *   - customer.upsert
 *   - voucher.applied
 *
 * On every event we invalidate the relevant Next.js cache tags so any RSC or
 * `fetch()` call that opted in via `next: { tags: [...] }` re-renders on the
 * next request — i.e. add an item in ERP, the public site picks it up
 * automatically without a deploy.
 */

const TAG_MAP: Record<string, string[]> = {
  "cms.settings_updated": ["cms-public", "landing"],
  "inventory.item_upserted": ["inventory", "categories", "landing"],
  "inventory.item_deleted": ["inventory", "categories", "landing"],
  "order.created": ["orders", "dashboard"],
  "order.status_changed": ["orders", "dashboard", "tracking"],
  "order.invoice_issued": ["orders", "invoices"],
  "payment.reconciled": ["orders", "invoices", "payments"],
  "payment.refund_succeeded": ["orders", "invoices", "payments"],
  "shipment.update": ["tracking", "trips"],
  "shipment.delivered": ["tracking", "trips", "orders"],
  "customer.upsert": ["customers"],
  "voucher.applied": ["vouchers", "orders"],
};

export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("x-bawabawa-signature");
  if (!verifyWebhookSignature(raw, sig)) {
    return Response.json({ error: "invalid signature" }, { status: 401 });
  }

  let payload: { event?: string; data?: Record<string, unknown> } = {};
  try {
    payload = JSON.parse(raw);
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }

  const { event, data } = payload;
  if (!event) return Response.json({ error: "event required" }, { status: 400 });

  const tags = TAG_MAP[event] ?? [];
  for (const tag of tags) {
    try {
      // Next.js 16 requires the cache profile arg; "max" enables
      // stale-while-revalidate so the next request serves stale data
      // immediately and refreshes in the background.
      revalidateTag(tag, "max");
    } catch {
      // Tag may not have been seen yet — safe to ignore.
    }
  }

  audit.log("erp", `webhook.${event}`, String(data?.id ?? "unknown"), {
    ...(data ?? {}),
    revalidated: tags,
  });

  return Response.json({ ok: true, received: event, revalidated: tags });
}
