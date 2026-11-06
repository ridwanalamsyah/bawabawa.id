import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CtaVisual } from "@/components/marketing/cta-visual";
import { getSiteMotion } from "@/lib/site-motion";

export async function FinalCTA() {
  const motion = await getSiteMotion();
  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          data-reveal
          className="relative overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] p-8 sm:p-12 lg:p-14 isolate border border-[#24201A]"
        >
          {/* Warm Espresso + Matcha + Coral Accent Card instead of murky olive */}
          <div className="absolute inset-0 -z-10 bg-linear-to-br from-[#24201A] via-[#2E2A22] to-[#3B391E]" />
          <div className="absolute inset-0 -z-10 opacity-[0.08] dot-grid text-white" aria-hidden />

          <div className="grid items-center gap-10 lg:gap-14 lg:grid-cols-[1.05fr_1fr]">
            <div className="text-center lg:text-left">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#F5DFAD]">
                🛵 Bandung Instant · 🚐 Travel Jabar · ✈️ Hub Samarinda
              </p>
              <h2 className="mt-3 font-display text-3xl sm:text-5xl font-bold tracking-tight text-[#FCF3E4] max-w-3xl mx-auto lg:mx-0 leading-[1.06]">
                Titip kuliner &amp; barang viral Bandung hari ini.
              </h2>
              <p className="mt-4 max-w-xl mx-auto lg:mx-0 text-sm sm:text-base text-[#FCF3E4]/80 leading-relaxed">
                Pilih dari katalog Roti Macan, Bolu Pisang Tjilaki 9, Roti Merak, Rochi, Studio Bolen, Kopi Makjay, atau tulis barang apa saja. Bayar mudah via Transfer BCA/Mandiri &amp; QRIS, pantau langsung lewat WhatsApp.
              </p>
              <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Button asChild size="lg" variant="accent">
                  <Link href="/request" className="nudge font-bold text-[#24201A]">
                    Titip Barang Sekarang <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="bg-transparent text-[#FCF3E4] border-[#FCF3E4]/35 hover:bg-white/10"
                >
                  <Link href="/katalog">Lihat Katalog Viral Bandung</Link>
                </Button>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-md lg:max-w-none">
              <CtaVisual animate={motion.animations} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
