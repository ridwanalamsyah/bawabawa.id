import Link from "next/link";
import { OngkirCalculator } from "./ongkir-calculator";
import { AmbientOrbs } from "./ambient-orbs";
import { LinkPaste } from "./link-paste";
import { delay } from "@/lib/motion";
import { getSiteMotion } from "@/lib/site-motion";
import { getHomepageContent } from "@/lib/site-content";

export function CalculatorWithStickers() {
  return <OngkirCalculator />;
}

export async function Hero() {
  const [motion, content] = await Promise.all([getSiteMotion(), getHomepageContent()]);
  const words = Array.from({ length: 5 }, (_, i) => content.words[i % content.words.length]);

  return (
    <section className="relative overflow-hidden">
      {motion.ambient && <AmbientOrbs />}
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
        <div className="lg:col-span-7">
          <h1
            style={delay(60)}
            className="animate-rise text-[2.6rem] sm:text-6xl lg:text-[4.1rem] font-bold leading-[1.04] tracking-[-0.03em]"
          >
            <span className="sr-only">Titip {content.words.join(", ")} dari Bandung sampai ke kotamu.</span>
            <span aria-hidden>
              Titip{" "}
              <span className="word-cycle inline-grid align-bottom pb-1">
                {words.map((w, i) => (
                  <span key={`${i}-${w}`} className="text-[hsl(var(--sage-700))] dark:text-[hsl(var(--emerald-400))]">
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
              <span className="text-[hsl(var(--muted-foreground))]">sampai ke kotamu.</span>
            </span>
          </h1>
          <p style={delay(140)} className="animate-rise mt-5 max-w-lg text-lg leading-relaxed text-[hsl(var(--muted-foreground))]">
            {content.subtitle}
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
