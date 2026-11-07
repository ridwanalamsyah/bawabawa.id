import { CheckCircle2, MapPin, ShieldCheck, Wallet } from "lucide-react";
import { OngkirCalculator } from "./ongkir-calculator";
import { HeroQuickSearch } from "./hero-quick-search";
import { delay } from "@/lib/motion";
import { getHomepageContent, getLiveShopperStatus, getZoneRates } from "@/lib/site-content";

export async function CalculatorWithStickers() {
  const zones = await getZoneRates();
  return <OngkirCalculator zones={zones} />;
}

export async function Hero() {
  const [content, liveStatus, zones] = await Promise.all([
    getHomepageContent(),
    getLiveShopperStatus(),
    getZoneRates(),
  ]);

  return (
    <section className="relative overflow-hidden border-b border-[hsl(var(--border))] bg-white">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        {/* Left Column: Headline, Quick Search + 3-Zone Selector, Trust Highlights */}
        <div className="lg:col-span-7">
          <div
            style={delay(20)}
            className="animate-rise inline-flex flex-wrap items-center gap-2 rounded-full border border-[hsl(var(--sage-200))] bg-[hsl(var(--sage-50))] px-3.5 py-1 text-xs font-semibold text-[hsl(var(--sage-700))]"
          >
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span>Personal Shopper Resmi Bandung</span>
            <span className="text-[hsl(var(--muted-foreground))]">·</span>
            <span className="font-medium text-[hsl(var(--foreground))]">{liveStatus.currentLocation}</span>
          </div>

          <h1
            style={delay(60)}
            className="animate-rise mt-4 text-3xl sm:text-4xl lg:text-[2.75rem] font-bold leading-[1.12] tracking-tight text-[hsl(var(--foreground))]"
          >
            Jastip Kuliner &amp; Barang Viral Bandung, Langsung ke Kotamu.
          </h1>

          <p
            style={delay(120)}
            className="animate-rise mt-3.5 max-w-2xl text-sm sm:text-base leading-relaxed text-[hsl(var(--muted-foreground))]"
          >
            {content.subtitle}
          </p>

          {/* Interactive Quick Search + 3-Zone Selector + Popular Chips */}
          <div style={delay(160)} className="animate-rise mt-6">
            <HeroQuickSearch />
          </div>

          {/* 3-Zone Route Summary Strip */}
          <div
            style={delay(220)}
            className="animate-rise mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2.5"
          >
            {zones.map((z) => (
              <div
                key={z.id}
                className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--bg))] p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[hsl(var(--foreground))]">{z.shortLabel}</span>
                  <span className="text-[11px] font-semibold text-[hsl(var(--sage-700))]">
                    Mulai Rp{(z.baseShippingRp / 1000).toFixed(0)}rb
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-[hsl(var(--muted-foreground))] truncate">
                  {z.eta}
                </p>
              </div>
            ))}
          </div>

          {/* Key Service Guarantees */}
          <div
            style={delay(260)}
            className="animate-rise mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[hsl(var(--muted-foreground))]"
          >
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--sage-700))]" />
              Harga Asli Toko Bandung
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Wallet className="h-3.5 w-3.5 text-[hsl(var(--sage-700))]" />
              Transfer BCA/Mandiri &amp; QRIS
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-[hsl(var(--sage-700))]" />
              Garansi Refund 100% Jika Habis
            </span>
          </div>
        </div>

        {/* Right Column: Interactive 3-Zone Calculator */}
        <div style={delay(140)} className="animate-pop lg:col-span-5 relative hidden lg:block">
          <OngkirCalculator zones={zones} />
        </div>
      </div>
    </section>
  );
}
