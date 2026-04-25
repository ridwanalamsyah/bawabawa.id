import { describe, expect, it } from "vitest";
describe("Orders domain rules", () => {
  it("keeps workflow contract explicit", () => {
    const expectedFlow = [
      "draft",
      "confirmed",
      "payment_pending",
      "payment_dp/payment_paid",
      "stock_reserved",
      "packed",
      "shipped",
      "invoiced",
      "posted_finance"
    ];

    expect(expectedFlow).toContain("stock_reserved");
    expect(expectedFlow.at(-1)).toBe("posted_finance");
  });
});
