import Link from "next/link";
import { ArrowRight, Sparkles, ShieldCheck, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroVisual } from "./hero-visual";
import { LiveStats } from "./live-stats";
import { AmbientOrbs } from "./ambient-orbs";

// NOTE on motion: this surface used to wrap every line in `motion.*` with
// `initial={{ opacity: 0 }}` + `animate={{ opacity: 1 }}`. The SSR snapshot
// therefore baked `opacity:0` into the DOM and waited on framer-motion to
// hydrate the animation client-side. When the JS chunks hydrated late (slow
// connections, route warm-up) or framer-motion threw during hydration the
// hero text would stay invisible — exactly the "hero animation hilang" bug
// the production deploy at https://bawabawa-id.vercel.app/ exhibited.
//
// CSS keyframes in `globals.css` (`animate-hero-rise*`, `animate-hero-pop`)
// run on first paint without needing any JS, so the entrance animation is
// resilient to hydration failures and the copy is visible even with JS
// disabled. Inline `animationDelay` preserves the staggered reveal that the
// original framer-motion timeline aimed for.
export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <AmbientOrbs />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-14 pb-20 lg:pt-20 lg:pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6">
            <div className="animate-hero-rise inline-flex items-center gap-2 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--surface)/0.8)] backdrop-blur px-3 py-1 text-xs font-medium text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-200))]">
              <Sparkles className="h-3.5 w-3.5" />
              Layanan jasa titip Bandung → Samarinda · resmi & terpercaya
            </div>
            <h1
              className="animate-hero-rise-lg mt-5 text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-[-0.03em] leading-[1.05]"
              style={{ animationDelay: "0.05s" }}
            >
              Titip barang dari{" "}
              <span className="relative inline-block">
                <span className="bg-linear-to-br from-[hsl(var(--sage-700))] via-[hsl(var(--olive-500))] to-[hsl(var(--emerald-600))] bg-clip-text text-transparent">
                  Bandung
                </span>
                <span className="absolute -bottom-1 left-0 right-0 h-1.5 bg-[hsl(var(--emerald-400)/0.35)] -z-10 rounded-full" />
              </span>{" "}
              ke Samarinda <span className="text-[hsl(var(--muted-foreground))]">tanpa ribet.</span>
            </h1>
            <p
              className="animate-hero-rise mt-5 max-w-xl text-base sm:text-lg text-[hsl(var(--muted-foreground))] leading-relaxed"
              style={{ animationDelay: "0.15s" }}
            >
              Personal shopper terverifikasi membelikan barang di Bandung —
              dari Pasar Baru, Trans Studio Mall, hingga toko favorit kamu — lalu
              dikirim aman sampai depan rumah di Samarinda. Cepat, transparan, dan terpercaya.
            </p>

            <div
              className="animate-hero-rise mt-8 flex flex-col sm:flex-row gap-3"
              style={{ animationDelay: "0.25s" }}
            >
              <Button asChild size="lg" variant="primary">
                <Link href="/request">
                  Titip Sekarang
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/open-trip">Lihat Open Trip</Link>
              </Button>
            </div>

            <div
              className="animate-hero-rise mt-8 flex items-center gap-6 text-sm text-[hsl(var(--muted-foreground))]"
              style={{ animationDelay: "0.4s" }}
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[hsl(var(--emerald-500))]" />
                Garansi barang aman
              </div>
              <div className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-[hsl(var(--sage-600))]" />
                <span>Soft launch — early customer welcome</span>
              </div>
            </div>
          </div>

          <div
            className="animate-hero-pop lg:col-span-6"
            style={{ animationDelay: "0.2s" }}
          >
            <HeroVisual />
          </div>
        </div>

        <LiveStats />
      </div>
    </section>
  );
}
