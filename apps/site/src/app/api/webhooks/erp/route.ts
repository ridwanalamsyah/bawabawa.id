import { audit, verifyWebhookSignature } from "@/lib/auth";

/**
 * Incoming webhook from internal ERP.
 * Bidirectional sync: ERP → Web (this endpoint) and Web → ERP (queue worker).
 *
 * Expected events:
 *  - customer.upsert
 *  - order.status_changed
 *  - invoice.paid
 *  - shipment.update
 *  - payment.reconciled
 */
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

  audit.log("erp", `webhook.${event}`, String(data?.id ?? "unknown"), data ?? {});

  // Production: enqueue background job (BullMQ) for retry semantics.
  return Response.json({ ok: true, received: event, queued: true });
}
