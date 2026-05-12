"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Plane, MapPin, Package } from "lucide-react";

const ROUTE = {
  // SVG viewBox: 800 x 320. Two anchor points + cubic curve through transit.
  origin: { x: 80, y: 240, label: "Bandung", sub: "Jawa Barat" },
  transit: { x: 400, y: 80 },
  destination: { x: 720, y: 200, label: "Samarinda", sub: "Kalimantan Timur" },
};

const PATH = `M ${ROUTE.origin.x} ${ROUTE.origin.y} Q ${ROUTE.transit.x} ${ROUTE.transit.y} ${ROUTE.destination.x} ${ROUTE.destination.y}`;

export function LiveOrderMap() {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))]">
              Rute resmi
            </p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight">
              Setiap minggu, jadwal trip{" "}
              <span className="bg-linear-to-br from-[hsl(var(--sage-700))] via-[hsl(var(--olive-500))] to-[hsl(var(--emerald-600))] bg-clip-text text-transparent">
                Bandung → Samarinda
              </span>
            </h2>
            <p className="mt-4 text-[hsl(var(--muted-foreground))] leading-relaxed">
              Personal shopper berangkat 2–3 kali seminggu dari Bandung, transit di
              Jakarta atau Surabaya, lalu sampai Samarinda dalam 3–4 hari kerja.
              Tracking realtime tersedia di dashboard.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-3 py-1.5 text-xs font-medium">
                2–3x trip / minggu
              </span>
              <span className="rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-3 py-1.5 text-xs font-medium">
                3–4 hari kerja
              </span>
              <span className="rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-3 py-1.5 text-xs font-medium">
                Door-to-door
              </span>
            </div>
          </div>

          <div className="lg:col-span-7" ref={ref}>
            <div className="rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--surface)/0.7)] backdrop-blur-md p-4 sm:p-6 relative overflow-hidden">
              <svg
                viewBox="0 0 800 320"
                className="w-full h-auto"
                role="img"
                aria-label="Peta rute Bandung ke Samarinda"
              >
                {/* dotted base path */}
                <path
                  id="routePath"
                  d={PATH}
                  fill="none"
                  stroke="hsl(var(--border))"
                  strokeWidth="2"
                  strokeDasharray="6 8"
                />
                {/* animated gradient stroke */}
                <motion.path
                  d={PATH}
                  fill="none"
                  stroke="url(#routeGrad)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={inView ? { pathLength: 1 } : { pathLength: 0 }}
                  transition={{ duration: 2.2, ease: "easeInOut" }}
                />
                {/* origin pin */}
                <motion.g
                  initial={{ scale: 0, opacity: 0 }}
                  animate={inView ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                >
                  <circle
                    cx={ROUTE.origin.x}
                    cy={ROUTE.origin.y}
                    r="12"
                    fill="hsl(var(--sage-700))"
                  />
                  <circle
                    cx={ROUTE.origin.x}
                    cy={ROUTE.origin.y}
                    r="6"
                    fill="white"
                  />
                </motion.g>
                {/* destination pin */}
                <motion.g
                  initial={{ scale: 0, opacity: 0 }}
                  animate={inView ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
                  transition={{ delay: 2.0, type: "spring", stiffness: 200 }}
                >
                  <circle
                    cx={ROUTE.destination.x}
                    cy={ROUTE.destination.y}
                    r="12"
                    fill="hsl(var(--emerald-600))"
                  />
                  <circle
                    cx={ROUTE.destination.x}
                    cy={ROUTE.destination.y}
                    r="6"
                    fill="white"
                  />
                </motion.g>
                {/* moving package — uses SVG <animateMotion> for path tracing */}
                {inView && (
                  <g aria-hidden>
                    <circle
                      r="14"
                      fill="white"
                      stroke="hsl(var(--sage-600))"
                      strokeWidth="2"
                    >
                      <animateMotion
                        dur="4s"
                        repeatCount="indefinite"
                        keyTimes="0;1"
                        rotate="auto"
                      >
                        <mpath xlinkHref="#routePath" />
                      </animateMotion>
                    </circle>
                    <foreignObject x="-9" y="-9" width="18" height="18">
                      <div className="text-[hsl(var(--sage-700))]">
                        <Package className="h-[18px] w-[18px]" />
                      </div>
                      <animateMotion
                        dur="4s"
                        repeatCount="indefinite"
                        keyTimes="0;1"
                      >
                        <mpath xlinkHref="#routePath" />
                      </animateMotion>
                    </foreignObject>
                  </g>
                )}
                <defs>
                  <linearGradient id="routeGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="hsl(var(--sage-700))" />
                    <stop offset="50%" stopColor="hsl(var(--olive-500))" />
                    <stop offset="100%" stopColor="hsl(var(--emerald-600))" />
                  </linearGradient>
                </defs>
              </svg>

              <div className="mt-4 flex justify-between text-sm">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-[hsl(var(--sage-700))] mt-0.5" />
                  <div>
                    <p className="font-semibold">{ROUTE.origin.label}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      {ROUTE.origin.sub}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))]">
                  <Plane className="h-3.5 w-3.5" />
                  ~ 3–4 hari kerja
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-[hsl(var(--emerald-600))] mt-0.5" />
                  <div className="text-right">
                    <p className="font-semibold">{ROUTE.destination.label}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      {ROUTE.destination.sub}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
