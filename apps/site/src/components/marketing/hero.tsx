import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OngkirCalculator } from "./ongkir-calculator";
import { HeroVisual } from "./hero-visual";
import { AmbientOrbs } from "./ambient-orbs";
import { delay } from "@/lib/motion";
import { getSiteMotion } from "@/lib/site-motion";

/**
 * Hero: copy on the left, the animated route illustration on the right
 * (with the price calculator in its own section below). When staff turn
 * the illustration off (Admin → Pengaturan → Animasi) the calculator takes
 * its place. Entrance animations are CSS keyframes, so the copy is visible
 * on first paint without JS.
 */
export async function Hero() {
  const motion = await getSiteMotion();

  return (
    <>
      <section className="relative overflow-hidden border-b border-[hsl(var(--border))]">
        {motion.ambient && <AmbientOrbs />}
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          <div className="lg:col-span-7">
            <p className="animate-rise inline-flex items-center gap-2 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--surface)/0.8)] backdrop-blur px-3 py-1 text-xs font-medium text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-200))]">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Jasa titip Bandung → Samarinda
            </p>
            <h1
              style={delay(60)}
              className={
                "animate-rise mt-5 text-4xl sm:text-5xl leading-[1.05] " +
                (motion.heroVisual ? "lg:text-[3.25rem]" : "lg:text-[3.5rem]")
              }
            >
              Barang dari{" "}
              <span className="relative inline-block">
                <span className="text-gradient-brand">Bandung</span>
                <span
                  aria-hidden
                  style={delay(500)}
                  className="animate-pop absolute -bottom-1 left-0 right-0 -z-10 h-1.5 rounded-full bg-[hsl(var(--emerald-400)/0.35)]"
                />
              </span>
              , dibelikan dan dikirim ke rumahmu di Samarinda.
            </h1>
            <p style={delay(140)} className="animate-rise mt-5 max-w-xl text-lg leading-relaxed text-[hsl(var(--muted-foreground))]">
              Kirim link atau nama barangnya. Kami cek stok dan harga di toko, kirim penawaran lewat
              WhatsApp, lalu belikan setelah kamu setuju dan bayar.
            </p>
            <div style={delay(220)} className="animate-rise mt-8 flex flex-col sm:flex-row gap-3">
              <Button asChild size="lg">
                <Link href="/request" className="nudge">
                  Titip barang <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/katalog">Lihat katalog</Link>
              </Button>
            </div>
            <dl style={delay(300)} className="animate-rise mt-10 grid grid-cols-3 gap-4 max-w-lg text-sm">
              <div>
                <dt className="text-[hsl(var(--muted-foreground))]">Ongkir</dt>
                <dd className="mt-1 font-semibold">Rp43rb/kg</dd>
              </div>
              <div>
                <dt className="text-[hsl(var(--muted-foreground))]">Jasa titip</dt>
                <dd className="mt-1 font-semibold">8%, min. Rp20rb</dd>
              </div>
              <div>
                <dt className="text-[hsl(var(--muted-foreground))]">Bayar</dt>
                <dd className="mt-1 font-semibold">Setelah setuju</dd>
              </div>
            </dl>
          </div>
          {motion.heroVisual ? (
            <div style={{ animationDelay: "0.2s" }} className="animate-hero-pop lg:col-span-5">
              <HeroVisual />
            </div>
          ) : (
            <div style={delay(180)} className="animate-pop lg:col-span-5">
              <OngkirCalculator />
            </div>
          )}
        </div>
      </section>

      {motion.heroVisual && (
        <section className="py-16 sm:py-20" aria-labelledby="calc-title">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div data-reveal className="lg:col-span-5">
              <h2 id="calc-title" className="text-2xl sm:text-3xl">
                Hitung dulu, baru titip
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-[hsl(var(--muted-foreground))]">
                Masukkan harga dan perkiraan berat — totalnya langsung kelihatan, sudah termasuk jasa
                titip dan ongkir. Kami pilihkan pengiriman yang paling hemat.
              </p>
            </div>
            <div data-reveal style={delay(100)} className="lg:col-span-7 lg:max-w-xl lg:ml-auto w-full">
              <OngkirCalculator />
            </div>
          </div>
        </section>
      )}
    </>
  );
}
