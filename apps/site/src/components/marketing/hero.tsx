import Link from "next/link";
import { CheckCircle2, MapPin, Plane, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { OngkirCalculator } from "./ongkir-calculator";
import { AmbientOrbs } from "./ambient-orbs";
import { HeroQuickSearch } from "./hero-quick-search";
import { delay } from "@/lib/motion";
import { getSiteMotion } from "@/lib/site-motion";
import { getHomepageContent, getZoneRates } from "@/lib/site-content";

export async function CalculatorWithStickers() {
  const zones = await getZoneRates();
  return (
    <div className="relative">
      <OngkirCalculator zones={zones} />
    </div>
  );
}

export async function Hero() {
  const [motion, content, zones] = await Promise.all([
    getSiteMotion(),
    getHomepageContent(),
    getZoneRates(),
  ]);
  const words = Array.from({ length: 5 }, (_, i) => content.words[i % content.words.length]);

  return (
    <section className="relative overflow-hidden border-b border-[hsl(var(--border)/0.7)]">
      {motion.ambient && <AmbientOrbs />}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
        <div className="lg:col-span-7">
          {/* Pill Badge */}
          <div style={delay(30)} className="animate-rise inline-flex flex-wrap items-center gap-2 rounded-full border border-[#E6DAC3] bg-[hsl(var(--surface))] px-3.5 py-1.5 text-xs font-semibold text-[#24201A] shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-[#E98881]" />
            <span>Personal Shopper Resmi Bandung · Tanpa Perlu Ikut Antre Subuh</span>
          </div>

          <h1
            style={delay(60)}
            className="animate-rise mt-4 font-display text-[2.35rem] sm:text-5xl lg:text-[3.55rem] font-bold leading-[1.06] tracking-[-0.02em] text-[#24201A]"
          >
            <span className="sr-only">
              Titip {content.words.join(", ")} dari Bandung ke Bandung Raya, Jawa Barat &amp; Hub Samarinda.
            </span>
            <span aria-hidden>
              Titip{" "}
              <span className="word-cycle inline-grid align-bottom pb-1">
                {words.map((w, i) => (
                  <span key={`${i}-${w}`} className="text-[hsl(var(--sage-700))] underline decoration-[#E98881]/60 decoration-wavy underline-offset-4">
                    {w}
                  </span>
                ))}
              </span>
              <br />
              langsung dari{" "}
              <span className="relative inline-block px-1">
                Toko Bandung
                <span
                  style={delay(400)}
                  className="animate-pop absolute inset-x-0 bottom-1 -z-10 h-3.5 rounded-full bg-[#F5DFAD]"
                />
              </span>
              .
            </span>
          </h1>

          <p
            style={delay(120)}
            className="animate-rise mt-4 max-w-2xl text-base sm:text-lg leading-relaxed text-[hsl(var(--muted-foreground))]"
          >
            {content.subtitle}
          </p>

          {/* 3-Zone Delivery Highlights */}
          <div style={delay(160)} className="animate-rise mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="rounded-2xl border border-[#E6DAC3] bg-[hsl(var(--surface))] p-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[hsl(var(--sage-700))]">
                <MapPin className="h-3.5 w-3.5 shrink-0" /> 🛵 Bandung Instant
              </div>
              <p className="mt-1 text-[11px] text-[hsl(var(--muted-foreground))] leading-snug">
                Kota Bandung, Cimahi, Lembang, Jatinangor, Antar Hotel &amp; Stasiun Whoosh.
              </p>
            </div>
            <div className="rounded-2xl border border-[#E6DAC3] bg-[hsl(var(--surface))] p-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#B85048]">
                <Truck className="h-3.5 w-3.5 shrink-0" /> 🚐 Travel Jabar &amp; JKT
              </div>
              <p className="mt-1 text-[11px] text-[hsl(var(--muted-foreground))] leading-snug">
                Sameday 4–8 jam via Cititrans, DayTrans, Arnes, Bhinneka &amp; Pasteur Trans.
              </p>
            </div>
            <div className="rounded-2xl border border-[#E6DAC3] bg-[hsl(var(--surface))] p-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[hsl(var(--sage-700))]">
                <Plane className="h-3.5 w-3.5 shrink-0" /> ✈️ Hub Samarinda
              </div>
              <p className="mt-1 text-[11px] text-[hsl(var(--muted-foreground))] leading-snug">
                Kloter Udara → Pickup Point Hub Bawabawa Samarinda &amp; Kurir Kaltim.
              </p>
            </div>
          </div>

          {/* Search & Viral Bandung Quick-Pick Box */}
          <div style={delay(210)} className="animate-rise mt-6">
            <HeroQuickSearch />
          </div>

          {/* Trust Bar */}
          <div style={delay(260)} className="animate-rise mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[hsl(var(--muted-foreground))]">
            <span className="inline-flex items-center gap-1.5 font-medium text-[hsl(var(--foreground))]">
              <CheckCircle2 className="h-4 w-4 text-[hsl(var(--sage-700))]" />
              Harga Asli Toko Bandung
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium text-[hsl(var(--foreground))]">
              <ShieldCheck className="h-4 w-4 text-[#E98881]" />
              Bayar Mudah via Transfer BCA/Mandiri &amp; QRIS
            </span>
            <Link
              href="/katalog"
              className="font-bold text-[hsl(var(--sage-700))] underline underline-offset-4 hover:text-[hsl(var(--foreground))]"
            >
              Lihat 20+ Katalog Viral Bandung →
            </Link>
          </div>
        </div>

        <div style={delay(180)} className="animate-pop lg:col-span-5 relative hidden lg:block">
          <OngkirCalculator zones={zones} />
        </div>
      </div>
    </section>
  );
}
