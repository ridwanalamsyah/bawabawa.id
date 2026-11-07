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
    <section className="relative overflow-hidden">
      {motion.ambient && <AmbientOrbs />}
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
        <div className="lg:col-span-7">
          <h1
            style={delay(60)}
            className="animate-rise text-[2.5rem] sm:text-6xl lg:text-[4rem] font-bold leading-[1.04] tracking-[-0.03em]"
          >
            <span className="sr-only">
              Titip {content.words.join(", ")} dari Bandung ke Bandung Raya, Jawa Barat &amp; Samarinda.
            </span>
            <span aria-hidden>
              Titip{" "}
              <span className="word-cycle inline-grid align-bottom pb-1">
                {words.map((w, i) => (
                  <span key={`${i}-${w}`} className="text-[hsl(var(--sage-700))]">
                    {w}
                  </span>
                ))}
              </span>
              <br />
              langsung dari{" "}
              <span className="relative inline-block">
                Bandung
                <span
                  style={delay(500)}
                  className="animate-pop absolute -bottom-0.5 left-0 right-0 -z-10 h-3 rounded-full bg-[hsl(var(--sage-200)/0.65)]"
                />
              </span>
              ,
              <br />
              <span className="text-[hsl(var(--muted-foreground))]">sampai ke kotamu.</span>
            </span>
          </h1>

          <p
            style={delay(140)}
            className="animate-rise mt-5 max-w-lg text-lg leading-relaxed text-[hsl(var(--muted-foreground))]"
          >
            Kami belikan langsung di toko Bandung dengan harga asli — kirim instan se-Bandung Raya,
            travel sameday ke Jawa Barat &amp; Jakarta, atau kargo rutin ke Hub Samarinda.
          </p>

          <div style={delay(220)} className="animate-rise mt-7 max-w-xl">
            <HeroQuickSearch />
          </div>
        </div>

        <div style={delay(180)} className="animate-pop lg:col-span-5 relative hidden lg:block">
          <OngkirCalculator zones={zones} />
        </div>
      </div>
    </section>
  );
}
