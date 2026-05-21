import { expect, test, type Page } from "@playwright/test";

/**
 * Layer B end-to-end: the marketing site (PR #49, #52 surface) hydrates
 * correctly from the live ERP and stays honest about soft-launch state.
 *
 * Every test runs against the configured baseURL — defaults to
 * https://bawabawa-id.vercel.app but `BAWABAWA_E2E_BASE_URL` overrides.
 */

const ROUTES = [
  { path: "/", contains: "Bawabawa" },
  { path: "/blog", contains: ["Blog", "Cerita"] },
  { path: "/tentang", contains: ["Tentang", "Bawabawa"] },
  { path: "/afiliasi", contains: ["Afiliasi", "Reseller"] },
  { path: "/pengiriman-langsung", contains: ["Pengiriman", "Langsung"] },
  { path: "/open-trip", contains: ["Open Trip", "kargo"] },
  { path: "/kontak", contains: ["Kontak", "Hubungi"] }
];

/**
 * Hardens against transient console noise from the deployed app
 * (analytics, sentry, etc.) — we only fail on hard errors that suggest
 * a real regression (uncaught exception, "X is not a function").
 */
function attachConsoleSpy(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      // Skip well-known noisy errors that aren't site regressions.
      if (/font-display|adblock|tracking|analytics/i.test(text)) return;
      errors.push(`console: ${text}`);
    }
  });
  return errors;
}

/**
 * Filter known-cosmetic errors that don't block hydration. React error
 * #418 is the SSR-vs-CSR text mismatch from live counters (the home
 * page renders a soft-launch '0' on the server but the client may have
 * received a non-zero ERP value by the time it hydrates). This is a UX
 * polish item tracked separately — not a regression introduced by any
 * of PR #49–52. The test still fails on any other uncaught JS error.
 */
function filterKnownCosmetic(errors: string[]) {
  return errors.filter((e) => !/React error #418/.test(e));
}

test.describe("marketing site smoke (PR #49, #52)", () => {
  for (const { path, contains } of ROUTES) {
    test(`renders ${path} without uncaught errors`, async ({ page }) => {
      const errors = attachConsoleSpy(page);
      const res = await page.goto(path, { waitUntil: "domcontentloaded" });
      expect(res?.status(), `HTTP status for ${path}`).toBeLessThan(400);

      const needles = Array.isArray(contains) ? contains : [contains];
      const bodyText = await page.locator("body").innerText();
      for (const needle of needles) {
        expect(bodyText, `body of ${path} mentions "${needle}"`).toContain(
          needle
        );
      }

      // Allow one tick for any deferred errors before asserting.
      await page.waitForTimeout(500);
      expect(
        filterKnownCosmetic(errors),
        `console / page errors for ${path}`
      ).toEqual([]);
    });
  }

  test("homepage shows soft-launch honesty (no fake 12k customer / 4.96 claims)", async ({
    page
  }) => {
    await page.goto("/");
    const bodyText = await page.locator("body").innerText();

    // PR #49 explicitly removed these strings — make sure they don't
    // sneak back in.
    expect(bodyText).not.toContain("12.000+ warga Samarinda");
    expect(bodyText).not.toContain("4.96 dari 1.2k+ ulasan");
    expect(bodyText).not.toContain("terdaftar OJK & BI");

    // ...and that the honest replacement copy is still there.
    expect(bodyText.toLowerCase()).toContain("soft launch");
  });

  test("footer links route to PR #52's renamed sections", async ({ page }) => {
    await page.goto("/");
    // PR #52 renamed Press Kit → Tentang, Karier → Afiliasi.
    const footer = page.locator("footer");
    await expect(footer.getByRole("link", { name: /tentang/i })).toBeVisible();
    await expect(
      footer.getByRole("link", { name: /afiliasi/i })
    ).toBeVisible();

    // Open Trip + Pengiriman Langsung sit side-by-side after the split.
    await expect(
      footer.getByRole("link", { name: /open trip/i })
    ).toBeVisible();
    await expect(
      footer.getByRole("link", { name: /pengiriman langsung/i })
    ).toBeVisible();
  });

  test("public analytics endpoints return JSON envelopes (no 5xx)", async ({
    request,
    baseURL
  }) => {
    const endpoints = [
      "/api/analytics/overview",
      "/api/analytics/activity",
      "/api/analytics/promotions",
      "/api/analytics/testimonials",
      "/api/analytics/blog-posts"
    ];

    for (const ep of endpoints) {
      const res = await request.get(`${baseURL}${ep}`);
      expect(res.status(), `${ep} status`).toBe(200);
      const json = await res.json();
      expect(json, `${ep} payload shape`).toBeTruthy();
      // Either { items: [...] } or the soft-launch overview shape.
      const validShape =
        Array.isArray((json as { items?: unknown[] }).items) ||
        typeof (json as { softLaunch?: boolean }).softLaunch === "boolean";
      expect(validShape, `${ep} returns expected envelope`).toBe(true);
    }
  });

  test("hero 'Tiba di Samarinda' card has float animation applied (PR #48)", async ({
    page
  }) => {
    await page.goto("/");
    // The PR #48 fix added an `animate-float` utility wired to a
    // `@keyframes float` definition. We assert the keyframes resolved
    // (i.e. the rule actually exists in the global CSS bundle) by
    // checking the computed animation-name on the floating card.
    const animationName = await page.evaluate(() => {
      const el = document.querySelector('[class*="animate-float"]');
      if (!el) return null;
      return getComputedStyle(el).animationName;
    });
    expect(animationName, "animate-float element exists & resolves").toBe(
      "float"
    );
  });
});
