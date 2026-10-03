import { createHmac, randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";

/**
 * Full customer journey against a local stack (site + API + Postgres), run in
 * CI by the `e2e` job: request form → promo code → submit → tracking page →
 * "link hilang?" resend on /lacak.
 *
 * Needs E2E_API_URL and E2E_JWT_SECRET (the API's JWT_ACCESS_SECRET) to create
 * the promo code as an admin.
 */
const API = process.env.E2E_API_URL ?? "http://127.0.0.1:3999";
const SECRET = process.env.E2E_JWT_SECRET;

function adminToken(secret: string): string {
  const b64 = (v: object) => Buffer.from(JSON.stringify(v)).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const body = `${b64({ alg: "HS256", typ: "JWT" })}.${b64({
    sub: randomUUID(),
    roles: ["admin"],
    permissions: ["orders:read", "orders:update"],
    iat: now,
    exp: now + 600
  })}`;
  return `${body}.${createHmac("sha256", secret).update(body).digest("base64url")}`;
}

test.skip(!SECRET, "E2E_JWT_SECRET not set — local-stack journey only");

test("customer orders with a promo code and can recover the tracking link", async ({ page }) => {
  const code = `E2E${randomUUID().slice(0, 5).toUpperCase()}`;
  const created = await fetch(`${API}/api/v1/vouchers`, {
    method: "POST",
    headers: { authorization: `Bearer ${adminToken(SECRET!)}`, "content-type": "application/json" },
    body: JSON.stringify({ code, discountType: "fixed", discountValue: 20000, perUserLimit: 1 })
  });
  expect(created.status, await created.clone().text()).toBe(201);

  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  await page.goto("/request");
  await page.getByLabel("Nama barang").fill("Kemeja flanel");
  await page.getByLabel("Batas harga maksimal per barang").fill("250000");
  await page.getByRole("button", { name: /Lanjut/ }).click();
  await page.getByRole("button", { name: /Lanjut/ }).click();
  await page.getByLabel("Nama penerima").fill("Rina Hartati");
  const phone = `0812${Math.floor(Math.random() * 9e7 + 1e7)}`;
  await page.getByLabel("No. WhatsApp").fill(phone);
  if (await page.getByLabel("Ambil sendiri").count()) {
    await page.getByLabel("Ambil sendiri").check();
  } else {
    await page.getByLabel("Alamat lengkap").fill("Jl. Pahlawan No. 5");
    await page.getByLabel("Kota").fill("Samarinda");
    await page.getByLabel("Kode pos").fill("75123");
  }
  await page.getByRole("button", { name: /Lanjut/ }).click();

  await page.getByText("Punya kode promo?").first().click();
  await page.getByLabel("Kode promo").first().fill("TIDAKADA");
  await page.getByRole("button", { name: "Pakai" }).first().click();
  await expect(page.getByText(/tidak ditemukan|tidak berlaku/).first()).toBeVisible();
  await page.getByLabel("Kode promo").first().fill(code);
  await page.getByRole("button", { name: "Pakai" }).first().click();
  await expect(page.getByText(`Promo ${code}`).first()).toBeVisible();

  await page.getByRole("button", { name: "Kirim request" }).click();
  await expect(page.getByText("Request terkirim!")).toBeVisible({ timeout: 15_000 });
  const orderCode = (await page.locator("p.font-mono").first().textContent())!.trim();
  await page.getByRole("link", { name: "Lihat status pesanan" }).click();
  await page.waitForURL(/\/track\//);
  await expect(page.getByText(`Promo ${code}`).first()).toBeVisible();

  await page.goto("/lacak");
  await page.getByLabel("Nomor WhatsApp").fill(phone);
  await page.getByLabel("Kode pesanan").last().fill(orderCode);
  await page.getByRole("button", { name: "Kirim ke WhatsApp" }).click();
  await expect(page.getByText("Link hilang?")).toBeVisible();
  await expect(page.locator("main")).toContainText(phone);

  expect(errors).toEqual([]);
});
