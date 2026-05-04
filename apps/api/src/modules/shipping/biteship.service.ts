import { randomUUID } from "crypto";
import { AppError } from "../../common/errors/app-error";

type QueryClient = {
  query: <Row = any>(sql: string, params?: any[]) => Promise<{ rows: Row[]; rowCount: number }>;
};

/**
 * Minimal HTTP client interface so tests can inject a fake fetch without
 * the global fetch mocking gymnastics. Mirrors the shape of `globalThis.fetch`.
 */
export type HttpClient = (
  url: string,
  init?: { method?: string; headers?: Record<string, string>; body?: string }
) => Promise<{ ok: boolean; status: number; json: () => Promise<any>; text: () => Promise<string> }>;

const defaultFetch: HttpClient = (url, init) => fetch(url, init as any) as any;

export type BiteshipConfig = {
  apiKey: string;
  baseUrl?: string;
  fetch?: HttpClient;
};

function client({ apiKey, baseUrl, fetch: f = defaultFetch }: BiteshipConfig) {
  const url = (path: string) => `${baseUrl ?? "https://api.biteship.com"}${path}`;
  const headers = {
    Authorization: apiKey,
    "Content-Type": "application/json"
  };
  return {
    async post(path: string, body: unknown) {
      const res = await f(url(path), {
        method: "POST",
        headers,
        body: JSON.stringify(body)
      });
      const text = await res.text();
      let parsed: any;
      try {
        parsed = text ? JSON.parse(text) : {};
      } catch {
        parsed = { raw: text };
      }
      if (!res.ok) {
        throw new AppError(
          res.status >= 500 ? 502 : 400,
          "BITESHIP_HTTP_ERROR",
          parsed?.error ?? `BiteShip ${res.status}: ${text.slice(0, 200)}`
        );
      }
      return parsed;
    }
  };
}

// =============================================================================
// Rate quote
// =============================================================================

export type QuoteRatesInput = {
  origin: { postalCode: string };
  destination: { postalCode: string };
  couriers: string[]; // e.g. ["jne", "jnt", "sicepat"]
  items: Array<{ name: string; value: number; weight: number; quantity: number }>;
};

export type RateOption = {
  courierCode: string;
  courierName: string;
  serviceType: string;
  serviceName: string;
  price: number;
  durationMin: number; // hours
  durationMax: number;
};

/**
 * Quote shipping rates for a destination/items combination. Returns a list
 * of options the storefront can present to the customer. Read-only — no
 * DB mutation, no shipment row created (use `bookShipment` for that).
 */
export async function quoteRates(
  config: BiteshipConfig,
  input: QuoteRatesInput
): Promise<RateOption[]> {
  if (!input.couriers.length) {
    throw new AppError(422, "NO_COURIERS", "Couriers list tidak boleh kosong");
  }
  if (!input.items.length) {
    throw new AppError(422, "NO_ITEMS", "Items list tidak boleh kosong");
  }
  const c = client(config);
  const body = {
    origin_postal_code: input.origin.postalCode,
    destination_postal_code: input.destination.postalCode,
    couriers: input.couriers.join(","),
    items: input.items.map((i) => ({
      name: i.name,
      value: i.value,
      weight: i.weight,
      quantity: i.quantity
    }))
  };
  const res = await c.post("/v1/rates/couriers", body);
  const list: any[] = Array.isArray(res?.pricing) ? res.pricing : [];
  return list.map((p) => ({
    courierCode: String(p.courier_code ?? ""),
    courierName: String(p.courier_name ?? ""),
    serviceType: String(p.courier_service_code ?? p.service_type ?? ""),
    serviceName: String(p.courier_service_name ?? ""),
    price: Number(p.price ?? 0),
    durationMin: Number(p.shipment_duration_range?.split?.("-")?.[0] ?? p.duration_min ?? 0),
    durationMax: Number(p.shipment_duration_range?.split?.("-")?.[1] ?? p.duration_max ?? 0)
  }));
}

// =============================================================================
// Book shipment
// =============================================================================

export type BookShipmentInput = {
  orderId: string;
  courierCompany: string;        // "jne"
  courierType: string;           // "reg"
  origin: { contactName: string; contactPhone: string; address: string; postalCode: string };
  destination: {
    contactName: string;
    contactPhone: string;
    address: string;
    postalCode: string;
  };
  items: Array<{ name: string; value: number; weight: number; quantity: number }>;
  totalWeight?: number;
  /**
   * Optional reference id BiteShip displays on the courier's screen and
   * includes in webhook payloads. Defaults to the ERP order id so support
   * staff can cross-reference.
   */
  referenceId?: string;
};

/**
 * Book a shipment with BiteShip and persist the resulting shipment row.
 * Idempotent against duplicate calls for the same order — caller should
 * use the idempotency middleware on the route layer.
 */
export async function bookShipment(
  qc: QueryClient,
  config: BiteshipConfig,
  input: BookShipmentInput
): Promise<{
  shipmentId: string;
  externalId: string;
  status: string;
  price: number;
}> {
  const c = client(config);
  const reqBody = {
    reference_id: input.referenceId ?? input.orderId,
    origin_contact_name: input.origin.contactName,
    origin_contact_phone: input.origin.contactPhone,
    origin_address: input.origin.address,
    origin_postal_code: input.origin.postalCode,
    destination_contact_name: input.destination.contactName,
    destination_contact_phone: input.destination.contactPhone,
    destination_address: input.destination.address,
    destination_postal_code: input.destination.postalCode,
    courier_company: input.courierCompany,
    courier_type: input.courierType,
    delivery_type: "now",
    items: input.items
  };
  const res = await c.post("/v1/orders", reqBody);
  if (!res?.id) {
    throw new AppError(502, "BITESHIP_BAD_RESPONSE", "BiteShip order id tidak ada");
  }

  const shipmentId = randomUUID();
  const price = Number(res?.price ?? res?.courier?.price ?? 0);
  const status = String(res?.status ?? "pending");
  const insert = await qc.query(
    `INSERT INTO shipments
       (id, order_id, provider, external_id, courier_company, courier_type,
        status, price, weight_grams, origin_address, destination_address, raw_payload)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     ON CONFLICT (provider, external_id) WHERE provider IS NOT NULL AND external_id IS NOT NULL
       DO NOTHING`,
    [
      shipmentId,
      input.orderId,
      "biteship",
      String(res.id),
      input.courierCompany,
      input.courierType,
      status,
      price,
      input.totalWeight ?? null,
      input.origin.address,
      input.destination.address,
      JSON.stringify(res)
    ]
  );

  let resolvedId: string = shipmentId;
  if (insert.rowCount === 0) {
    // Same external_id already booked (likely a duplicate retry). Return
    // the original row instead of creating a divergent record.
    const existing = await qc.query<{ id: string; status: string; price: string }>(
      "SELECT id, status, price FROM shipments WHERE provider = $1 AND external_id = $2",
      ["biteship", String(res.id)]
    );
    if (existing.rowCount) {
      resolvedId = existing.rows[0].id;
    }
  }

  return { shipmentId: resolvedId, externalId: String(res.id), status, price };
}

// =============================================================================
// Webhook status update
// =============================================================================

export type BiteshipWebhookPayload = {
  order_id: string;             // their id (matches our shipments.external_id)
  status?: string;
  waybill_id?: string | null;
  courier_waybill_id?: string | null;
  [key: string]: unknown;
};

/**
 * Map BiteShip status strings to our normalized internal taxonomy. Keep
 * unknown statuses verbatim so an operator can still query for them; the
 * frontend treats anything outside the canonical set as "in_transit".
 */
const STATUS_MAP: Record<string, string> = {
  confirmed: "confirmed",
  allocated: "confirmed",
  picking_up: "picked",
  picked: "picked",
  dropping_off: "in_transit",
  on_hold: "in_transit",
  delivered: "delivered",
  rejected: "cancelled",
  cancelled: "cancelled",
  returned: "cancelled"
};

export async function applyShipmentWebhook(
  qc: QueryClient,
  payload: BiteshipWebhookPayload
): Promise<{ shipmentId: string; status: string; updated: boolean }> {
  if (!payload.order_id) {
    throw new AppError(400, "INVALID_PAYLOAD", "order_id wajib diisi");
  }
  const normalized = payload.status
    ? STATUS_MAP[payload.status] ?? payload.status
    : "in_transit";
  const waybill = payload.courier_waybill_id ?? payload.waybill_id ?? null;

  const update = await qc.query<{ id: string }>(
    `UPDATE shipments
        SET status = $1,
            waybill_id = COALESCE($2, waybill_id),
            raw_payload = $3,
            updated_at = NOW()
      WHERE provider = $4 AND external_id = $5`,
    [normalized, waybill, JSON.stringify(payload), "biteship", payload.order_id]
  );
  if (update.rowCount === 0) {
    // Webhook arrived before our INSERT (rare race) or for a shipment we
    // never booked (forged). Either way, we return 200 silently — the
    // signature check upstream is the security boundary.
    return { shipmentId: "", status: normalized, updated: false };
  }
  // Resolve the shipment id for the audit log.
  const found = await qc.query<{ id: string }>(
    "SELECT id FROM shipments WHERE provider = $1 AND external_id = $2",
    ["biteship", payload.order_id]
  );
  return {
    shipmentId: found.rowCount ? found.rows[0].id : "",
    status: normalized,
    updated: true
  };
}
