/**
 * Branded transactional email templates for Bawabawa.id.
 *
 * Design tokens mirror apps/site (cream / sage / olive / warm tan) so the
 * email feels continuous with the dashboard. All emails are responsive
 * via inline `style` attributes and a single 600px-max wrapper table.
 *
 * Each `render*` function returns `{ subject, html, text }` — the plain
 * text version is generated alongside so providers like Gmail/iCloud can
 * fall back gracefully for users with HTML disabled.
 */

const BRAND = {
  name: "Bawabawa.id",
  tagline: "Jasa titip premium Bandung → Samarinda",
  site: process.env.PUBLIC_SITE_URL ?? "https://bawabawa.id",
  cream: "#faf7f0",
  surface: "#fdfbf6",
  border: "#e6e0cf",
  text: "#2a2c28",
  muted: "#6b6e66",
  sage700: "#4d6755",
  sage500: "#7c9885",
  olive500: "#8a9d6f",
  emerald600: "#4f7d5e",
  tan: "#d4a373",
};

function shell(opts: {
  preheader: string;
  title: string;
  body: string;
  cta?: { label: string; href: string };
  footerExtra?: string;
}): string {
  const ctaHtml = opts.cta
    ? `
      <tr>
        <td style="padding:8px 0 24px;">
          <a href="${opts.cta.href}"
             style="display:inline-block;padding:14px 28px;border-radius:14px;
                    background:linear-gradient(135deg,${BRAND.sage700} 0%,${BRAND.emerald600} 100%);
                    color:#fff;text-decoration:none;font-weight:600;font-size:15px;
                    box-shadow:0 8px 22px rgba(77,103,85,0.32);">
            ${opts.cta.label}
          </a>
        </td>
      </tr>`
    : "";
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <title>${opts.title}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.cream};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${BRAND.text};">
  <span style="display:none;font-size:1px;color:transparent;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${opts.preheader}</span>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${BRAND.cream};">
    <tr>
      <td align="center" style="padding:32px 12px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;background:${BRAND.surface};border:1px solid ${BRAND.border};border-radius:24px;overflow:hidden;box-shadow:0 12px 40px rgba(124,152,133,0.10);">
          <tr>
            <td style="padding:28px 32px 0;">
              <table role="presentation" width="100%"><tr>
                <td>
                  <span style="font-size:22px;font-weight:800;letter-spacing:-0.02em;background:linear-gradient(135deg,${BRAND.sage700} 0%,${BRAND.emerald600} 100%);-webkit-background-clip:text;background-clip:text;color:${BRAND.sage700};">
                    ${BRAND.name}
                  </span>
                </td>
                <td align="right" style="font-size:11px;color:${BRAND.muted};text-transform:uppercase;letter-spacing:0.14em;">
                  Bandung &rarr; Samarinda
                </td>
              </tr></table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 32px;">
              <h1 style="margin:0 0 12px;font-size:24px;line-height:1.25;letter-spacing:-0.02em;color:${BRAND.text};font-weight:700;">${opts.title}</h1>
              <div style="font-size:15px;line-height:1.65;color:${BRAND.text};">
                ${opts.body}
              </div>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">${ctaHtml}</table>
              <p style="margin:8px 0 0;font-size:12px;color:${BRAND.muted};">
                ${opts.footerExtra ?? "Butuh bantuan? Balas email ini atau chat WhatsApp kami di +62 812-3456-7890."}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 28px;border-top:1px solid ${BRAND.border};background:${BRAND.cream};">
              <p style="margin:0;font-size:11px;color:${BRAND.muted};line-height:1.6;">
                Email ini dikirim oleh ${BRAND.name} sesuai dengan layanan yang kamu pakai. Kebijakan privasi: <a href="${BRAND.site}/privacy" style="color:${BRAND.sage700};text-decoration:underline;">${BRAND.site}/privacy</a>.<br/>
                &copy; ${new Date().getFullYear()} PT Bawabawa Indonesia &middot; Bandung, Jawa Barat
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function plain(opts: { title: string; body: string; cta?: { label: string; href: string } }): string {
  const cta = opts.cta ? `\n\n${opts.cta.label}: ${opts.cta.href}` : "";
  return `${BRAND.name} — ${BRAND.tagline}\n\n${opts.title}\n${"—".repeat(40)}\n\n${opts.body.replace(/<[^>]+>/g, "")}${cta}\n\nBalas email ini kalau perlu bantuan.\n${BRAND.site}\n`;
}

export type RenderedEmail = { subject: string; html: string; text: string };

export function renderWelcome(input: { name: string; verifyUrl?: string }): RenderedEmail {
  const title = `Halo ${input.name}, selamat bergabung di Bawabawa.id!`;
  const body = `
    <p>Akun kamu sudah aktif. Mulai sekarang kamu bisa minta personal shopper kami untuk membelikan apa pun dari Bandung dan mengirimkannya aman sampai depan rumah di Samarinda.</p>
    <p style="margin-top:12px;"><strong>Yang bisa kamu lakukan sekarang:</strong></p>
    <ul style="padding-left:18px;margin:6px 0;">
      <li>Lihat jadwal trip terdekat di halaman Open Trip</li>
      <li>Buat request titip pertama (gratis ongkir pertama!)</li>
      <li>Lacak status barang realtime di dashboard</li>
    </ul>
  `;
  const cta = input.verifyUrl
    ? { label: "Verifikasi email saya", href: input.verifyUrl }
    : { label: "Mulai titip sekarang", href: `${BRAND.site}/request` };
  return {
    subject: `Selamat datang di ${BRAND.name} 🌿`,
    html: shell({
      preheader: "Akun kamu sudah aktif. Mulai titip pertama sekarang.",
      title,
      body,
      cta,
    }),
    text: plain({ title, body, cta }),
  };
}

export function renderOrderConfirmed(input: {
  name: string;
  orderId: string;
  items: { label: string; qty: number; price: number }[];
  total: number;
  trackingUrl: string;
}): RenderedEmail {
  const rows = input.items
    .map(
      (i) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid ${BRAND.border};">${i.label}</td>
        <td style="padding:10px 0;border-bottom:1px solid ${BRAND.border};text-align:right;color:${BRAND.muted};">×${i.qty}</td>
        <td style="padding:10px 0;border-bottom:1px solid ${BRAND.border};text-align:right;font-weight:600;">Rp ${i.price.toLocaleString("id-ID")}</td>
      </tr>`
    )
    .join("");
  const title = `Request kamu sudah kami terima!`;
  const body = `
    <p>Hai ${input.name}, terima kasih sudah percaya ${BRAND.name}. Order <strong>#${input.orderId}</strong> sudah masuk antrian shopper kami.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0 8px;font-size:14px;">
      <thead>
        <tr style="text-align:left;color:${BRAND.muted};text-transform:uppercase;letter-spacing:0.08em;font-size:11px;">
          <th style="padding:6px 0;font-weight:500;">Barang</th>
          <th style="padding:6px 0;font-weight:500;text-align:right;">Qty</th>
          <th style="padding:6px 0;font-weight:500;text-align:right;">Harga</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr><td colspan="2" style="padding-top:12px;font-weight:600;">Total estimasi</td><td style="padding-top:12px;text-align:right;font-weight:700;color:${BRAND.sage700};">Rp ${input.total.toLocaleString("id-ID")}</td></tr>
      </tfoot>
    </table>
    <p style="margin-top:18px;">Personal shopper akan menghubungi kamu lewat WhatsApp untuk konfirmasi detail sebelum berbelanja.</p>
  `;
  return {
    subject: `Order #${input.orderId} diterima — ${BRAND.name}`,
    html: shell({
      preheader: `Order #${input.orderId} sudah masuk antrian shopper.`,
      title,
      body,
      cta: { label: "Lacak order saya", href: input.trackingUrl },
    }),
    text: plain({
      title,
      body: `Order #${input.orderId}\nTotal estimasi: Rp ${input.total.toLocaleString("id-ID")}\nItems:\n${input.items.map((i) => ` - ${i.label} ×${i.qty} (Rp ${i.price.toLocaleString("id-ID")})`).join("\n")}`,
      cta: { label: "Lacak order", href: input.trackingUrl },
    }),
  };
}

export function renderStatusUpdate(input: {
  name: string;
  orderId: string;
  status: string;
  note?: string;
  trackingUrl: string;
}): RenderedEmail {
  const title = `Update status order #${input.orderId}`;
  const body = `
    <p>Hai ${input.name}, status pesanan kamu berubah menjadi:</p>
    <p style="margin:14px 0;padding:12px 16px;border-radius:14px;background:rgba(124,152,133,0.12);font-weight:600;color:${BRAND.sage700};">${input.status}</p>
    ${input.note ? `<p style="color:${BRAND.muted};font-size:14px;">${input.note}</p>` : ""}
  `;
  return {
    subject: `[${BRAND.name}] ${input.status} — Order #${input.orderId}`,
    html: shell({
      preheader: input.note ?? `Status order #${input.orderId} diperbarui.`,
      title,
      body,
      cta: { label: "Lihat tracking lengkap", href: input.trackingUrl },
    }),
    text: plain({
      title,
      body: `Status: ${input.status}\n${input.note ?? ""}`,
      cta: { label: "Tracking", href: input.trackingUrl },
    }),
  };
}

export function renderPaymentReceipt(input: {
  name: string;
  orderId: string;
  amount: number;
  method: string;
  paidAt: string;
  invoiceUrl: string;
}): RenderedEmail {
  const title = `Pembayaran berhasil — terima kasih!`;
  const body = `
    <p>Hai ${input.name}, kami sudah menerima pembayaran kamu untuk order <strong>#${input.orderId}</strong>.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:14px 0;font-size:14px;">
      <tr><td style="color:${BRAND.muted};padding:6px 0;">Total</td><td style="text-align:right;padding:6px 0;font-weight:700;color:${BRAND.sage700};">Rp ${input.amount.toLocaleString("id-ID")}</td></tr>
      <tr><td style="color:${BRAND.muted};padding:6px 0;">Metode</td><td style="text-align:right;padding:6px 0;font-weight:600;">${input.method}</td></tr>
      <tr><td style="color:${BRAND.muted};padding:6px 0;">Dibayar</td><td style="text-align:right;padding:6px 0;">${input.paidAt}</td></tr>
    </table>
  `;
  return {
    subject: `Pembayaran diterima — Order #${input.orderId}`,
    html: shell({
      preheader: `Rp ${input.amount.toLocaleString("id-ID")} berhasil dibayar via ${input.method}.`,
      title,
      body,
      cta: { label: "Unduh invoice", href: input.invoiceUrl },
    }),
    text: plain({
      title,
      body: `Rp ${input.amount.toLocaleString("id-ID")} via ${input.method} (${input.paidAt})`,
      cta: { label: "Unduh invoice", href: input.invoiceUrl },
    }),
  };
}

export function renderDelivered(input: {
  name: string;
  orderId: string;
  reviewUrl: string;
}): RenderedEmail {
  const title = `Barangmu sudah sampai! 🎉`;
  const body = `
    <p>Hai ${input.name}, kabar baik — paket order <strong>#${input.orderId}</strong> sudah terkirim ke alamatmu di Samarinda.</p>
    <p>Kalau ada yang kurang sesuai, kasih tau kami dalam 24 jam untuk klaim garansi. Kalau semua oke, mohon waktu sebentar untuk kasih rating ke personal shopper kami — sangat berarti buat tim!</p>
  `;
  return {
    subject: `Order #${input.orderId} sampai — kasih rating yuk!`,
    html: shell({
      preheader: "Barangmu sudah sampai. Kasih rating dan dapat 25 BB Points!",
      title,
      body,
      cta: { label: "Kasih rating sekarang", href: input.reviewUrl },
    }),
    text: plain({
      title,
      body: "Paketmu sampai. Kasih rating untuk dapat BB Points.",
      cta: { label: "Rating", href: input.reviewUrl },
    }),
  };
}

export const EMAIL_TEMPLATES = {
  welcome: renderWelcome,
  orderConfirmed: renderOrderConfirmed,
  statusUpdate: renderStatusUpdate,
  paymentReceipt: renderPaymentReceipt,
  delivered: renderDelivered,
} as const;
