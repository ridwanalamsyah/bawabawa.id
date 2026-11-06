import { CheckCircle2, MessageCircle, QrCode, ShoppingBag, Truck } from "lucide-react";
import { delay } from "@/lib/motion";

const STEPS = [
  {
    title: "1. Pilih Jalur & Barang Bandung",
    desc: "Pilih dari Katalog Viral Bandung (Roti Macan, Tjilaki 9, Rochi, Makjay, In Parfume) atau tulis barang/toko Bandung apa saja beserta opsi jika stok habis.",
    icon: ShoppingBag,
    tone: "bg-[#F5DFAD] text-[#24201A]",
  },
  {
    title: "2. Tim Bandung Cek Stok & Antre",
    desc: "Tim shopper kami di Bandung mengecek ketersediaan di toko dan mengirimkan rincian total resmi ke WhatsApp kamu.",
    icon: MessageCircle,
    tone: "bg-[hsl(var(--sage-100))] text-[hsl(var(--sage-700))]",
  },
  {
    title: "3. Transfer Bank / Scan QRIS",
    desc: "Tanpa biaya layanan tambahan! Cukup transfer ke rekening resmi BCA / Mandiri / SeaBank atau scan QRIS Bawabawa.id lalu konfirmasi 1-klik di WA.",
    icon: QrCode,
    tone: "bg-[#FBE8E6] text-[#9E3B34]",
  },
  {
    title: "4. Dikirim Sesuai 3 Jalur",
    desc: "Diantar Instant se-Bandung Raya, masuk Shuttle Travel Sameday ke Jawa Barat/Jakarta, atau terbang via Kloter menuju Hub Bawabawa Samarinda.",
    icon: Truck,
    tone: "bg-[hsl(var(--sage-700))] text-white",
  },
];

export function HowItWorks() {
  return (
    <section className="py-12 sm:py-16 border-y border-[hsl(var(--border)/0.7)] bg-[hsl(var(--surface))]" aria-labelledby="how-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--sage-700))]">
            Alur Belanja Tanpa Ribet
          </span>
          <h2 id="how-title" data-reveal className="mt-1 font-display text-2xl sm:text-3xl font-bold text-[#24201A]">
            4 Langkah Titip Barang Bandung — Bayar via Transfer/QRIS &amp; Direct WA
          </h2>
        </div>

        <ol className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((s, i) => (
            <li
              key={s.title}
              data-reveal
              style={delay(i * 90)}
              className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--bg))] p-5 flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className={`grid h-11 w-11 place-items-center rounded-2xl ${s.tone}`}>
                    <s.icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="text-xs font-bold text-[hsl(var(--muted-foreground))]">
                    LANGKAH 0{i + 1}
                  </span>
                </div>
                <h3 className="mt-4 text-base font-bold text-[#24201A]">{s.title}</h3>
                <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
                  {s.desc}
                </p>
              </div>
              <div className="pt-2 border-t border-[hsl(var(--border)/0.6)] flex items-center gap-1.5 text-[11px] font-semibold text-[hsl(var(--sage-700))]">
                <CheckCircle2 className="h-3.5 w-3.5" /> Transparan &amp; Bergaransi Refund 100%
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
