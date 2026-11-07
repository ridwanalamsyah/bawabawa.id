import { CheckCircle2, MessageCircle, QrCode, ShoppingBag, Truck } from "lucide-react";

const STEPS = [
  {
    step: "01",
    title: "Pilih Jalur & Barang Bandung",
    desc: "Pilih dari Katalog Viral Bandung (Roti Macan, Tjilaki 9, Roti Merak, Rochi, Studio Bolen, Makjay) atau ketik manual barang apa saja beserta jalur kirimnya.",
    icon: ShoppingBag,
  },
  {
    step: "02",
    title: "Cek Stok & Antrean Toko",
    desc: "Tim shopper Bandung kami memastikan stok di outlet terkait dan mengirimkan rincian tagihan transparan ke WhatsApp kamu.",
    icon: MessageCircle,
  },
  {
    step: "03",
    title: "Transfer Bank atau Scan QRIS",
    desc: "Pembayaran mudah tanpa biaya gateway via Transfer BCA / Mandiri / SeaBank atau Scan QRIS resmi, lalu kirim bukti via WhatsApp.",
    icon: QrCode,
  },
  {
    step: "04",
    title: "Diantar Sesuai Jalur Pilihanmu",
    desc: "Dikirim hari ini untuk Bandung Raya, sameday via Shuttle Travel untuk Jawa Barat & Jakarta, atau kloter udara ke Hub Samarinda.",
    icon: Truck,
  },
];

export function HowItWorks() {
  return (
    <section
      className="py-12 sm:py-16 border-y border-[hsl(var(--border))] bg-white"
      aria-labelledby="how-title"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--sage-700))]">
            Alur Pemesanan
          </p>
          <h2 id="how-title" className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight">
            Cara Kerja Jastip Bawabawa.id
          </h2>
          <p className="mt-1.5 text-sm text-[hsl(var(--muted-foreground))]">
            Tanpa perlu buat akun. Semua konfirmasi stok, bukti belanja, dan resi pengiriman terhubung langsung ke WhatsApp.
          </p>
        </div>

        <ol className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STEPS.map(({ step, title, desc, icon: Icon }) => (
            <li
              key={step}
              className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--bg))] p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-white border border-[hsl(var(--border))] text-[hsl(var(--sage-700))]">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="font-mono text-xs font-bold text-[hsl(var(--muted-foreground))]">
                    LANGKAH {step}
                  </span>
                </div>
                <h3 className="mt-4 text-base font-bold text-[hsl(var(--foreground))]">{title}</h3>
                <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
                  {desc}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[hsl(var(--border))] flex items-center gap-1.5 text-[11px] font-semibold text-[hsl(var(--sage-700))]">
                <CheckCircle2 className="h-3.5 w-3.5" /> Transparan &amp; Terlacak
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
