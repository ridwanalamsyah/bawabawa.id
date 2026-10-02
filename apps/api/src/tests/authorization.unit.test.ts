import jwt from "jsonwebtoken";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../app";
import { permissionsForDivision, roleForDivision } from "../common/security/permissions";

/**
 * Regression guard for the audit's broken-access-control finding: a public
 * Google sign-up becomes a `customer` with a valid access token, so every
 * back-office route must refuse that token. The permission middleware runs
 * before any handler touches the database, so these assertions need no DB.
 */
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? "test-JWT_ACCESS_SECRET";

function tokenFor(division: string) {
  return jwt.sign(
    {
      sub: "11111111-1111-4111-8111-111111111111",
      roles: [roleForDivision(division)],
      permissions: permissionsForDivision(division)
    },
    ACCESS_SECRET,
    { expiresIn: "15m" }
  );
}

const STAFF_ONLY: Array<[method: "get" | "post" | "patch" | "put", path: string]> = [
  ["get", "/api/v1/orders"],
  ["post", "/api/v1/orders/00000000-0000-0000-0000-000000000000/payments"],
  ["post", "/api/v1/orders/00000000-0000-0000-0000-000000000000/pack"],
  ["post", "/api/v1/orders/00000000-0000-0000-0000-000000000000/ship"],
  ["post", "/api/v1/orders/00000000-0000-0000-0000-000000000000/voucher"],
  ["get", "/api/v1/branches"],
  ["get", "/api/v1/vouchers"],
  ["post", "/api/v1/vouchers"],
  ["patch", "/api/v1/vouchers/00000000-0000-0000-0000-000000000000"],
  ["get", "/api/v1/crm/customers"],
  ["post", "/api/v1/crm/leads"],
  ["get", "/api/v1/hr/employees"],
  ["get", "/api/v1/finance/invoices"],
  ["get", "/api/v1/finance/transactions"],
  ["get", "/api/v1/emails"],
  ["post", "/api/v1/emails/send"],
  ["post", "/api/v1/whatsapp/fonnte/send"],
  ["post", "/api/v1/whatsapp/messages/send"],
  ["post", "/api/v1/inventory/adjustments"],
  ["get", "/api/v1/approvals"],
  ["get", "/api/v1/reports/kpi"],
  ["post", "/api/v1/erp/sync"],
  ["get", "/api/v1/cms/settings"],
  ["get", "/api/v1/cms/media"],
  ["get", "/api/v1/metrics"],
  ["get", "/api/v1/admin/orders/requests"]
];

describe("authorization: customer tokens cannot reach back-office routes", () => {
  const app = createApp();
  const customer = tokenFor("customer");

  it.each(STAFF_ONLY)("%s %s → 403 for customer", async (method, path) => {
    const res = await request(app)[method](path)
      .set("authorization", `Bearer ${customer}`)
      .send({});
    expect(res.status).toBe(403);
  });

  it.each(STAFF_ONLY)("%s %s → 401 without token", async (method, path) => {
    const res = await request(app)[method](path).send({});
    expect(res.status).toBe(401);
  });
});

describe("division permission map", () => {
  it("never hands admin rights to unknown divisions", () => {
    expect(permissionsForDivision("typo-division")).not.toContain("users:manage_users");
    expect(permissionsForDivision("typo-division")).not.toContain("finance:manage_finance");
  });

  it("keeps sales out of finance and user management", () => {
    const sales = permissionsForDivision("sales");
    expect(sales).toContain("orders:read");
    expect(sales).not.toContain("finance:manage_finance");
    expect(sales).not.toContain("users:manage_users");
  });

  it("gives admin every permission", () => {
    expect(permissionsForDivision("admin")).toEqual(
      expect.arrayContaining(["users:manage_users", "finance:manage_finance", "cms:manage", "comms:send"])
    );
  });

  it("limits customers to their dashboard", () => {
    expect(permissionsForDivision("customer")).toEqual(["dashboard:view"]);
    expect(roleForDivision("customer")).toBe("customer");
  });
});
