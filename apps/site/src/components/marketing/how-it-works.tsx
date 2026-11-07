import { Link2, MessageCircle, Wallet, Truck } from "lucide-react";
import { delay } from "@/lib/motion";

const STEPS = [
  {
    title: "Pilih barang & jalur",
    desc: "Pilih dari katalog Bandung atau tulis nama barang dan toko tujuanmu.",
    icon: Link2,
    tone: "bg-[hsl(var(--sage-100))] text-[hsl(var(--sage-700))]",
  },
  {
    title: "Cek stok di toko",
    desc: "Tim kami di Bandung memastikan ketersediaan barang dan mengirimkan rincian ke WhatsApp.",
    icon: MessageCircle,
    tone: "bg-[hsl(var(--sky-100))] text-[hsl(var(--sky-600))]",
  },
  {
    title: "Transfer atau QRIS",
    desc: "Bayar lewat rekening BCA / Mandiri / SeaBank atau scan QRIS setelah kamu setuju.",
    icon: Wallet,
    tone: "bg-[hsl(var(--amber-100))] text-[hsl(var(--amber-600))]",
  },
  {
    title: "Pesanan dikirim",
    desc: "Diantar instan se-Bandung Raya, travel sameday ke Jabar/Jakarta, atau kloter ke Hub Samarinda.",
    icon: Truck,
    tone: "bg-[hsl(var(--coral-100))] text-[hsl(var(--coral-600))]",
  },
];

export function HowItWorks() {
  return (
    <section className="py-12 sm:py-16 border-t border-[hsl(var(--border))]" aria-labelledby="how-title">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 id="how-title" data-reveal className="text-2xl sm:text-3xl font-bold">
          Cara kerjanya
        </h2>
        <ol className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-8">
          {STEPS.map((s, i) => (
            <li key={s.title} data-reveal style={delay(i * 110)} className="relative flex gap-4 lg:block">
              <span className={`relative z-10 grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${s.tone}`}>
                <s.icon className="h-5 w-5" aria-hidden />
                <span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-[hsl(var(--foreground))] text-[10px] font-bold text-[hsl(var(--bg))]">
                  {i + 1}
                </span>
              </span>
              {i < STEPS.length - 1 && (
                <span
                  aria-hidden
                  className="reveal-bar absolute left-14 right-0 top-6 hidden h-0.5 rounded-full bg-[hsl(var(--border))] lg:block"
                />
              )}
              <div className="lg:mt-4">
                <h3 className="text-lg font-semibold">{s.title}</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-[hsl(var(--muted-foreground))]">
                  {s.desc}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
