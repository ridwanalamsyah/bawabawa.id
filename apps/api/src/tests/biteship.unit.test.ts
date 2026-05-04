import { describe, expect, it } from "vitest";
import {
  applyShipmentWebhook,
  bookShipment,
  quoteRates,
  type HttpClient
} from "../modules/shipping/biteship.service";

function makeHttp(
  responder: (path: string, body: any) => { status: number; body: unknown }
): HttpClient {
  return async (url, init) => {
    const u = new URL(url);
    const path = u.pathname;
    const parsed = init?.body ? JSON.parse(String(init.body)) : null;
    const { status, body } = responder(path, parsed);
    const text = typeof body === "string" ? body : JSON.stringify(body);
    return {
      ok: status >= 200 && status < 300,
      status,
      async json() {
        return JSON.parse(text);
      },
      async text() {
        return text;
      }
    };
  };
}

describe("quoteRates", () => {
  it("maps BiteShip pricing array to RateOption[]", async () => {
    const fetch = makeHttp(() => ({
      status: 200,
      body: {
        success: true,
        pricing: [
          {
            courier_code: "jne",
            courier_name: "JNE",
            courier_service_code: "REG",
            courier_service_name: "Reguler",
            price: 18000,
            shipment_duration_range: "2-3"
          }
        ]
      }
    }));
    const rates = await quoteRates(
      { apiKey: "k".repeat(20), fetch },
      {
        origin: { postalCode: "12345" },
        destination: { postalCode: "23456" },
        couriers: ["jne"],
        items: [{ name: "Tas", value: 100000, weight: 500, quantity: 1 }]
      }
    );
    expect(rates).toEqual([
      {
        courierCode: "jne",
        courierName: "JNE",
        serviceType: "REG",
        serviceName: "Reguler",
        price: 18000,
        durationMin: 2,
        durationMax: 3
      }
    ]);
  });

  it("rejects empty couriers / items", async () => {
    const fetch = makeHttp(() => ({ status: 200, body: { pricing: [] } }));
    await expect(
      quoteRates(
        { apiKey: "k".repeat(20), fetch },
        {
          origin: { postalCode: "1" },
          destination: { postalCode: "2" },
          couriers: [],
          items: [{ name: "x", value: 1, weight: 1, quantity: 1 }]
        }
      )
    ).rejects.toMatchObject({ code: "NO_COURIERS" });
  });

  it("propagates BiteShip 4xx as 400 BITESHIP_HTTP_ERROR", async () => {
    const fetch = makeHttp(() => ({
      status: 400,
      body: { success: false, error: "Invalid postal code" }
    }));
    await expect(
      quoteRates(
        { apiKey: "k".repeat(20), fetch },
        {
          origin: { postalCode: "x" },
          destination: { postalCode: "y" },
          couriers: ["jne"],
          items: [{ name: "x", value: 1, weight: 1, quantity: 1 }]
        }
      )
    ).rejects.toMatchObject({ code: "BITESHIP_HTTP_ERROR", statusCode: 400 });
  });

  it("propagates BiteShip 5xx as 502 (upstream is broken, not us)", async () => {
    const fetch = makeHttp(() => ({ status: 502, body: { error: "bad gateway" } }));
    await expect(
      quoteRates(
        { apiKey: "k".repeat(20), fetch },
        {
          origin: { postalCode: "x" },
          destination: { postalCode: "y" },
          couriers: ["jne"],
          items: [{ name: "x", value: 1, weight: 1, quantity: 1 }]
        }
      )
    ).rejects.toMatchObject({ statusCode: 502 });
  });
});

describe("bookShipment", () => {
  function makeFakeClient() {
    const state = {
      shipments: [] as Array<{
        id: string;
        order_id: string;
        provider: string;
        external_id: string;
        status: string;
        price: number;
      }>
    };
    return {
      state,
      async query<Row = any>(
        sql: string,
        params: any[] = []
      ): Promise<{ rows: Row[]; rowCount: number }> {
        const t = sql.trim();
        if (/^INSERT INTO shipments/i.test(t)) {
          const [id, orderId, provider, externalId, , , status, price] = params;
          const dup = state.shipments.find(
            (s) => s.provider === provider && s.external_id === externalId
          );
          if (dup) return { rows: [], rowCount: 0 };
          state.shipments.push({
            id,
            order_id: orderId,
            provider,
            external_id: externalId,
            status,
            price: Number(price)
          });
          return { rows: [], rowCount: 1 };
        }
        if (/^SELECT id, status, price FROM shipments/i.test(t)) {
          const [provider, externalId] = params;
          const found = state.shipments.find(
            (s) => s.provider === provider && s.external_id === externalId
          );
          return found
            ? {
                rows: [
                  {
                    id: found.id,
                    status: found.status,
                    price: String(found.price)
                  } as unknown as Row
                ],
                rowCount: 1
              }
            : { rows: [], rowCount: 0 };
        }
        throw new Error(`unmocked: ${t.slice(0, 80)}`);
      }
    };
  }

  const baseInput = {
    orderId: "order-1",
    courierCompany: "jne",
    courierType: "reg",
    origin: {
      contactName: "Toko",
      contactPhone: "0811",
      address: "Jl A",
      postalCode: "12345"
    },
    destination: {
      contactName: "Andi",
      contactPhone: "0822",
      address: "Jl B",
      postalCode: "23456"
    },
    items: [{ name: "Tas", value: 100000, weight: 500, quantity: 1 }]
  };

  it("books shipment and persists row", async () => {
    const client = makeFakeClient();
    const fetch = makeHttp(() => ({
      status: 200,
      body: { id: "ext-001", status: "confirmed", price: 18000 }
    }));
    const result = await bookShipment(client, { apiKey: "k".repeat(20), fetch }, baseInput);
    expect(result.externalId).toBe("ext-001");
    expect(result.price).toBe(18000);
    expect(result.status).toBe("confirmed");
    expect(client.state.shipments).toHaveLength(1);
  });

  it("idempotent: duplicate external_id resolves to existing shipment", async () => {
    const client = makeFakeClient();
    const fetch = makeHttp(() => ({
      status: 200,
      body: { id: "ext-dup", status: "confirmed", price: 18000 }
    }));
    const first = await bookShipment(client, { apiKey: "k".repeat(20), fetch }, baseInput);
    const second = await bookShipment(client, { apiKey: "k".repeat(20), fetch }, baseInput);
    expect(client.state.shipments).toHaveLength(1);
    expect(second.shipmentId).toBe(first.shipmentId);
  });

  it("throws BITESHIP_BAD_RESPONSE when response missing id", async () => {
    const client = makeFakeClient();
    const fetch = makeHttp(() => ({ status: 200, body: { status: "ok" } }));
    await expect(
      bookShipment(client, { apiKey: "k".repeat(20), fetch }, baseInput)
    ).rejects.toMatchObject({ code: "BITESHIP_BAD_RESPONSE" });
  });
});

describe("applyShipmentWebhook", () => {
  function makeFakeClient(initialStatus: string = "confirmed") {
    const state = {
      shipments: [
        {
          id: "ship-1",
          provider: "biteship",
          external_id: "ext-1",
          status: initialStatus,
          waybill_id: null as string | null
        }
      ]
    };
    return {
      state,
      async query<Row = any>(
        sql: string,
        params: any[] = []
      ): Promise<{ rows: Row[]; rowCount: number }> {
        const t = sql.trim();
        if (/^SELECT id, status FROM shipments/i.test(t)) {
          const [provider, externalId] = params;
          const s = state.shipments.find(
            (x) => x.provider === provider && x.external_id === externalId
          );
          return s
            ? {
                rows: [{ id: s.id, status: s.status } as unknown as Row],
                rowCount: 1
              }
            : { rows: [], rowCount: 0 };
        }
        if (/^UPDATE shipments/i.test(t)) {
          const [status, waybill, , id] = params;
          const s = state.shipments.find((x) => x.id === id);
          if (!s) return { rows: [], rowCount: 0 };
          s.status = status;
          if (waybill) s.waybill_id = waybill;
          return { rows: [], rowCount: 1 };
        }
        throw new Error(`unmocked: ${t.slice(0, 80)}`);
      }
    };
  }

  it("normalizes BiteShip status code to internal taxonomy", async () => {
    const client = makeFakeClient();
    const result = await applyShipmentWebhook(client, {
      order_id: "ext-1",
      status: "dropping_off",
      courier_waybill_id: "AWB123"
    });
    expect(result.updated).toBe(true);
    expect(result.status).toBe("in_transit");
    expect(client.state.shipments[0].status).toBe("in_transit");
    expect(client.state.shipments[0].waybill_id).toBe("AWB123");
  });

  it("marks delivered for `delivered` status", async () => {
    const client = makeFakeClient();
    await applyShipmentWebhook(client, { order_id: "ext-1", status: "delivered" });
    expect(client.state.shipments[0].status).toBe("delivered");
  });

  it("returns updated:false silently for unknown shipment (forged or stale)", async () => {
    const client = makeFakeClient();
    const result = await applyShipmentWebhook(client, {
      order_id: "MISSING",
      status: "delivered"
    });
    expect(result.updated).toBe(false);
  });

  it("rejects payload without order_id", async () => {
    const client = makeFakeClient();
    await expect(
      applyShipmentWebhook(client, { order_id: "" as string, status: "delivered" })
    ).rejects.toMatchObject({ code: "INVALID_PAYLOAD" });
  });

  it("does NOT regress delivered → in_transit on out-of-order webhook delivery", async () => {
    // Real scenario: courier app fires `delivered` first; a delayed
    // `dropping_off` retry arrives after. The earlier-stage event must
    // not roll back the shipment row or overwrite the delivery payload.
    const client = makeFakeClient("delivered");
    const result = await applyShipmentWebhook(client, {
      order_id: "ext-1",
      status: "dropping_off"
    });
    expect(result.updated).toBe(false);
    expect(result.status).toBe("delivered");
    expect(client.state.shipments[0].status).toBe("delivered");
  });

  it("does NOT transition delivered → cancelled (terminal sibling)", async () => {
    const client = makeFakeClient("delivered");
    const result = await applyShipmentWebhook(client, {
      order_id: "ext-1",
      status: "cancelled"
    });
    expect(result.updated).toBe(false);
    expect(client.state.shipments[0].status).toBe("delivered");
  });

  it("does NOT regress in_transit → confirmed", async () => {
    const client = makeFakeClient("in_transit");
    const result = await applyShipmentWebhook(client, {
      order_id: "ext-1",
      status: "confirmed"
    });
    expect(result.updated).toBe(false);
    expect(client.state.shipments[0].status).toBe("in_transit");
  });

  it("allows forward transition confirmed → picked → in_transit → delivered", async () => {
    const client = makeFakeClient("confirmed");
    await applyShipmentWebhook(client, { order_id: "ext-1", status: "picked" });
    expect(client.state.shipments[0].status).toBe("picked");
    await applyShipmentWebhook(client, { order_id: "ext-1", status: "dropping_off" });
    expect(client.state.shipments[0].status).toBe("in_transit");
    await applyShipmentWebhook(client, { order_id: "ext-1", status: "delivered" });
    expect(client.state.shipments[0].status).toBe("delivered");
  });
});
