/**
 * Bawabawa.id — 8 Document Export Engine (4 Printable PDFs + 4 Excel/CSV Reports)
 *
 * PDFs:
 * 1. Nota / Invoice Pembeli (in components/marketing/payment-qris-card.tsx)
 * 2. Label Tempel Paket / Thermal A6 (printShippingLabelPdf)
 * 3. Daftar Belanja Lapangan Toko Bandung (printBandungShoppingListPdf)
 * 4. Manifest Kloter & Checklist Hub Samarinda (printSamarindaManifestPdf) + Slip Bagi Hasil 3 Partner (printProfitSharingSlipPdf)
 *
 * Excel/CSVs (UTF-8 BOM so Microsoft Excel & Google Sheets open columns cleanly):
 * 1. Rekap Bagi Hasil 3 Partner & Modal
 * 2. Master Pesanan & Laba
 * 3. Rekap Belanja & Modal Toko Bandung
 * 4. Database Pelanggan (CRM)
 */

import { formatIDR } from "@/lib/utils";

export function downloadExcelCsv(
  filename: string,
  headers: string[],
  rows: Array<Array<string | number | null | undefined>>
) {
  if (typeof window === "undefined") return;
  const escapeCell = (val: string | number | null | undefined) => {
    const s = val == null ? "" : String(val);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const lines = [
    headers.map(escapeCell).join(","),
    ...rows.map((r) => r.map(escapeCell).join(",")),
  ];
  // UTF-8 BOM (\uFEFF) ensures Microsoft Excel on Windows/Mac recognizes UTF-8 columns immediately
  const blob = new Blob(["\uFEFF" + lines.join("\r\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export type PrintableLabelOrder = {
  code: string;
  customerName: string;
  customerPhone: string;
  city: string;
  street?: string;
  zoneLabel: string;
  deliveryMethod?: string;
  trackingNumber?: string | null;
  estimatedKg?: number;
  items: Array<{ name: string; variant?: string | null; qty: number }>;
};

export function printShippingLabelPdf(orders: PrintableLabelOrder[]) {
  if (typeof window === "undefined" || orders.length === 0) return;
  const win = window.open("", "_blank", "width=760,height=920");
  if (!win) return;

  const cardsHtml = orders
    .map((o) => {
      const itemsHtml = o.items
        .map(
          (it) =>
            `<li><strong>${it.qty}x</strong> ${it.name}${it.variant ? ` (${it.variant})` : ""}</li>`
        )
        .join("");
      return `
        <div class="label-card">
          <div class="top">
            <div>
              <div class="brand">bawabawa.id</div>
              <div class="sub">JASTIP VIRAL BANDUNG · HUB SAMARINDA</div>
            </div>
            <div class="zone-badge">${o.zoneLabel}</div>
          </div>
          <div class="code-box">
            <span style="font-size:11px;color:#665E52;">KODE PAKET:</span>
            <div class="code">#${o.code}</div>
            ${o.trackingNumber ? `<div style="font-size:11px;font-weight:700;">Resi/Pool: ${o.trackingNumber}</div>` : ""}
          </div>
          <div class="recipient">
            <div style="font-size:10px;text-transform:uppercase;color:#665E52;font-weight:700;">Penerima &amp; Tujuan:</div>
            <div style="font-size:16px;font-weight:800;margin-top:2px;">${o.customerName}</div>
            <div style="font-size:13px;font-weight:700;">WA: ${o.customerPhone}</div>
            <div style="font-size:12px;margin-top:4px;"><strong>Kota:</strong> ${o.city}</div>
            ${o.street ? `<div style="font-size:12px;margin-top:2px;">${o.street}</div>` : ""}
          </div>
          <div class="items">
            <div style="font-size:10px;text-transform:uppercase;color:#665E52;font-weight:700;">Isi Paket (${o.estimatedKg ?? 1} kg):</div>
            <ul>${itemsHtml}</ul>
          </div>
          <div class="handling">
            <span>[✓] Jangan Dibanting</span>
            <span>[✓] Makanan Fresh Bandung</span>
            <span>[ ] Wajib Chiller / Ice Gel</span>
          </div>
        </div>
      `;
    })
    .join("");

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>Label_Paket_Bawabawa</title>
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; background: #FCF3E4; color: #24201A; margin: 0; padding: 20px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
    .label-card { background: #FFFDF9; border: 2.5px solid #24201A; border-radius: 16px; padding: 18px; page-break-inside: avoid; }
    .top { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #24201A; padding-bottom: 10px; }
    .brand { font-size: 20px; font-weight: 900; letter-spacing: -0.02em; }
    .sub { font-size: 9px; font-weight: 700; color: #665E52; }
    .zone-badge { background: #F5DFAD; border: 1.5px solid #24201A; padding: 4px 8px; border-radius: 8px; font-size: 11px; font-weight: 800; }
    .code-box { background: #FCF3E4; border: 1.5px dashed #24201A; border-radius: 10px; padding: 8px 12px; margin-top: 10px; display: flex; justify-content: space-between; align-items: center; }
    .code { font-family: monospace; font-size: 18px; font-weight: 900; }
    .recipient { margin-top: 12px; border-bottom: 1px solid #E6DAC3; padding-bottom: 10px; }
    .items { margin-top: 10px; font-size: 12px; }
    .items ul { margin: 4px 0 0; padding-left: 18px; }
    .handling { margin-top: 12px; padding-top: 8px; border-top: 1.5px solid #24201A; display: flex; justify-content: space-between; font-size: 10px; font-weight: 800; }
    @media print { body { background: #FFF; padding: 0; } }
  </style>
</head>
<body>
  <div class="grid">${cardsHtml}</div>
  <script>setTimeout(() => window.print(), 350);</script>
</body>
</html>`;

  win.document.open();
  win.document.write(html);
  win.document.close();
}

export type ShoppingStoreGroup = {
  storeName: string;
  items: Array<{
    itemName: string;
    variant: string;
    totalQty: number;
    estimatedUnitRp: number;
    orderCodes: string[];
    outOfStockNotes: string[];
  }>;
};

export function printBandungShoppingListPdf(groups: ShoppingStoreGroup[]) {
  if (typeof window === "undefined") return;
  const win = window.open("", "_blank", "width=860,height=920");
  if (!win) return;

  const sectionsHtml = groups
    .map((g) => {
      const rows = g.items
        .map(
          (it) => `
          <tr>
            <td style="text-align:center;font-size:16px;">☐</td>
            <td><strong>${it.itemName}</strong>${it.variant ? `<br/><span style="font-size:11px;color:#665E52;">Varian: ${it.variant}</span>` : ""}</td>
            <td style="text-align:center;font-weight:800;font-size:14px;">${it.totalQty}</td>
            <td style="text-align:right;">${formatIDR(it.estimatedUnitRp * it.totalQty)}</td>
            <td style="font-size:11px;">${it.orderCodes.join(", ")}</td>
            <td style="font-size:11px;color:#9E3B34;">${it.outOfStockNotes.join(" / ") || "Ganti varian mirip"}</td>
          </tr>
        `
        )
        .join("");

      return `
        <div style="margin-top:22px;page-break-inside:avoid;">
          <div style="background:#24201A;color:#FCF3E4;padding:8px 14px;border-radius:10px 10px 0 0;font-weight:800;font-size:14px;">
            📍 TOKO BANDUNG: ${g.storeName.toUpperCase()}
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:12px;border:1.5px solid #24201A;">
            <thead>
              <tr style="background:#F7EBD4;">
                <th style="width:36px;padding:8px;border:1px solid #E6DAC3;">Beli</th>
                <th style="padding:8px;border:1px solid #E6DAC3;text-align:left;">Nama Barang &amp; Varian</th>
                <th style="width:55px;padding:8px;border:1px solid #E6DAC3;">Total Qty</th>
                <th style="width:110px;padding:8px;border:1px solid #E6DAC3;text-align:right;">Est. Modal</th>
                <th style="width:130px;padding:8px;border:1px solid #E6DAC3;text-align:left;">Kode Order</th>
                <th style="width:140px;padding:8px;border:1px solid #E6DAC3;text-align:left;">Opsi Jika Habis</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      `;
    })
    .join("");

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>Daftar_Belanja_Toko_Bandung_Bawabawa</title>
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; color: #24201A; padding: 28px; }
    td { padding: 8px 10px; border: 1px solid #E6DAC3; }
  </style>
</head>
<body>
  <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #24201A;padding-bottom:14px;">
    <div>
      <h1 style="margin:0;font-size:22px;">DAFTAR BELANJA LAPANGAN TIM BANDUNG</h1>
      <p style="margin:4px 0 0;font-size:12px;color:#665E52;">Pegangan Belanja Toko Hits Bandung (Anda &amp; Pacar) · Dicetak ${new Date().toLocaleString("id-ID")}</p>
    </div>
    <div style="background:#F5DFAD;padding:6px 12px;border-radius:999px;font-size:12px;font-weight:800;">
      Total ${groups.length} Lokasi Toko
    </div>
  </div>
  ${sectionsHtml}
  <script>setTimeout(() => window.print(), 350);</script>
</body>
</html>`;

  win.document.open();
  win.document.write(html);
  win.document.close();
}

export function printSamarindaManifestPdf(
  orders: PrintableLabelOrder[],
  batchTitle = "Kloter Bandung → Hub Bawabawa Samarinda"
) {
  if (typeof window === "undefined") return;
  const win = window.open("", "_blank", "width=880,height=920");
  if (!win) return;

  const rowsHtml = orders
    .map((o, idx) => {
      const itemsStr = o.items
        .map((it) => `${it.qty}x ${it.name}${it.variant ? ` (${it.variant})` : ""}`)
        .join(", ");
      return `
        <tr>
          <td style="text-align:center;">${idx + 1}</td>
          <td style="font-family:monospace;font-weight:800;">#${o.code}</td>
          <td><strong>${o.customerName}</strong><br/><span style="font-size:11px;color:#665E52;">WA: ${o.customerPhone}</span></td>
          <td>${itemsStr}</td>
          <td style="text-align:center;">${o.estimatedKg ?? 1} kg</td>
          <td>${o.deliveryMethod === "pickup" ? "📍 Pickup di Hub Samarinda" : `🛵 Kurir ke ${o.city}`}</td>
          <td style="text-align:center;font-size:15px;">☐ Tiba  ☐ Diserahkan</td>
        </tr>
      `;
    })
    .join("");

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>Manifest_Hub_Samarinda_Bawabawa</title>
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; color: #24201A; padding: 28px; }
    table { width: 100%; border-collapse: collapse; margin-top: 18px; font-size: 12px; }
    th, td { border: 1px solid #24201A; padding: 8px 10px; text-align: left; }
    th { background: #F5DFAD; font-size: 11px; text-transform: uppercase; }
  </style>
</head>
<body>
  <div style="border-bottom:2px solid #24201A;padding-bottom:14px;display:flex;justify-content:space-between;align-items:flex-start;">
    <div>
      <span style="background:#24201A;color:#FCF3E4;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:800;">DOKUMEN PEGANGAN PARTNER HUB SAMARINDA</span>
      <h1 style="margin:8px 0 4px;font-size:22px;">MANIFEST KLOTER &amp; QC HUB BAWABAWA SAMARINDA</h1>
      <p style="margin:0;font-size:12px;color:#665E52;">${batchTitle} · Tanggal Cetak: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
    </div>
    <div style="text-align:right;font-size:12px;">
      <strong>Total Paket Samarinda:</strong> ${orders.length} Paket<br/>
      <strong>Total Berat:</strong> ${orders.reduce((s, o) => s + (o.estimatedKg ?? 1), 0).toFixed(1)} kg
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width:32px;">No</th>
        <th style="width:110px;">Kode Order</th>
        <th style="width:160px;">Pelanggan &amp; WA</th>
        <th>Daftar Barang</th>
        <th style="width:60px;text-align:center;">Berat</th>
        <th style="width:150px;">Metode Distribusi</th>
        <th style="width:140px;text-align:center;">Checklist QC Hub</th>
      </tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
  </table>
  <div style="margin-top:32px;display:flex;justify-content:space-between;font-size:12px;">
    <div>
      <strong>Pengirim Kloter Bandung:</strong><br/><br/><br/>
      ( Owner &amp; Co-Owner Bandung )
    </div>
    <div>
      <strong>Penerima &amp; QC Hub Samarinda:</strong><br/><br/><br/>
      ( Partner Hub Bawabawa Samarinda )
    </div>
  </div>
  <script>setTimeout(() => window.print(), 350);</script>
</body>
</html>`;

  win.document.open();
  win.document.write(html);
  win.document.close();
}

export function printProfitSharingSlipPdf(params: {
  periodLabel: string;
  totalModalTokoDanOngkirRp: number;
  totalNetJastipProfitRp: number;
  kasBisnisRp: number;
  ownerBandungRp: number;
  coOwnerBandungRp: number;
  hubSamarindaRp: number;
  orderCount: number;
}) {
  if (typeof window === "undefined") return;
  const win = window.open("", "_blank", "width=800,height=880");
  if (!win) return;

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>Slip_Bagi_Hasil_3_Partner_Bawabawa</title>
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; color: #24201A; padding: 32px; background: #FCF3E4; }
    .card { max-width: 680px; margin: 0 auto; background: #FFFDF9; border: 2px solid #24201A; border-radius: 20px; padding: 28px; }
    .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #E6DAC3; font-size: 14px; }
    @media print { body { background: #FFF; padding: 0; } }
  </style>
</head>
<body>
  <div class="card">
    <span style="background:#F5DFAD;padding:4px 10px;border-radius:999px;font-size:11px;font-weight:800;">LAPORAN TRANSPARANSI BAGI HASIL 3 PARTNER</span>
    <h1 style="margin:10px 0 4px;font-size:24px;">Slip Rekap Bagi Hasil &amp; Pengembalian Modal</h1>
    <p style="margin:0 0 20px;font-size:12px;color:#665E52;">Periode: ${params.periodLabel} · Total ${params.orderCount} Pesanan Selesai</p>

    <div style="background:#FCF3E4;border:1.5px solid #24201A;border-radius:14px;padding:16px;margin-bottom:20px;">
      <div style="font-size:12px;color:#665E52;font-weight:700;">1. UANG MODAL BELANJA TOKO BANDUNG &amp; ONGKIR ASLI (WAJIB KEMBALI UTUH DULU):</div>
      <div style="font-size:22px;font-weight:900;margin-top:4px;">${formatIDR(params.totalModalTokoDanOngkirRp)}</div>
      <div style="font-size:11px;color:#665E52;margin-top:4px;">*Uang modal ini dikembalikan 100% ke rekening penombok belanja sebelum membagi laba bersih.</div>
    </div>

    <div style="font-size:13px;font-weight:800;text-transform:uppercase;margin-bottom:8px;">
      2. Pembagian Laba Bersih Jastip (${formatIDR(params.totalNetJastipProfitRp)}):
    </div>
    <div class="row">
      <span>🏦 <strong>Kas Operasional &amp; Packing Bawabawa (10%)</strong></span>
      <strong>${formatIDR(params.kasBisnisRp)}</strong>
    </div>
    <div class="row">
      <span>👩‍❤️‍👨 <strong>Partner 1 — Owner Bandung (Anda)</strong></span>
      <strong>${formatIDR(params.ownerBandungRp)}</strong>
    </div>
    <div class="row">
      <span>👩‍❤️‍👨 <strong>Partner 2 — Co-Owner &amp; Belanja Bandung (Pacar)</strong></span>
      <strong>${formatIDR(params.coOwnerBandungRp)}</strong>
    </div>
    <div class="row">
      <span>✈️ <strong>Partner 3 — Hub &amp; Promosi Samarinda (Teman)</strong></span>
      <strong>${formatIDR(params.hubSamarindaRp)}</strong>
    </div>
  </div>
  <script>setTimeout(() => window.print(), 350);</script>
</body>
</html>`;

  win.document.open();
  win.document.write(html);
  win.document.close();
}
