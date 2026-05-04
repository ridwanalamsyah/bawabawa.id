import { describe, expect, it } from "vitest";
import {
  consumeForOrder,
  releaseForOrder,
  reserveForOrder
} from "../modules/inventory/reservation.service";

type Reservation = {
  id: string;
  order_id: string;
  product_id: string;
  qty: number;
  status: "reserved" | "consumed" | "released";
};

/**
 * Hand-rolled in-memory fake that mimics the subset of Postgres/SQLite SQL our
 * reservation service uses. Keeps the test self-contained and fast.
 */
function makeFakeClient(initial: Record<string, { current: number; reserved: number }>) {
  const products = new Map(
    Object.entries(initial).map(([id, v]) => [id, { current: v.current, reserved: v.reserved }])
  );
  const reservations: Reservation[] = [];

  return {
    products,
    reservations,
    async query<Row = any>(sql: string, params: any[] = []): Promise<{ rows: Row[]; rowCount: number }> {
      const trimmed = sql.trim();

      if (/^SELECT COUNT\(\*\) AS count FROM order_reservations/i.test(trimmed)) {
        const orderId = params[0];
        const count = reservations.filter(
          (r) => r.order_id === orderId && r.status === "reserved"
        ).length;
        return { rows: [{ count } as unknown as Row], rowCount: 1 };
      }

      if (/^UPDATE products\s+SET reserved_stock = reserved_stock \+/i.test(trimmed)) {
        const [qty, productId] = params;
        const product = products.get(productId);
        if (!product) return { rows: [], rowCount: 0 };
        if (product.current - product.reserved >= qty) {
          product.reserved += qty;
          return { rows: [], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
      }

      if (/^INSERT INTO order_reservations/i.test(trimmed)) {
        const [id, orderId, productId, qty] = params;
        reservations.push({
          id,
          order_id: orderId,
          product_id: productId,
          qty: Number(qty),
          status: "reserved"
        });
        return { rows: [], rowCount: 1 };
      }

      if (/^SELECT id, product_id, qty\s+FROM order_reservations/i.test(trimmed)) {
        const orderId = params[0];
        const rows = reservations.filter(
          (r) => r.order_id === orderId && r.status === "reserved"
        );
        return { rows: rows as unknown as Row[], rowCount: rows.length };
      }

      if (/^UPDATE products\s+SET reserved_stock = GREATEST\(reserved_stock -/i.test(trimmed)) {
        const [qty, productId] = params;
        const product = products.get(productId);
        if (!product) return { rows: [], rowCount: 0 };
        product.reserved = Math.max(product.reserved - qty, 0);
        return { rows: [], rowCount: 1 };
      }

      if (/^UPDATE products\s+SET current_stock = GREATEST\(current_stock -/i.test(trimmed)) {
        const [qty, productId] = params;
        const product = products.get(productId);
        if (!product) return { rows: [], rowCount: 0 };
        product.current = Math.max(product.current - qty, 0);
        product.reserved = Math.max(product.reserved - qty, 0);
        return { rows: [], rowCount: 1 };
      }

      if (/^UPDATE order_reservations\s+SET status = 'released'/i.test(trimmed)) {
        const id = params[0];
        const r = reservations.find((x) => x.id === id);
        if (r) r.status = "released";
        return { rows: [], rowCount: 1 };
      }

      if (/^UPDATE order_reservations\s+SET status = 'consumed'/i.test(trimmed)) {
        const id = params[0];
        const r = reservations.find((x) => x.id === id);
        if (r) r.status = "consumed";
        return { rows: [], rowCount: 1 };
      }

      throw new Error(`unmocked SQL: ${trimmed.slice(0, 80)}`);
    }
  };
}

describe("inventory reservation service", () => {
  it("reserves stock when available and fails when insufficient", async () => {
    const client = makeFakeClient({
      "prod-a": { current: 10, reserved: 0 },
      "prod-b": { current: 2, reserved: 0 }
    });

    const result = await reserveForOrder(client, "order-1", [
      { productId: "prod-a", qty: 3 },
      { productId: "prod-b", qty: 2 }
    ]);
    expect(result.reserved).toBe(2);
    expect(client.products.get("prod-a")?.reserved).toBe(3);
    expect(client.products.get("prod-b")?.reserved).toBe(2);

    await expect(
      reserveForOrder(client, "order-2", [{ productId: "prod-b", qty: 1 }])
    ).rejects.toMatchObject({ code: "INSUFFICIENT_STOCK" });
  });

  it("is idempotent — repeat reserve on same order is a no-op", async () => {
    const client = makeFakeClient({ "prod-a": { current: 5, reserved: 0 } });
    await reserveForOrder(client, "order-1", [{ productId: "prod-a", qty: 3 }]);
    const second = await reserveForOrder(client, "order-1", [{ productId: "prod-a", qty: 3 }]);
    expect(second.skipped).toBe(true);
    expect(client.products.get("prod-a")?.reserved).toBe(3);
  });

  it("releases reservation back to available pool on cancel", async () => {
    const client = makeFakeClient({ "prod-a": { current: 10, reserved: 0 } });
    await reserveForOrder(client, "order-1", [{ productId: "prod-a", qty: 4 }]);
    await releaseForOrder(client, "order-1");
    expect(client.products.get("prod-a")?.reserved).toBe(0);
    expect(client.reservations[0].status).toBe("released");
  });

  it("consume on ship decrements current_stock and clears reservation", async () => {
    const client = makeFakeClient({ "prod-a": { current: 10, reserved: 0 } });
    await reserveForOrder(client, "order-1", [{ productId: "prod-a", qty: 4 }]);
    await consumeForOrder(client, "order-1");
    expect(client.products.get("prod-a")?.current).toBe(6);
    expect(client.products.get("prod-a")?.reserved).toBe(0);
    expect(client.reservations[0].status).toBe("consumed");
  });

  it("prevents overselling under concurrent reserve attempts", async () => {
    const client = makeFakeClient({ "prod-a": { current: 5, reserved: 0 } });
    await reserveForOrder(client, "order-1", [{ productId: "prod-a", qty: 3 }]);
    await reserveForOrder(client, "order-2", [{ productId: "prod-a", qty: 2 }]);
    await expect(
      reserveForOrder(client, "order-3", [{ productId: "prod-a", qty: 1 }])
    ).rejects.toMatchObject({ code: "INSUFFICIENT_STOCK" });
    expect(client.products.get("prod-a")?.reserved).toBe(5);
  });
});
