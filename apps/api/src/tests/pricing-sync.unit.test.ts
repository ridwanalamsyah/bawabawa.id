import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import * as api from "../modules/order-requests/pricing";
import { voucherDiscount, type VoucherSnapshot } from "../modules/order-requests/order-vouchers";

/**
 * The site shows the customer an estimate with its own copy of the pricing
 * rules (apps/site/src/lib/pricing.ts). This test fails as soon as the two
 * copies disagree, so a tariff change can't ship to only one side.
 */
// Loaded by path at runtime: the site file lives outside this package's rootDir.
const sitePricingPath = path.resolve(__dirname, "../../../site/src/lib/pricing.ts");

describe("pricing: site estimate matches the server", async () => {
  const site: any = await import(pathToFileURL(sitePricingPath).href);

  it("shares the same constants", () => {
    for (const key of [
      "FAST_TRACK_PER_KG",
      "BATCH_FLAT_FEE",
      "BATCH_CAPACITY_KG",
      "PPN_RATE",
      "JASTIP_FEE_RATE",
      "JASTIP_FEE_MIN",
      "KILAT_BLOCKED_CATEGORIES"
    ] as const) {
      expect(site[key], key).toEqual(api[key]);
    }
  });

  const tiers: api.TierId[] = ["fast", "batch"];
  const goods = [0, 50_000, 249_999, 250_000, 1_234_567];
  const weights = [0.1, 0.4, 1, 1.01, 4.6, 12, 50, 51, 120];
  const discounts = [0, 10_000, 5_000_000];

  it("computes the same breakdown for every tier, amount, weight and discount", () => {
    for (const tier of tiers)
      for (const itemsTotal of goods)
        for (const totalKg of weights)
          for (const discount of discounts) {
            const input = { itemsTotal, totalKg, tier, discount, voucherCode: "KODE" };
            expect(site.computePricing(input), JSON.stringify(input)).toEqual(
              api.computePricing({ ...input, withPpn: false })
            );
          }
  });

  it("recommends the same service and billing weight", () => {
    for (const kg of weights) {
      expect(site.recommendTier(kg)).toBe(api.recommendTier(kg));
      expect(site.billingWeight(kg)).toBe(api.billingWeight(kg));
    }
  });

  it("computes the same promo discount", () => {
    const vouchers: VoucherSnapshot[] = [
      { code: "A", type: "fixed", value: 20_000, maxDiscount: null, minOrder: 0, onePerCustomer: false },
      { code: "B", type: "percentage", value: 50, maxDiscount: 30_000, minOrder: 100_000, onePerCustomer: true },
      { code: "C", type: "percentage", value: 100, maxDiscount: null, minOrder: 0, onePerCustomer: false }
    ];
    for (const v of vouchers)
      for (const itemsTotal of goods)
        for (const service of [0, 20_000, 63_000, 400_000])
          expect(site.voucherDiscount(v, itemsTotal, service)).toBe(voucherDiscount(v, itemsTotal, service));
  });
});
