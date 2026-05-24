import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CtaVisual } from "@/components/marketing/cta-visual";

// FinalCTA renders the homepage closing call-to-action with a 2-column
// layout on desktop (copy left, illustration right) and stacks on mobile.
// Entrance animations are CSS-only (see `animate-hero-*` in globals.css)
// so the section is visible on first paint without waiting on framer-motion
// hydration — same pattern used for the hero fix.
export function FinalCTA() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className="animate-hero-rise-lg relative overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] p-8 sm:p-12 lg:p-16"
          style={{ animationDelay: "0.1s" }}
        >
          <div className="absolute inset-0 -z-10 bg-linear-to-br from-[hsl(var(--sage-700))] via-[hsl(var(--sage-800))] to-[hsl(var(--sage-900))]" />
          <div className="absolute inset-0 -z-10 opacity-30">
            <div className="absolute -top-32 -left-20 h-96 w-96 rounded-full bg-[hsl(var(--emerald-400))] blur-3xl" />
            <div className="absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-[hsl(var(--olive-300))] blur-3xl" />
          </div>
          <div className="absolute inset-0 -z-10 opacity-[0.07] dot-grid text-white" />

          <div className="grid items-center gap-10 lg:gap-14 lg:grid-cols-[1.05fr_1fr]">
            <div className="text-center lg:text-left">
              <p
                className="animate-hero-rise text-xs font-semibold uppercase tracking-[0.25em] text-[hsl(var(--sage-200))]"
                style={{ animationDelay: "0.15s" }}
              >
                Mulai sekarang
              </p>
              <h2
                className="animate-hero-rise-lg mt-4 text-3xl sm:text-5xl font-semibold tracking-tight text-white max-w-3xl mx-auto lg:mx-0 leading-[1.05]"
                style={{ animationDelay: "0.25s" }}
              >
                Titipan dari Bandung,
                <br />
                sampai depan rumah Samarinda.
              </h2>
              <p
                className="animate-hero-rise mt-5 max-w-xl mx-auto lg:mx-0 text-[hsl(var(--sage-100))]/80"
                style={{ animationDelay: "0.35s" }}
              >
                Bergabung dengan ribuan customer yang sudah merasakan jasa titip premium ala startup digital.
              </p>
              <div
                className="animate-hero-rise mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start"
                style={{ animationDelay: "0.45s" }}
              >
                <Button asChild size="lg" variant="accent">
                  <Link href="/request">Titip Sekarang <ArrowRight className="h-4 w-4" /></Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="bg-transparent text-white border-white/40 hover:bg-white/10">
                  <Link href="/open-trip">Lihat Open Trip</Link>
                </Button>
              </div>
            </div>

            <div
              className="animate-hero-slide-in-right relative mx-auto w-full max-w-md lg:max-w-none"
              style={{ animationDelay: "0.35s" }}
            >
              <CtaVisual />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
