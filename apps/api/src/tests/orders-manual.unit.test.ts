import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { OrdersService } from "../modules/orders/orders.service";

/**
 * PR #50 — phone normalization rules in `upsertManualCustomer`.
 *
 * The admin manual-entry form takes whatever the staff member typed:
 * "0812-3456-7890", "+62 812 3456 7890", "62 812-345-678 ext 9", etc.
 * The service must collapse all those onto a single canonical form so
 * a repeat order from the same customer collides on the existing row
 * instead of fanning out one synthetic customer per typo.
 *
 * Rules (from orders.service.ts:178 commentary):
 *   1. Strip every non-digit.
 *   2. Replace leading `0` with `62` (Indonesia country code).
 *   3. Empty (after stripping) → reject with 422 INVALID_PHONE.
 */
type FakeRow = { id: string; name: string; phone: string; branch_id: string };

function makeFakeClient(seed: FakeRow[] = []) {
  const customers = [...seed];
  return {
    state: customers,
    async query<Row = any>(
      sql: string,
      params: any[] = []
    ): Promise<{ rows: Row[]; rowCount: number }> {
      const t = sql.trim();
      if (/^SELECT id FROM customers WHERE phone/i.test(t)) {
        const phone = params[0];
        const hit = customers.find((c) => c.phone === phone);
        return hit
          ? { rows: [{ id: hit.id }] as unknown as Row[], rowCount: 1 }
          : { rows: [], rowCount: 0 };
      }
      if (/^INSERT INTO customers/i.test(t)) {
        const [id, name, phone, branchId] = params as [string, string, string, string];
        customers.push({ id, name, phone, branch_id: branchId });
        return { rows: [], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    }
  };
}

describe("upsertManualCustomer phone normalization (PR #50)", () => {
  const service = new OrdersService();

  it("strips non-digit characters", async () => {
    const fake = makeFakeClient();
    await service.upsertManualCustomer({
      name: "Test",
      phone: "+62 812-3456-7890",
      branchId: randomUUID(),
      client: fake
    });
    expect(fake.state).toHaveLength(1);
    expect(fake.state[0].phone).toBe("6281234567890");
  });

  it("converts leading 0 to 62", async () => {
    const fake = makeFakeClient();
    await service.upsertManualCustomer({
      name: "Test",
      phone: "08123456789",
      branchId: randomUUID(),
      client: fake
    });
    expect(fake.state[0].phone).toBe("628123456789");
  });

  it("collapses different input formats to the same canonical phone", async () => {
    const fake = makeFakeClient();
    const branch = randomUUID();
    const a = await service.upsertManualCustomer({
      name: "First",
      phone: "0812-3456-7890",
      branchId: branch,
      client: fake
    });
    const b = await service.upsertManualCustomer({
      name: "Second",
      phone: "+62 (812) 3456 7890",
      branchId: branch,
      client: fake
    });
    // Both inputs normalize to "6281234567890" → second lookup hits the
    // existing row and we return the same id (one customer record, not
    // two).
    expect(a.id).toBe(b.id);
    expect(fake.state).toHaveLength(1);
  });

  it("rejects phone with no digits (empty after stripping)", async () => {
    const fake = makeFakeClient();
    await expect(
      service.upsertManualCustomer({
        name: "Test",
        phone: "   ()-",
        branchId: randomUUID(),
        client: fake
      })
    ).rejects.toMatchObject({ statusCode: 422, code: "INVALID_PHONE" });
    expect(fake.state).toHaveLength(0);
  });
});
