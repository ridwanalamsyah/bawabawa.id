"use client";

import { useState } from "react";
import { Check, Copy, MessageCircle, Printer, QrCode, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/card";
import { formatIDR } from "@/lib/utils";
import { DEFAULT_PAYMENT_INFO, type PaymentInfoConfig } from "@/lib/viral-bandung-data";

export type InvoiceOrderSummary = {
  code: string;
  customerName?: string;
  customerPhone?: string;
  city?: string;
  zoneLabel?: string;
  items: Array<{
    name: string;
    variant?: string | null;
    qty: number;
    unitPrice?: number | null;
    maxPrice?: number | null;
  }>;
  itemsTotal: number;
  jastipFee: number;
  shippingFee: number;
  discount?: number;
  total: number;
};

export function printCustomerInvoicePdf(order: InvoiceOrderSummary, payment: PaymentInfoConfig = DEFAULT_PAYMENT_INFO) {
  if (typeof window === "undefined") return;
  const win = window.open("", "_blank", "width=820,height=920");
  if (!win) {
    window.print();
    return;
  }

  const rowsHtml = order.items
    .map((it, idx) => {
      const unit = it.unitPrice ?? it.maxPrice ?? 0;
      const sub = unit * it.qty;
      return `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #E5E0D5;">${idx + 1}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #E5E0D5;">
            <strong>${it.name}</strong>
            ${it.variant ? `<br/><span style="color:#666;font-size:12px;">Varian/Toko: ${it.variant}</span>` : ""}
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #E5E0D5;text-align:center;">${it.qty}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #E5E0D5;text-align:right;">${formatIDR(unit)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #E5E0D5;text-align:right;font-weight:700;">${formatIDR(sub)}</td>
        </tr>
      `;
    })
    .join("");

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>Invoice_${order.code}_Bawabawa.id</title>
  <style>
    body { font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif; color: #1C1E1B; background: #FAF7F0; margin: 0; padding: 32px; }
    .sheet { max-width: 720px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E5E0D5; border-radius: 16px; padding: 32px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #E5E0D5; padding-bottom: 20px; }
    .eyebrow { color: #395A45; font-weight: 700; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
    th { background: #F4EFE4; text-align: left; padding: 10px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
    .totals { margin-top: 20px; margin-left: auto; width: 320px; font-size: 13px; }
    .totals div { display: flex; justify-content: space-between; padding: 6px 0; }
    .totals .grand { border-top: 1px solid #1C1E1B; font-size: 16px; font-weight: 700; padding-top: 10px; margin-top: 6px; color: #395A45; }
    .paybox { margin-top: 24px; background: #FAF7F0; border: 1px solid #E5E0D5; border-radius: 12px; padding: 16px; font-size: 12px; }
    @media print { body { background: #FFF; padding: 0; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="header">
      <div>
        <span class="eyebrow">Nota Resmi Bawabawa.id</span>
        <h1 style="margin:6px 0 4px;font-size:24px;">bawabawa.id</h1>
        <p style="margin:0;color:#666;font-size:12px;">Jasa Titip Bandung · Bandung Instant · Travel Jabar · Hub Samarinda</p>
      </div>
      <div style="text-align:right;">
        <div style="font-family:monospace;font-size:16px;font-weight:700;">#${order.code}</div>
        <div style="font-size:12px;color:#666;margin-top:4px;">Tanggal: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</div>
        ${order.city ? `<div style="font-size:12px;font-weight:600;margin-top:4px;">Tujuan: ${order.city}</div>` : ""}
      </div>
    </div>

    ${
      order.customerName
        ? `<div style="margin-top:16px;font-size:13px;">
            <strong>Pemesan:</strong> ${order.customerName} ${order.customerPhone ? `(${order.customerPhone})` : ""}
            ${order.zoneLabel ? ` · <strong>Jalur:</strong> ${order.zoneLabel}` : ""}
          </div>`
        : ""
    }

    <table>
      <thead>
        <tr>
          <th style="width:36px;">No</th>
          <th>Barang &amp; Toko Bandung</th>
          <th style="text-align:center;width:55px;">Qty</th>
          <th style="text-align:right;width:110px;">Harga Satuan</th>
          <th style="text-align:right;width:120px;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <div class="totals">
      <div><span>Subtotal Harga Toko</span><strong>${formatIDR(order.itemsTotal)}</strong></div>
      <div><span>Jasa Titip</span><strong>${formatIDR(order.jastipFee)}</strong></div>
      <div><span>Biaya Pengiriman</span><strong>${formatIDR(order.shippingFee)}</strong></div>
      ${order.discount ? `<div><span>Potongan Voucher</span><strong>-${formatIDR(order.discount)}</strong></div>` : ""}
      <div class="grand"><span>TOTAL TAGIHAN</span><span>${formatIDR(order.total)}</span></div>
    </div>

    <div class="paybox">
      <strong>Rekening Pembayaran Resmi (Transfer Bank &amp; QRIS):</strong><br/>
      • <strong>BCA:</strong> ${payment.bcaNumber} a.n ${payment.bcaHolder}<br/>
      • <strong>Mandiri:</strong> ${payment.mandiriNumber} a.n ${payment.mandiriHolder}<br/>
      • <strong>SeaBank:</strong> ${payment.seabankNumber} a.n ${payment.seabankHolder}<br/>
      • <strong>QRIS Resmi:</strong> ${payment.qrisMerchantName} (NMID: ${payment.qrisNmid})<br/>
      <span style="color:#666;display:block;margin-top:6px;">Simpan nota ini sebagai bukti pemesanan resmi Bawabawa.id.</span>
    </div>

    <div class="no-print" style="margin-top:20px;text-align:right;">
      <button onclick="window.print()" style="background:#395A45;color:#FFF;border:none;padding:10px 18px;border-radius:10px;font-weight:600;cursor:pointer;">Cetak / Simpan PDF</button>
    </div>
  </div>
  <script>setTimeout(() => window.print(), 350);</script>
</body>
</html>`;

  win.document.open();
  win.document.write(html);
  win.document.close();
}

export function PaymentQrisCard({
  order,
  payment = DEFAULT_PAYMENT_INFO,
}: {
  order: InvoiceOrderSummary;
  payment?: PaymentInfoConfig;
}) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyText = (key: string, val: string) => {
    void navigator.clipboard?.writeText(val.replace(/\s+/g, ""));
    setCopiedKey(key);
    setTimeout(() => setCopiedKey((prev) => (prev === key ? null : prev)), 1500);
  };

  const itemLinesText = order.items
    .map((it, idx) => `${idx + 1}. ${it.name}${it.variant ? ` (${it.variant})` : ""} x${it.qty}`)
    .join("\n");

  const waMessage = [
    `Halo Admin Bawabawa.id! Saya mau konfirmasi pesanan & pembayaran:`,
    ``,
    `*Kode Pesanan:* ${order.code}`,
    order.customerName ? `*Nama:* ${order.customerName}` : null,
    order.city ? `*Tujuan/Jalur:* ${order.city}` : null,
    `*Daftar Barang:*`,
    itemLinesText,
    ``,
    `*Total Estimasi/Tagihan:* ${formatIDR(order.total)}`,
    ``,
    `Mohon dicek ketersediaan stok di toko Bandung ya, saya siap kirim bukti transfer / QRIS. Terima kasih!`,
  ]
    .filter(Boolean)
    .join("\n");

  const waHref = `https://wa.me/${payment.whatsappAdmin.replace(/\D/g, "")}?text=${encodeURIComponent(waMessage)}`;

  return (
    <GlassCard className="p-5 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[hsl(var(--border))] pb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--sage-700))] font-semibold">
            Pembayaran Resmi
          </p>
          <h3 className="mt-1 text-xl font-bold">
            Transfer Bank atau Scan QRIS
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-[hsl(var(--muted-foreground))]">
            {payment.paymentNote}
          </p>
        </div>
        <div className="rounded-xl bg-[hsl(var(--bg))] border border-[hsl(var(--border))] px-4 py-2.5 text-right">
          <span className="text-[11px] font-medium text-[hsl(var(--muted-foreground))] block">
            Nominal Pembayaran
          </span>
          <span className="text-xl font-bold tabular-nums text-[hsl(var(--sage-700))]">
            {formatIDR(order.total)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-7 space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
            Pilihan Rekening Transfer
          </p>

          {[
            { id: "bca", bank: "Bank BCA", number: payment.bcaNumber, holder: payment.bcaHolder },
            { id: "mandiri", bank: "Bank Mandiri", number: payment.mandiriNumber, holder: payment.mandiriHolder },
            { id: "seabank", bank: "SeaBank", number: payment.seabankNumber, holder: payment.seabankHolder },
          ].map((acc) => (
            <div
              key={acc.id}
              className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--bg)/0.6)] p-3.5 flex items-center justify-between gap-3"
            >
              <div>
                <span className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">{acc.bank}</span>
                <p className="mt-0.5 font-mono text-base font-bold tracking-wide">
                  {acc.number}
                </p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">a.n. {acc.holder}</p>
              </div>
              <button
                type="button"
                onClick={() => copyText(acc.id, acc.number)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-3 py-2 text-xs font-semibold hover:bg-[hsl(var(--surface-2))] transition-colors shrink-0"
              >
                {copiedKey === acc.id ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-[hsl(var(--sage-700))]" /> Disalin
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" /> Salin
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        <div className="lg:col-span-5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--bg)/0.6)] p-4 flex flex-col items-center justify-between text-center">
          <div>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[hsl(var(--sage-700))]">
              <QrCode className="h-3.5 w-3.5" /> QRIS Resmi
            </span>
            <p className="mt-1 text-xs font-semibold">{payment.qrisMerchantName}</p>
            <p className="text-[11px] font-mono text-[hsl(var(--muted-foreground))]">
              NMID: {payment.qrisNmid}
            </p>
          </div>

          <div className="my-3 rounded-xl border border-[hsl(var(--border))] bg-white p-3">
            {payment.qrisImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={payment.qrisImageUrl}
                alt="QRIS Bawabawa.id"
                className="h-36 w-36 object-contain"
              />
            ) : (
              <svg viewBox="0 0 120 120" className="h-36 w-36 text-[#1C1E1B]" aria-label="QRIS Bawabawa.id">
                <rect width="120" height="120" fill="#FFFFFF" />
                <rect x="8" y="8" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="6" />
                <rect x="18" y="18" width="12" height="12" fill="currentColor" />
                <rect x="80" y="8" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="6" />
                <rect x="90" y="18" width="12" height="12" fill="currentColor" />
                <rect x="8" y="80" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="6" />
                <rect x="18" y="90" width="12" height="12" fill="currentColor" />
                <rect x="48" y="12" width="8" height="8" fill="currentColor" />
                <rect x="62" y="12" width="8" height="16" fill="currentColor" />
                <rect x="48" y="28" width="10" height="10" fill="currentColor" />
                <rect x="12" y="48" width="16" height="8" fill="currentColor" />
                <rect x="34" y="48" width="12" height="12" fill="currentColor" />
                <rect x="52" y="48" width="16" height="16" fill="#395A45" rx="3" />
                <rect x="74" y="48" width="10" height="14" fill="currentColor" />
                <rect x="92" y="48" width="18" height="8" fill="currentColor" />
                <rect x="12" y="64" width="10" height="10" fill="currentColor" />
                <rect x="48" y="70" width="14" height="10" fill="currentColor" />
                <rect x="68" y="68" width="16" height="12" fill="currentColor" />
                <rect x="90" y="66" width="10" height="18" fill="currentColor" />
                <rect x="48" y="88" width="12" height="22" fill="currentColor" />
                <rect x="68" y="88" width="14" height="10" fill="currentColor" />
                <rect x="88" y="90" width="22" height="20" fill="currentColor" />
                <rect x="94" y="96" width="10" height="8" fill="#FFFFFF" />
              </svg>
            )}
          </div>

          <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
            BCA Mobile, Livin&apos; Mandiri, GoPay, OVO, Dana, ShopeePay &amp; SeaBank.
          </p>
        </div>
      </div>

      <div className="pt-3 border-t border-[hsl(var(--border))] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
          <ShieldCheck className="h-4 w-4 text-[hsl(var(--sage-700))] shrink-0" />
          <span>Garansi refund 100% jika stok di toko Bandung habis.</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => printCustomerInvoicePdf(order, payment)}
          >
            <Printer className="h-4 w-4" /> Cetak Nota PDF
          </Button>
          <Button asChild variant="primary" size="lg">
            <a href={waHref} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4" /> Konfirmasi via WhatsApp
            </a>
          </Button>
        </div>
      </div>
    </GlassCard>
  );
}
