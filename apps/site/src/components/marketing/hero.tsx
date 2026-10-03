import Link from "next/link";
import type { CSSProperties } from "react";
import { OngkirCalculator } from "./ongkir-calculator";
import { AmbientOrbs } from "./ambient-orbs";
import { LinkPaste } from "./link-paste";
import { delay } from "@/lib/motion";
import { getSiteMotion } from "@/lib/site-motion";

const WORDS = ["sepatu lokal", "skincare", "oleh-oleh", "baju distro", "buku"];

const STICKERS = [
  { text: "Cek harga dulu", className: "-top-4 left-4 lg:-left-6", tone: "bg-[hsl(var(--coral-500))] text-white", r: "-6deg", d: 700 },
  { text: "Bayar setelah setuju ✓", className: "-top-4 right-2 lg:-right-6", tone: "bg-[hsl(var(--sky-500))] text-white", r: "5deg", d: 900 },
  { text: "Rp43rb/kg", className: "-bottom-4 left-8 lg:-left-4", tone: "bg-[hsl(var(--amber-400))] text-[hsl(var(--sage-900))]", r: "-3deg", d: 1100 },
];

/** Price calculator with sticker badges (hero on desktop, below the quick actions on phones). */
export function CalculatorWithStickers() {
  return (
    <div className="relative">
      <OngkirCalculator />
      {STICKERS.map((s) => (
        <span
          key={s.text}
          aria-hidden
          style={{ "--r": s.r, ...delay(s.d) } as CSSProperties}
          className={`sticker pointer-events-none absolute z-10 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs sm:text-sm font-bold shadow-lg ${s.tone} ${s.className}`}
        >
          {s.text}
        </span>
      ))}
    </div>
  );
}

/**
 * Hero: big headline whose middle line cycles through what people titip,
 * and the price calculator wrapped in sticker badges that pop in and
 * wiggle. All CSS keyframes, so the copy shows on first paint without JS.
 */
export async function Hero() {
  const motion = await getSiteMotion();

  return (
    <section className="relative overflow-hidden">
      {motion.ambient && <AmbientOrbs />}
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
        <div className="lg:col-span-7">
          <h1
            style={delay(60)}
            className="animate-rise text-[2.6rem] sm:text-6xl lg:text-[4.25rem] font-bold leading-[1.02] tracking-[-0.03em]"
          >
            <span className="sr-only">Titip barang dari Bandung sampai rumahmu di Samarinda.</span>
            <span aria-hidden>
              Titip{" "}
              <span className="word-cycle inline-grid align-bottom pb-1">
                {WORDS.map((w) => (
                  <span key={w} className="text-[hsl(var(--sage-700))] dark:text-[hsl(var(--emerald-400))]">
                    {w}
                  </span>
                ))}
              </span>
              <br />
              dari{" "}
              <span className="relative inline-block">
                Bandung
                <span
                  style={delay(500)}
                  className="animate-pop absolute -bottom-0.5 left-0 right-0 -z-10 h-3 rounded-full bg-[hsl(var(--emerald-400)/0.35)]"
                />
              </span>
              ,
              <br />
              <span className="text-[hsl(var(--muted-foreground))]">sampai Samarinda.</span>
            </span>
          </h1>
          <p style={delay(140)} className="animate-rise mt-5 max-w-lg text-lg leading-relaxed text-[hsl(var(--muted-foreground))]">
            Kami cek harga di toko, kamu bayar setelah setuju.
          </p>
          <div style={delay(220)} className="animate-rise mt-7 max-w-xl">
            <LinkPaste />
            <p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">
              Atau{" "}
              <Link href="/katalog" className="font-medium text-[hsl(var(--foreground))] underline underline-offset-4">
                pilih dari katalog
              </Link>{" "}
              — harga sudah pasti.
            </p>
          </div>
        </div>

        <div style={delay(180)} className="animate-pop lg:col-span-5 relative hidden lg:block">
          <CalculatorWithStickers />
        </div>
      </div>
    </section>
  );
}
