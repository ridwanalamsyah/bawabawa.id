import { Plane, Package, Star, MapPin } from "lucide-react";

// CtaVisual renders an SSR-safe illustration of the Indonesian archipelago
// (Sumatera, Jawa, Kalimantan, Sulawesi, Maluku, Papua + Nusa Tenggara)
// with the Bandung → Samarinda flight route — matching the marketing
// copy. Every animation uses the `animate-hero-*` CSS keyframes defined
// in globals.css so the artwork appears on first paint even when the JS
// bundle / framer-motion hasn't hydrated.
export function CtaVisual() {
  return (
    <div className="relative w-full aspect-[5/4.2] sm:aspect-[5/4] lg:aspect-[5/4.4]">
      {/* Glass surface holding the map */}
      <div className="absolute inset-0 rounded-[2rem] overflow-hidden bg-white/[0.06] border border-white/15 backdrop-blur-sm">
        {/* Dot grid texture */}
        <svg
          className="absolute inset-0 w-full h-full text-white/35"
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

        {/* Indonesian archipelago — stylised but anatomically positioned. */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 400 220"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden
        >
          <defs>
            <linearGradient id="cta-route" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--emerald-400))" stopOpacity="0.95" />
              <stop offset="100%" stopColor="hsl(var(--olive-300))" stopOpacity="0.95" />
            </linearGradient>
            <linearGradient id="cta-land" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--sage-100))" stopOpacity="0.95" />
              <stop offset="100%" stopColor="hsl(var(--sage-200))" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          <g
            fill="url(#cta-land)"
            stroke="hsl(var(--sage-300))"
            strokeWidth="0.6"
            strokeOpacity="0.7"
            strokeLinejoin="round"
          >
            {/* Sumatera — long NW→SE diagonal island */}
            <path d="M30 38 L48 30 L66 32 L82 42 L96 56 L106 72 L114 90 L118 108 L112 122 L102 124 L88 116 L74 100 L62 84 L52 68 L42 54 L34 46 Z" />
            {/* Jawa — thin horizontal sliver below Sumatera */}
            <path d="M118 152 L138 148 L160 148 L184 150 L206 152 L220 156 L218 164 L196 164 L172 162 L148 160 L128 158 Z" />
            {/* Madura */}
            <path d="M212 148 L226 146 L236 150 L232 156 L218 154 Z" />
            {/* Bali */}
            <path d="M228 158 L240 156 L246 162 L238 165 L228 163 Z" />
            {/* Lombok + Sumbawa */}
            <path d="M250 158 L262 156 L274 159 L268 165 L254 164 Z" />
            {/* Flores */}
            <path d="M276 158 L296 156 L312 160 L304 166 L284 164 Z" />
            {/* Timor */}
            <path d="M312 168 L328 165 L338 170 L330 174 L316 173 Z" />
            {/* Kalimantan (Borneo) — large rounded mass north of Java */}
            <path d="M168 52 L186 38 L210 30 L236 30 L258 38 L274 52 L282 70 L284 92 L278 112 L268 128 L254 138 L236 142 L218 140 L200 132 L186 120 L176 104 L168 86 L164 70 Z" />
            {/* Sulawesi — K/octopus shape */}
            <path d="M296 52 L304 44 L312 56 L322 50 L330 64 L324 76 L334 84 L336 100 L328 112 L320 122 L312 132 L304 142 L296 134 L300 120 L294 110 L286 100 L290 88 L284 78 L290 68 L286 60 Z" />
            {/* Maluku — small islands */}
            <path d="M346 60 L358 56 L364 64 L356 68 L348 66 Z" />
            <path d="M348 84 L360 82 L366 90 L358 94 L348 90 Z" />
            <path d="M352 108 L362 106 L368 112 L360 116 L350 114 Z" />
            {/* Papua (Indonesian half) */}
            <path d="M348 70 L370 68 L388 74 L398 84 L398 102 L390 118 L378 128 L362 132 L348 128 L340 118 L336 104 L340 88 L344 78 Z" />
          </g>

          {/* Dashed flight route Bandung → Samarinda. */}
          <path
            d="M148 156 C 180 130, 210 95, 248 76"
            fill="none"
            stroke="url(#cta-route)"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeDasharray="2 7"
          />

          {/* Bandung origin pin (West Java) */}
          <g transform="translate(148 156)">
            <circle r="14" fill="hsl(var(--emerald-400)/0.2)" />
            <circle r="6" fill="hsl(var(--emerald-400))" />
            <circle r="2" fill="white" />
          </g>

          {/* Samarinda destination pin (East Kalimantan) */}
          <g transform="translate(248 76)">
            <circle r="14" fill="hsl(var(--olive-300)/0.24)" />
            <circle r="6" fill="hsl(var(--olive-300))" />
            <circle r="2" fill="white" />
          </g>
        </svg>

        {/* City labels — positioned relative to the SVG above. */}
        <div className="absolute left-[37%] top-[71%] -translate-x-1/2 text-[10px] sm:text-xs font-semibold tracking-wide text-white/90 whitespace-nowrap">
          BDG · Bandung
        </div>
        <div className="absolute left-[62%] top-[34%] -translate-x-1/2 text-[10px] sm:text-xs font-semibold tracking-wide text-white/90 whitespace-nowrap">
          SMD · Samarinda
        </div>

        {/* Plane drifting along the route */}
        <div
          className="animate-hero-slide-in-left absolute left-[48%] top-[50%]"
          style={{ animationDelay: "0.3s" }}
        >
          <div className="glass rounded-full p-2 shadow-lg animate-float">
            <Plane className="h-4 w-4 -rotate-45 text-[hsl(var(--emerald-400))]" />
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
