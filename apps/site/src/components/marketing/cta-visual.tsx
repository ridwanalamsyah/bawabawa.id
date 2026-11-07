import Image from "next/image";
import { Package, Truck } from "lucide-react";
import { delay } from "@/lib/motion";

// Indonesia map rendered from the 3D archipelago asset
// (public/images/peta-indonesia*.png, top-down render on transparent).
// Pin coordinates live in the image's 1862×682 pixel space and were derived
// from real lat/lng, so they land on Bandung (West Java) and Samarinda
// (East Kalimantan).
const MAP_W = 1862;
const MAP_H = 682;
const BANDUNG = { x: 511, y: 517 };
const SAMARINDA = { x: 897, y: 261 };

// Flight route, arcing north over the Java Sea toward Borneo.
const ROUTE = `M${BANDUNG.x} ${BANDUNG.y} C ${BANDUNG.x + 180} ${BANDUNG.y - 80}, ${SAMARINDA.x - 160} ${SAMARINDA.y - 40}, ${SAMARINDA.x} ${SAMARINDA.y}`;

// Lucide "plane" glyph (24×24, nose pointing up-right). Rotated +45° so the
// nose points along +x, which is what SMIL rotate="auto" aligns to the path.
const PLANE_PATH =
  "M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z";

function planeMarkup(animate: boolean) {
  const glyph = `<g transform="scale(4.2) rotate(45) translate(-12 -12)"><path d="${PLANE_PATH}" fill="hsl(var(--emerald-400))" stroke="white" stroke-width="1" stroke-linejoin="round"/></g>`;
  const badge = `<circle r="66" fill="rgba(255,255,255,0.16)" stroke="rgba(255,255,255,0.55)" stroke-width="3"/>${glyph}`;
  if (!animate) {
    // Static plane at the middle of the route.
    const mid = { x: (BANDUNG.x + SAMARINDA.x) / 2 + 10, y: (BANDUNG.y + SAMARINDA.y) / 2 - 40 };
    return `<g transform="translate(${mid.x} ${mid.y}) rotate(-35)">${badge}</g>`;
  }
  // SMIL animateMotion: flies Bandung → Samarinda, pauses, repeats. Works in
  // every browser and needs no JS. Rendered as markup because React does
  // not emit SMIL elements.
  const trail = `<path d="${ROUTE}" pathLength="1" fill="none" stroke="hsl(var(--emerald-400))" stroke-width="7" stroke-linecap="round" stroke-dasharray="1 1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" values="1;0;0" keyTimes="0;0.8;1" dur="5s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.9;0.9;0" keyTimes="0;0.8;1" dur="5s" repeatCount="indefinite"/></path>`;
  return `${trail}<g>${badge}<animateMotion dur="5s" repeatCount="indefinite" rotate="auto" keyPoints="0;1;1" keyTimes="0;0.8;1" calcMode="linear" path="${ROUTE}"/></g>`;
}

/**
 * Closing-CTA illustration: the archipelago with the Bandung → Samarinda
 * route. The dashes flow toward Samarinda, both pins pulse and a plane flies
 * the route on a loop. Admin → Pengaturan → Animasi turns the motion off.
 */
export function CtaVisual({ animate = true }: { animate?: boolean }) {
  return (
    <div className="relative w-full aspect-[5/4.2] sm:aspect-[5/4] lg:aspect-[5/4.4]">
      <div className="absolute inset-0 rounded-[2rem] overflow-hidden bg-white/[0.06] border border-white/15 backdrop-blur-sm">
        <svg className="absolute inset-0 w-full h-full text-white/30" viewBox="0 0 400 320" preserveAspectRatio="xMidYMid slice" aria-hidden>
          <defs>
            <pattern id="cta-dots" x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="400" height="320" fill="url(#cta-dots)" />
        </svg>

        <div className="absolute inset-x-4 sm:inset-x-6 top-1/2 -translate-y-1/2">
          <div className="relative w-full" style={{ aspectRatio: `${MAP_W} / ${MAP_H}` }}>
            <Image
              src="/images/peta-indonesia.png"
              alt="Peta Indonesia dengan rute Bandung ke Samarinda"
              fill
              sizes="(min-width: 1024px) 540px, (min-width: 640px) 480px, 360px"
              className="object-contain opacity-95 select-none"
            />

            <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox={`0 0 ${MAP_W} ${MAP_H}`} preserveAspectRatio="xMidYMid meet" aria-hidden>
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

              {/* Faint full route + flowing dashes on top. */}
              <path d={ROUTE} fill="none" stroke="white" strokeOpacity="0.18" strokeWidth="6" strokeLinecap="round" />
              <path
                d={ROUTE}
                fill="none"
                stroke="url(#cta-route)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray="6 22"
                className="animate-dash-flow"
              />

              <circle cx={BANDUNG.x} cy={BANDUNG.y} r="60" fill="url(#cta-pin-bandung)" className="animate-pin-pulse" />
              <circle cx={SAMARINDA.x} cy={SAMARINDA.y} r="60" fill="url(#cta-pin-samarinda)" className="animate-pin-pulse" style={delay(1200)} />

              <g>
                <circle cx={BANDUNG.x} cy={BANDUNG.y} r="22" fill="hsl(var(--emerald-400) / 0.25)" />
                <circle cx={BANDUNG.x} cy={BANDUNG.y} r="12" fill="hsl(var(--emerald-400))" stroke="white" strokeWidth="2.5" />
                <circle cx={BANDUNG.x} cy={BANDUNG.y} r="4" fill="white" />
              </g>
              <g>
                <circle cx={SAMARINDA.x} cy={SAMARINDA.y} r="22" fill="hsl(var(--olive-300) / 0.3)" />
                <circle cx={SAMARINDA.x} cy={SAMARINDA.y} r="12" fill="hsl(var(--olive-300))" stroke="white" strokeWidth="2.5" />
                <circle cx={SAMARINDA.x} cy={SAMARINDA.y} r="4" fill="white" />
              </g>

              <g dangerouslySetInnerHTML={{ __html: planeMarkup(animate) }} />
            </svg>

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
          </div>
        </div>
      </div>

      {/* Example order — top-left */}
      <div className="animate-hero-rise absolute -top-3 left-3 sm:left-6 sm:-top-4" style={{ animationDelay: "0.45s" }}>
        <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md px-3.5 py-2.5 sm:px-4 sm:py-3 flex items-center gap-3 shadow-xl animate-float">
          <div className="h-9 w-9 rounded-xl bg-[hsl(var(--emerald-500)/0.18)] grid place-items-center shrink-0">
            <Package className="h-4 w-4 text-[hsl(var(--emerald-400))]" />
          </div>
          <div className="leading-tight">
            <p className="text-[10px] text-white/60">Contoh pesanan</p>
            <p className="text-sm font-semibold text-white mt-0.5">Sepatu sneakers lokal</p>
            <p className="text-[10.5px] text-white/60 mt-0.5">2 item · dibeli setelah setuju</p>
          </div>
        </div>
      </div>

      {/* Delivery options — bottom-right */}
      <div className="animate-hero-rise absolute -bottom-3 right-3 sm:right-6 sm:-bottom-4" style={{ animationDelay: "0.6s" }}>
        <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md px-3.5 py-2.5 sm:px-4 sm:py-3 flex items-center gap-3 shadow-xl">
          <div className="h-9 w-9 rounded-xl bg-[hsl(var(--olive-300)/0.22)] grid place-items-center shrink-0">
            <Truck className="h-4 w-4 text-[hsl(var(--olive-300))]" />
          </div>
          <div className="leading-tight">
            <p className="text-[10px] text-white/60">Tiba di Samarinda</p>
            <p className="text-sm font-semibold text-white mt-0.5">
              <span className="tabular-nums">3–4 hari kerja</span>
              <span className="text-white/60 font-normal"> · Reguler</span>
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
