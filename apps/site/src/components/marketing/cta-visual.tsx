import Image from "next/image";
import { Plane, Package, Star, MapPin } from "lucide-react";

// Indonesia map rendered from the 3D archipelago asset provided by the
// product team (apps/site/public/images/peta-indonesia*.png — top-down
// Blender ortho render of the FBX in sage-100 on transparent). Pin
// coordinates are normalized to the cropped image's bounding box so
// they land exactly on Bandung (West Java) and Samarinda (East
// Kalimantan); their absolute pixel coords inside a 1862×682 viewBox
// are derived from real lat/lng mapped onto the asset's X / Z axes.
const MAP_W = 1862;
const MAP_H = 682;
const BANDUNG = { x: 511, y: 517 };   // 0.2745 × 1862, 0.7588 × 682
const SAMARINDA = { x: 897, y: 261 }; // 0.4816 × 1862, 0.3829 × 682

// CtaVisual renders the FinalCTA illustration: an SSR-safe Indonesian
// archipelago (no framer-motion on the critical path) with the Bandung →
// Samarinda flight route overlaid on the rendered map. Every animation
// uses the `animate-hero-*` CSS keyframes defined in globals.css so the
// artwork appears on first paint even if the JS bundle hasn't hydrated.
export function CtaVisual() {
  return (
    <div className="relative w-full aspect-[5/4.2] sm:aspect-[5/4] lg:aspect-[5/4.4]">
      {/* Glass surface holding the map */}
      <div className="absolute inset-0 rounded-[2rem] overflow-hidden bg-white/[0.06] border border-white/15 backdrop-blur-sm">
        {/* Dot grid texture */}
        <svg
          className="absolute inset-0 w-full h-full text-white/30"
          viewBox="0 0 400 320"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden
        >
          <defs>
            <pattern id="cta-dots" x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="400" height="320" fill="url(#cta-dots)" />
        </svg>

        {/* The map + route + pins all share this aspect-ratio wrapper so
            their coordinate systems stay aligned at any container size. */}
        <div className="absolute inset-x-4 sm:inset-x-6 top-1/2 -translate-y-1/2">
          <div className="relative w-full" style={{ aspectRatio: `${MAP_W} / ${MAP_H}` }}>
            <Image
              src="/images/peta-indonesia.png"
              alt="Peta Indonesia"
              fill
              sizes="(min-width: 1024px) 540px, (min-width: 640px) 480px, 360px"
              className="object-contain opacity-95 select-none"
              priority
            />

            {/* Route overlay — same viewBox as the rendered PNG so the
                path lines up pixel-perfectly with the pins below. */}
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox={`0 0 ${MAP_W} ${MAP_H}`}
              preserveAspectRatio="xMidYMid meet"
              aria-hidden
            >
              <defs>
                <linearGradient id="cta-route" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(var(--emerald-400))" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="hsl(var(--olive-300))" stopOpacity="0.95" />
                </linearGradient>
                <radialGradient id="cta-pin-bandung" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="hsl(var(--emerald-400))" stopOpacity="0.55" />
                  <stop offset="100%" stopColor="hsl(var(--emerald-400))" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="cta-pin-samarinda" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="hsl(var(--olive-300))" stopOpacity="0.55" />
                  <stop offset="100%" stopColor="hsl(var(--olive-300))" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Dashed flight route Bandung → Samarinda, arcing north
                  so the curve traces over Borneo rather than slicing
                  diagonally across Java. */}
              <path
                d={`M${BANDUNG.x} ${BANDUNG.y} C ${BANDUNG.x + 180} ${BANDUNG.y - 80}, ${SAMARINDA.x - 160} ${SAMARINDA.y - 40}, ${SAMARINDA.x} ${SAMARINDA.y}`}
                fill="none"
                stroke="url(#cta-route)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray="6 22"
              />

              {/* Pin halos */}
              <circle cx={BANDUNG.x} cy={BANDUNG.y} r="60" fill="url(#cta-pin-bandung)" />
              <circle cx={SAMARINDA.x} cy={SAMARINDA.y} r="60" fill="url(#cta-pin-samarinda)" />

              {/* Bandung pin (origin) */}
              <g>
                <circle cx={BANDUNG.x} cy={BANDUNG.y} r="22" fill="hsl(var(--emerald-400) / 0.25)" />
                <circle cx={BANDUNG.x} cy={BANDUNG.y} r="12" fill="hsl(var(--emerald-400))" stroke="white" strokeWidth="2.5" />
                <circle cx={BANDUNG.x} cy={BANDUNG.y} r="4" fill="white" />
              </g>

              {/* Samarinda pin (destination) */}
              <g>
                <circle cx={SAMARINDA.x} cy={SAMARINDA.y} r="22" fill="hsl(var(--olive-300) / 0.3)" />
                <circle cx={SAMARINDA.x} cy={SAMARINDA.y} r="12" fill="hsl(var(--olive-300))" stroke="white" strokeWidth="2.5" />
                <circle cx={SAMARINDA.x} cy={SAMARINDA.y} r="4" fill="white" />
              </g>
            </svg>

            {/* City labels — positioned in % of the map element so they
                track the same coordinate space as the pins. */}
            <div
              className="absolute -translate-x-1/2 mt-2 text-[10px] sm:text-xs font-semibold tracking-wide text-white/95 whitespace-nowrap"
              style={{ left: `${(BANDUNG.x / MAP_W) * 100}%`, top: `${(BANDUNG.y / MAP_H) * 100}%` }}
            >
              BDG · Bandung
            </div>
            <div
              className="absolute -translate-x-1/2 -translate-y-[140%] text-[10px] sm:text-xs font-semibold tracking-wide text-white/95 whitespace-nowrap"
              style={{ left: `${(SAMARINDA.x / MAP_W) * 100}%`, top: `${(SAMARINDA.y / MAP_H) * 100}%` }}
            >
              SMD · Samarinda
            </div>

            {/* Plane drifting along the route midpoint */}
            <div
              className="animate-hero-slide-in-left absolute -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${((BANDUNG.x + SAMARINDA.x) / 2 / MAP_W) * 100}%`,
                top: `${((BANDUNG.y + SAMARINDA.y) / 2 / MAP_H) * 100 - 6}%`,
                animationDelay: "0.3s",
              }}
            >
              <div className="glass rounded-full p-2 shadow-lg animate-float">
                <Plane className="h-4 w-4 -rotate-[20deg] text-[hsl(var(--emerald-400))]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live order card — top-left */}
      <div
        className="animate-hero-rise absolute -top-3 left-3 sm:left-6 sm:-top-4"
        style={{ animationDelay: "0.45s" }}
      >
        <div className="glass-strong rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 flex items-center gap-3 shadow-xl">
          <div className="h-9 w-9 rounded-xl bg-[hsl(var(--emerald-500)/0.18)] grid place-items-center">
            <Package className="h-4 w-4 text-[hsl(var(--emerald-400))]" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-white/55 leading-none">Sedang ditangani</p>
            <p className="text-sm font-semibold text-white leading-tight mt-0.5">Order #1284 · Sepatu Compass</p>
          </div>
        </div>
      </div>

      {/* Rating chip — bottom-right */}
      <div
        className="animate-hero-rise absolute -bottom-3 right-3 sm:right-6 sm:-bottom-4"
        style={{ animationDelay: "0.6s" }}
      >
        <div className="glass-strong rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 flex items-center gap-3 shadow-xl">
          <div className="h-9 w-9 rounded-xl bg-[hsl(var(--olive-300)/0.22)] grid place-items-center">
            <Star className="h-4 w-4 text-[hsl(var(--olive-300))] fill-[hsl(var(--olive-300))]" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-white/55 leading-none">Rating customer</p>
            <p className="text-sm font-semibold text-white leading-tight mt-0.5">4.9 / 5 · 1.200+ ulasan</p>
          </div>
        </div>
      </div>

      {/* ETA pill — center-right */}
      <div
        className="animate-hero-pop absolute right-2 sm:right-4 top-1/2 -translate-y-1/2"
        style={{ animationDelay: "0.75s" }}
      >
        <div className="glass rounded-2xl px-3 py-2 flex items-center gap-2 shadow-lg">
          <MapPin className="h-3.5 w-3.5 text-[hsl(var(--emerald-400))]" />
          <span className="text-[11px] font-semibold text-white">ETA 3 hari</span>
        </div>
      </div>
    </div>
  );
}
