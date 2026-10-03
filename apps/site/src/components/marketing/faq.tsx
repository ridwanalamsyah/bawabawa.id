import { Plus } from "lucide-react";
import { delay } from "@/lib/motion";
import { jsonLd, faqPageSchema } from "@/lib/seo/schema";

// Every answer must match how the business actually operates today (see
// /tentang, /terms, /refund). No claims about guarantees, licences, loyalty
// programmes or payment channels that aren't live.
export const FAQS = [
  {
    q: "Bagaimana cara titip barang?",
    a: "Pilih dari Katalog (harga sudah pasti), atau isi form Titip Barang dengan link/nama barang dan batas harganya. Untuk request, tim kami cek stok & harga asli lalu kirim penawaran final ke WhatsApp — kamu baru bayar setelah setuju.",
  },
  {
    q: "Berapa biayanya?",
    a: "Harga barang + jasa titip 8% dari harga barang (minimal Rp20.000) + ongkir. Ongkir Reguler Rp43.000/kg (dibulatkan ke 0,5 kg); Kargo lewat Open Trip flat Rp200.000 sampai 50 kg — lebih hemat untuk kiriman sekitar 5 kg ke atas. Form kami otomatis memilihkan yang paling hemat.",
  },
  {
    q: "Berapa lama sampai di Samarinda?",
    a: "Reguler 3–4 hari kerja setelah barang dikirim. Kargo mengikuti jadwal Open Trip (sekitar 10 hari kerja); tanggal berangkat terlihat saat kamu memilih trip.",
  },
  {
    q: "Bagaimana kalau harga di toko lebih mahal atau barang habis?",
    a: "Kami tidak membeli di atas batas harga yang kamu isi tanpa persetujuanmu. Kalau barang habis, kami ikuti pilihanmu di form: tanya dulu, ganti varian terdekat, atau batalkan item & refund.",
  },
  {
    q: "Bagaimana cara bayar?",
    a: "Setelah penawaran disetujui (atau langsung setelah checkout katalog), instruksi pembayaran muncul di halaman tracking dan dikirim ke WhatsApp. Kirim bukti bayar lewat tombol yang tersedia; status berubah setelah tim mengonfirmasi.",
  },
  {
    q: "Bagaimana cara melacak pesanan?",
    a: "Setiap pesanan punya link tracking pribadi yang dikirim ke WhatsApp-mu dan bisa dibuka dari perangkat mana pun tanpa login.",
  },
  {
    q: "Bisakah saya membatalkan pesanan?",
    a: "Bisa, langsung dari halaman tracking selama barang belum dibelikan. Setelah itu, hubungi admin lewat WhatsApp. Ketentuan refund lengkap ada di halaman Kebijakan Refund.",
  },
  {
    q: "Apa yang tidak boleh dititipkan?",
    a: "Barang ilegal, mudah meledak/terbakar, hewan hidup, makanan basah dengan masa simpan singkat, dan obat-obatan terkontrol. Detail lengkap di Syarat & Ketentuan.",
  },
  {
    q: "Siapa Bawabawa?",
    a: "Bawabawa adalah layanan jasa titip Bandung → Samarinda yang sedang dalam tahap soft launch dan belum berbadan hukum (pendaftaran sedang diproses). Data kontak & alamatmu hanya dipakai untuk memproses dan mengirim pesanan — lihat Kebijakan Privasi.",
  },
];

export function Faq() {
  return (
    <section className="py-16 sm:py-20 border-t border-[hsl(var(--border))]" aria-labelledby="faq-title">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div data-reveal className="lg:col-span-4">
          <h2 id="faq-title" className="text-2xl sm:text-3xl">
            Pertanyaan umum
          </h2>
          <p className="mt-3 text-[15px] text-[hsl(var(--muted-foreground))]">
            Belum terjawab? Tanya langsung lewat WhatsApp.
          </p>
        </div>
        <div data-reveal style={delay(100)} className="lg:col-span-8 divide-y divide-[hsl(var(--border))] border-y border-[hsl(var(--border))]">
          {FAQS.map((f, i) => (
            <details key={f.q} className="smooth group py-1" open={i === 0}>
              <summary className="flex cursor-pointer transition-colors hover:text-[hsl(var(--sage-700))] dark:hover:text-[hsl(var(--sage-300))] list-none items-center justify-between gap-4 py-4 font-medium [&::-webkit-details-marker]:hidden">
                {f.q}
                <Plus className="h-4 w-4 shrink-0 transition-transform duration-300 group-open:rotate-45" aria-hidden />
              </summary>
              <p className="pb-5 pr-8 text-[15px] leading-relaxed text-[hsl(var(--muted-foreground))]">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(faqPageSchema(FAQS.map((f) => ({ question: f.q, answer: f.a }))))}
      />
    </section>
  );
}
