import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan",
  description:
    "Syarat dan ketentuan layanan Bawabawa.id — jasa titip Bandung ke Samarinda. Mencakup pemesanan, pembayaran, pembatalan, refund, dan tanggung jawab para pihak.",
  alternates: { canonical: "/terms" },
};

const UPDATED = "1 Mei 2025";

const SECTIONS: Array<{ title: string; body: React.ReactNode }> = [
  {
    title: "1. Definisi",
    body: (
      <ul className="list-disc pl-5 space-y-1">
        <li><strong>&ldquo;Kami&rdquo;</strong> mengacu pada pengelola layanan Bawabawa.id.</li>
        <li><strong>&ldquo;Customer&rdquo;</strong> adalah pengguna yang melakukan request titipan barang.</li>
        <li><strong>&ldquo;Personal Shopper&rdquo;</strong> adalah mitra penitip yang membelanjakan barang sesuai request.</li>
        <li><strong>&ldquo;Trip&rdquo;</strong> adalah jadwal pengiriman dari Bandung ke Samarinda.</li>
        <li><strong>&ldquo;Layanan&rdquo;</strong> adalah seluruh fitur dan layanan yang disediakan Bawabawa.id, baik via web maupun WhatsApp.</li>
      </ul>
    ),
  },
  {
    title: "2. Pemesanan & Pembayaran",
    body: (
      <ul className="list-disc pl-5 space-y-1">
        <li>Customer wajib mengisi detail barang (nama, link/foto, kategori, kuantitas, estimasi harga) selengkap mungkin.</li>
        <li>Pembayaran dilakukan di muka sebelum personal shopper memulai belanja.</li>
        <li>Total ditagih = harga barang (estimasi) + jastip fee + ongkir + PPN (jika berlaku) + biaya tambahan opsional (asuransi, kemasan).</li>
        <li>Jika harga aktual barang berbeda dari estimasi, selisih akan ditagih/dikembalikan ke wallet customer setelah konfirmasi.</li>
        <li>Pembayaran via Midtrans (kartu kredit, transfer bank, e-wallet, QRIS) — Bawabawa.id tidak menyimpan data kartu.</li>
      </ul>
    ),
  },
  {
    title: "3. Personal Shopper",
    body: (
      <p>
        Personal shopper adalah mitra independen Bawabawa.id yang sudah lulus
        verifikasi identitas. Mereka berbelanja berdasarkan permintaan customer
        secara &ldquo;best effort&rdquo; — jika barang yang diminta tidak ditemukan,
        personal shopper akan menghubungi customer untuk konfirmasi substitusi
        atau refund parsial.
      </p>
    ),
  },
  {
    title: "4. Pengiriman & Tracking",
    body: (
      <ul className="list-disc pl-5 space-y-1">
        <li>Pengiriman dari Bandung ke Samarinda menggunakan kurir mitra (Biteship/JNE/SiCepat) sesuai opsi yang dipilih customer.</li>
        <li>Estimasi waktu pengiriman: 3–7 hari kerja untuk batch reguler, 1–3 hari kerja untuk fast track.</li>
        <li>Nomor resi akan dikirim ke email & WhatsApp customer begitu paket diserahterimakan ke kurir.</li>
        <li>Risiko kehilangan/kerusakan selama pengiriman diatur oleh kebijakan kurir; opsi asuransi tambahan tersedia di checkout.</li>
      </ul>
    ),
  },
  {
    title: "5. Pembatalan & Refund",
    body: (
      <p>
        Lihat <a href="/refund" className="underline decoration-dotted underline-offset-2 hover:text-[hsl(var(--sage-700))]">Kebijakan Refund</a> untuk
        detail lengkap mengenai kapan customer dapat membatalkan pesanan,
        besaran refund, dan timeline pemrosesan.
      </p>
    ),
  },
  {
    title: "6. Larangan Barang Titipan",
    body: (
      <ul className="list-disc pl-5 space-y-1">
        <li>Senjata, amunisi, bahan peledak.</li>
        <li>Narkotika, psikotropika, obat keras tanpa resep.</li>
        <li>Barang ilegal, bajakan, atau yang melanggar hak kekayaan intelektual.</li>
        <li>Hewan hidup, jenazah, organ tubuh.</li>
        <li>Cairan/gas mudah terbakar yang melanggar aturan kargo udara/darat.</li>
        <li>Barang yang dilarang regulasi Bea Cukai atau Karantina Indonesia.</li>
      </ul>
    ),
  },
  {
    title: "7. Akun & Keamanan",
    body: (
      <p>
        Customer bertanggung jawab menjaga kerahasiaan akun (email/password,
        OTP, sesi login). Kami tidak bertanggung jawab atas kerugian akibat
        akses tidak sah karena kelalaian customer. Jika kamu mencurigai akun
        diretas, segera hubungi <strong>support@bawabawa.id</strong>.
      </p>
    ),
  },
  {
    title: "8. Pembatasan Tanggung Jawab",
    body: (
      <p>
        Bawabawa.id menyediakan layanan apa adanya (&ldquo;as is&rdquo;). Kami tidak
        bertanggung jawab atas kerugian tidak langsung, kehilangan keuntungan,
        atau kerusakan reputasi akibat penggunaan layanan, kecuali diatur oleh
        UU Perlindungan Konsumen No. 8 Tahun 1999.
      </p>
    ),
  },
  {
    title: "9. Hukum yang Berlaku & Sengketa",
    body: (
      <p>
        Syarat ini tunduk pada hukum Republik Indonesia. Sengketa diselesaikan
        secara musyawarah; jika tidak tercapai, melalui Badan Penyelesaian
        Sengketa Konsumen (BPSK) atau pengadilan negeri di domisili Bandung.
      </p>
    ),
  },
  {
    title: "10. Perubahan Syarat",
    body: (
      <p>
        Syarat ini dapat diperbarui sewaktu-waktu. Perubahan signifikan akan
        diumumkan via email dan/atau notifikasi dashboard minimal 14 hari sebelum
        berlaku. Penggunaan layanan setelah pemberitahuan tersebut dianggap
        sebagai persetujuan atas syarat yang baru.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
      <p className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))] font-semibold">
        Legal
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">
        Syarat &amp; Ketentuan
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
