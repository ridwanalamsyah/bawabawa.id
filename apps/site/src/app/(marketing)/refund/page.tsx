import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kebijakan Pembatalan & Refund",
  description:
    "Kebijakan pembatalan order dan refund Bawabawa.id. Pengembalian dana penuh sebelum personal shopper berbelanja, refund parsial setelah belanja dimulai.",
  alternates: { canonical: "/refund" },
};

const UPDATED = "1 Mei 2025";

const TIMELINE: Array<{ stage: string; refund: string; note: string }> = [
  {
    stage: "Sebelum personal shopper mulai belanja",
    refund: "100% refund",
    note: "Dapat dibatalkan dari /dashboard/orders. Dana kembali ke metode pembayaran asli dalam 3–7 hari kerja.",
  },
  {
    stage: "Personal shopper sudah belanja sebagian/seluruh barang",
    refund: "Refund harga barang yang BELUM dibelanjakan (jika ada) + biaya layanan tetap ditagih",
    note: "Barang yang sudah dibeli akan tetap dikirim ke customer. Jastip fee tidak refundable karena tenaga sudah dikeluarkan.",
  },
  {
    stage: "Barang sudah dikirim ke kurir",
    refund: "Tidak dapat dibatalkan",
    note: "Customer dapat menolak paket saat tiba (return-to-sender). Biaya retur ditanggung customer.",
  },
];

const SECTIONS: Array<{ title: string; body: React.ReactNode }> = [
  {
    title: "1. Hak Pembatalan",
    body: (
      <p>
        Sesuai UU Perlindungan Konsumen No. 8 Tahun 1999, customer berhak
        membatalkan order sebelum personal shopper memulai belanja tanpa
        konsekuensi. Setelah belanja dimulai, pembatalan dapat dilakukan tetapi
        dengan ketentuan refund sebagai berikut:
      </p>
    ),
  },
  {
    title: "2. Tabel Refund per Tahap",
    body: (
      <div className="overflow-hidden rounded-2xl border border-[hsl(var(--border))]">
        <table className="w-full text-sm">
          <thead className="bg-[hsl(var(--surface-2))]">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Tahap order</th>
              <th className="text-left px-4 py-3 font-medium">Refund</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[hsl(var(--border))]">
            {TIMELINE.map((t) => (
              <tr key={t.stage}>
                <td className="px-4 py-3 align-top">{t.stage}</td>
                <td className="px-4 py-3 align-top">
                  <p className="font-medium">{t.refund}</p>
                  <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{t.note}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
  },
  {
    title: "3. Refund karena Kesalahan Kami",
    body: (
      <p>
        Jika ketidaksesuaian pengiriman terjadi karena kesalahan kami atau
        personal shopper (barang salah, jumlah kurang, paket rusak saat
        diterima), customer berhak refund <strong>100% + jastip fee + ongkir</strong>.
        Klaim wajib disertai foto bukti dalam waktu 3 hari kalender sejak paket
        diterima.
      </p>
    ),
  },
  {
    title: "4. Refund Barang Tidak Ditemukan",
    body: (
      <p>
        Jika personal shopper tidak dapat menemukan barang yang diminta,
        customer akan dihubungi untuk pilihan: (a) substitusi dengan barang
        serupa, (b) refund parsial untuk item tersebut, atau (c) pembatalan
        seluruh order dengan refund 100% dikurangi jastip fee.
      </p>
    ),
  },
  {
    title: "5. Metode & Timeline Pengembalian",
    body: (
      <ul className="list-disc pl-5 space-y-1">
        <li><strong>Kartu kredit/debit:</strong> 5–14 hari kerja, mengikuti siklus penagihan bank.</li>
        <li><strong>Transfer bank:</strong> 1–3 hari kerja setelah pembatalan dikonfirmasi.</li>
        <li><strong>E-wallet (OVO/GoPay/Dana):</strong> 1–3 hari kerja.</li>
        <li><strong>QRIS:</strong> ditampung ke wallet Bawabawa.id, dapat ditarik atau digunakan untuk order berikutnya.</li>
      </ul>
    ),
  },
  {
    title: "6. Cara Mengajukan Pembatalan/Refund",
    body: (
      <ul className="list-disc pl-5 space-y-1">
        <li>Buka <strong>/dashboard/orders</strong> → pilih order → tombol &ldquo;Batalkan&rdquo;.</li>
        <li>Atau hubungi <strong>support@bawabawa.id</strong> dengan menyertakan kode order.</li>
        <li>Atau chat WhatsApp ke nomor CS resmi Bawabawa.id.</li>
      </ul>
    ),
  },
];

export default function RefundPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
      <p className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))] font-semibold">
        Legal · Refund
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">
        Kebijakan Pembatalan &amp; Refund
      </h1>
      <p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">
        Terakhir diperbarui: {UPDATED} · Berlaku untuk semua layanan Bawabawa.id
      </p>

      <div className="mt-10 space-y-8">
        {SECTIONS.map((s) => (
          <section key={s.title}>
            <h2 className="text-xl font-semibold tracking-tight">{s.title}</h2>
            <div className="mt-3 text-sm leading-relaxed text-[hsl(var(--foreground))] [&_p]:mb-2">
              {s.body}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
