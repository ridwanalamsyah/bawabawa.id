import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kebijakan Privasi & UU PDP",
  description:
    "Kebijakan privasi Bawabawa.id sesuai UU PDP No. 27 Tahun 2022. Data customer disimpan terenkripsi, tidak dijual ke pihak ketiga, dan dapat dihapus atas permintaan.",
  alternates: { canonical: "/privacy" },
};

const UPDATED = "1 Mei 2025";

const SECTIONS: Array<{ title: string; body: React.ReactNode }> = [
  {
    title: "1. Pengantar",
    body: (
      <>
        <p>
          PT Bawabawa Indonesia (&ldquo;Bawabawa&rdquo;, &ldquo;kami&rdquo;) menghormati
          privasi setiap pengguna layanan. Kebijakan ini menjelaskan jenis data yang
          kami kumpulkan, cara penggunaan, perlindungan, dan hak kamu sebagai
          subjek data sesuai{" "}
          <strong>Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP)</strong>.
        </p>
      </>
    ),
  },
  {
    title: "2. Data yang Kami Kumpulkan",
    body: (
      <ul className="list-disc pl-5 space-y-1">
        <li><strong>Data identitas:</strong> nama, nomor telepon, email, alamat pengiriman.</li>
        <li><strong>Data transaksi:</strong> detail request, harga barang, riwayat pembayaran.</li>
        <li><strong>Data pembayaran:</strong> diproses oleh DOKU (kami tidak menyimpan nomor kartu kredit).</li>
        <li><strong>Data teknis:</strong> alamat IP, jenis perangkat, browser, untuk keamanan & analitik agregat.</li>
        <li><strong>Cookie:</strong> esensial (sesi login, keranjang) & analitik (opsional, dengan persetujuan).</li>
      </ul>
    ),
  },
  {
    title: "3. Tujuan Penggunaan",
    body: (
      <ul className="list-disc pl-5 space-y-1">
        <li>Memproses request, pembayaran, dan pengiriman barang.</li>
        <li>Komunikasi status order (email, WhatsApp, push notification).</li>
        <li>Mencegah penipuan & melindungi keamanan akun.</li>
        <li>Riset internal, analitik agregat (tidak dapat mengidentifikasi individu).</li>
        <li>Memenuhi kewajiban hukum (pajak, audit, permintaan otoritas berwenang).</li>
      </ul>
    ),
  },
  {
    title: "4. Berbagi Data dengan Pihak Ketiga",
    body: (
      <p>
        Kami hanya berbagi data dengan: (a) personal shopper yang ditugaskan ke
        request kamu (hanya nama, alamat tujuan, dan rincian barang), (b)
        penyedia pembayaran (DOKU), (c) kurir pengiriman (Biteship, JNE, dll.),
        dan (d) otoritas berwenang jika diwajibkan oleh hukum. Kami{" "}
        <strong>tidak pernah menjual data kamu</strong> ke pihak iklan atau marketplace lain.
      </p>
    ),
  },
  {
    title: "5. Hak Kamu sebagai Subjek Data (UU PDP Pasal 5–14)",
    body: (
      <ul className="list-disc pl-5 space-y-1">
        <li><strong>Hak akses:</strong> minta salinan data pribadi kamu kapan saja.</li>
        <li><strong>Hak koreksi:</strong> minta perbaikan data yang tidak akurat.</li>
        <li><strong>Hak hapus:</strong> minta penghapusan data setelah masa retensi.</li>
        <li><strong>Hak portabilitas:</strong> minta data dalam format yang dapat dibaca mesin.</li>
        <li><strong>Hak menarik persetujuan:</strong> kapan saja, tanpa konsekuensi.</li>
      </ul>
    ),
  },
  {
    title: "6. Retensi Data",
    body: (
      <p>
        Data transaksi disimpan minimal 5 tahun (sesuai UU Perpajakan & UU
        Perdagangan). Data identitas customer yang tidak aktif &gt; 24 bulan
        akan dianonimisasi. Permintaan penghapusan dipenuhi dalam 30 hari kerja.
      </p>
    ),
  },
  {
    title: "7. Keamanan Data",
    body: (
      <ul className="list-disc pl-5 space-y-1">
        <li>Enkripsi data saat transit (TLS 1.2+) dan saat istirahat (AES-256).</li>
        <li>Database di-host di pusat data dengan sertifikasi ISO 27001.</li>
        <li>Audit keamanan reguler & uji penetrasi tahunan.</li>
        <li>Akses karyawan terbatas (need-to-know basis).</li>
      </ul>
    ),
  },
  {
    title: "8. Kontak DPO (Data Protection Officer)",
    body: (
      <p>
        Pertanyaan, keluhan, atau permintaan terkait data pribadi dapat dikirim
        ke: <strong>privacy@bawabawa.id</strong>. Kami merespons paling lambat
        14 hari kerja. Jika tidak puas, kamu dapat mengajukan keluhan ke{" "}
        <strong>Kementerian Komunikasi dan Informatika RI</strong> sebagai
        otoritas pengawas UU PDP.
      </p>
    ),
  },
  {
    title: "9. Perubahan Kebijakan",
    body: (
      <p>
        Kebijakan ini dapat diperbarui sewaktu-waktu. Perubahan signifikan akan
        diumumkan via email atau notifikasi dashboard minimal 14 hari sebelum
        berlaku.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
      <p className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))] font-semibold">
        Legal · UU PDP
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">
        Kebijakan Privasi
      </h1>
      <p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">
        Terakhir diperbarui: {UPDATED} · Berlaku untuk semua layanan
        Bawabawa.id
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
