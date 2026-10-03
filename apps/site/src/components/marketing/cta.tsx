import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CtaVisual } from "@/components/marketing/cta-visual";
import { getSiteMotion } from "@/lib/site-motion";

/**
 * Closing call-to-action: copy on the left, the Indonesia map with the
 * Bandung → Samarinda flight on the right. CSS-only entrance animations, so
 * the section is visible on first paint.
 */
export async function FinalCTA() {
  const motion = await getSiteMotion();
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          data-reveal
          className="relative overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] p-8 sm:p-12 lg:p-16 isolate"
        >
          <div className="absolute inset-0 -z-10 bg-linear-to-br from-[hsl(var(--sage-700))] via-[hsl(var(--sage-800))] to-[hsl(var(--sage-900))]" />
          {motion.ambient && (
            <div className="absolute inset-0 -z-10 opacity-30" aria-hidden>
              <div className="animate-orb-drift absolute -top-32 -left-20 h-96 w-96 rounded-full bg-[hsl(var(--emerald-400))] blur-3xl" />
              <div className="animate-orb-drift absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-[hsl(var(--olive-300))] blur-3xl [animation-direction:reverse]" />
            </div>
          )}
          <div className="absolute inset-0 -z-10 opacity-[0.07] dot-grid text-white" aria-hidden />

          <div className="grid items-center gap-10 lg:gap-14 lg:grid-cols-[1.05fr_1fr]">
            <div className="text-center lg:text-left">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[hsl(var(--sage-200))]">
                Mulai sekarang
              </p>
              <h2 className="mt-4 text-3xl sm:text-5xl font-semibold tracking-tight text-white max-w-3xl mx-auto lg:mx-0 leading-[1.05]">
                Titipan dari Bandung,
                <br />
                sampai depan rumah Samarinda.
              </h2>
              <p className="mt-5 max-w-xl mx-auto lg:mx-0 text-[hsl(var(--sage-100))]/80">
                Kirim link atau nama barangnya. Kami cek harga dulu, kamu bayar setelah setuju — lalu
                barangnya kami kirim sampai Samarinda.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Button asChild size="lg" variant="accent">
                  <Link href="/request" className="nudge">
                    Titip Sekarang <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="bg-transparent text-white border-white/40 hover:bg-white/10">
                  <Link href="/open-trip">Lihat Open Trip</Link>
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
