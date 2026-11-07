import { OngkirCalculator } from "./ongkir-calculator";
import { HeroQuickSearch } from "./hero-quick-search";

export function CalculatorWithStickers() {
  return <OngkirCalculator />;
}

export async function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-[hsl(var(--border))]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        {/* Left Column */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-3.5 py-1 text-xs font-medium text-[hsl(var(--muted-foreground))]">
            <span className="h-2 w-2 rounded-full bg-[hsl(var(--sage-600))]" />
            <span>Jastip Resmi Bandung · Belanja Setiap Hari</span>
          </div>

          <h1 className="font-display text-3xl sm:text-5xl font-bold leading-[1.1] tracking-tight text-[hsl(var(--foreground))]">
            Titip Kuliner &amp; Barang Hits Bandung.
          </h1>

          <p className="max-w-lg text-base leading-relaxed text-[hsl(var(--muted-foreground))]">
            Dari Roti Macan, Tjilaki 9, hingga Kopi Makjay — kirim Instant Bandung, Sameday Travel Jabar &amp; Jakarta, atau Kloter ke Samarinda.
          </p>

          <HeroQuickSearch />
        </div>

        {/* Right Column: Clean 3-Zone Calculator */}
        <div className="lg:col-span-5">
          <OngkirCalculator />
        </div>
      </div>
    </section>
  );
}
