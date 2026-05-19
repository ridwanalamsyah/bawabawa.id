import { Plane, Package, MapPin, Star } from "lucide-react";

// CtaVisual renders an SSR-safe illustration for the final CTA section.
// Like HeroVisual, every entrance/loop animation is implemented with the
// `animate-hero-*` CSS keyframes in globals.css so the artwork appears on
// first paint even when framer-motion or the JS bundle hasn't hydrated.
// The composition mirrors the marketing message — a route from Bandung to
// Samarinda, a tracked package, and social-proof badges.
export function CtaVisual() {
  return (
    <div className="relative w-full aspect-[5/4.2] sm:aspect-[5/4] lg:aspect-[5/4.4]">
      {/* Map / route artwork */}
      <div className="absolute inset-0 rounded-[2rem] overflow-hidden bg-white/[0.06] border border-white/15 backdrop-blur-sm">
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 400 320"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden
        >
          <defs>
            <pattern id="cta-dots" x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="currentColor" />
            </pattern>
            <linearGradient id="cta-route" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--emerald-400))" stopOpacity="0.95" />
              <stop offset="100%" stopColor="hsl(var(--olive-300))" stopOpacity="0.95" />
            </linearGradient>
          </defs>
          {/* Subtle dot grid texture */}
          <rect width="400" height="320" fill="url(#cta-dots)" className="text-white/40" />

          {/* Stylised archipelago — abstract land masses suggesting Java + Borneo */}
          <g className="text-white/15" fill="currentColor">
            {/* Java (Bandung region) */}
            <path d="M30 220 Q60 195 110 205 Q150 200 175 215 Q190 230 165 245 Q120 255 80 250 Q45 245 30 235 Z" />
            {/* Borneo (Samarinda region) */}
            <path d="M250 75 Q295 60 340 75 Q370 95 365 130 Q355 165 320 175 Q280 180 255 160 Q235 130 240 105 Q243 90 250 75 Z" />
          </g>

          {/* Dashed flight route Bandung → Samarinda */}
          <path
            d="M95 230 C 160 150, 230 100, 305 110"
            fill="none"
            stroke="url(#cta-route)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="2 7"
          />

          {/* Origin pin — Bandung */}
          <g transform="translate(95 230)">
            <circle r="14" fill="hsl(var(--emerald-400)/0.18)" />
            <circle r="6" fill="hsl(var(--emerald-400))" />
            <circle r="2" fill="white" />
          </g>

          {/* Destination pin — Samarinda */}
          <g transform="translate(305 110)">
            <circle r="14" fill="hsl(var(--olive-300)/0.22)" />
            <circle r="6" fill="hsl(var(--olive-300))" />
            <circle r="2" fill="white" />
          </g>
        </svg>

        {/* City labels overlaid on the route */}
        <div className="absolute left-[18%] bottom-[22%] -translate-x-1/2 text-[10px] sm:text-xs font-semibold tracking-wide text-white/85">
          BDG
          <span className="block text-[9px] sm:text-[10px] font-normal text-white/55">Bandung</span>
        </div>
        <div className="absolute left-[74%] top-[26%] -translate-x-1/2 text-[10px] sm:text-xs font-semibold tracking-wide text-white/85">
          SMD
          <span className="block text-[9px] sm:text-[10px] font-normal text-white/55">Samarinda</span>
        </div>

        {/* Plane drifting along the route */}
        <div
          className="animate-hero-slide-in-left absolute left-[36%] top-[40%]"
          style={{ animationDelay: "0.3s" }}
        >
          <div className="glass rounded-full p-2 shadow-lg animate-float">
            <Plane className="h-4 w-4 text-[hsl(var(--emerald-400))]" />
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
