"use client";

import { motion } from "framer-motion";
import {
  Package,
  MapPin,
  Plane,
  ShoppingBag,
  Sparkles,
  ShieldCheck,
  Truck,
} from "lucide-react";

/**
 * Hero illustration on the homepage. Pure abstract — no fake shopper names,
 * no invented order amounts, no fake "live" badges. Three layered floating
 * cards each surface ONE real-value-prop:
 *   - top-left:    route badge (Bandung → Samarinda) — factual
 *   - middle:      three-step pipeline (Belanja / Packing / Kirim) — also
 *                  factual; this is literally how the service works
 *   - bottom-left: ETA + door-to-door — also factual
 *
 * Animation:
 *   - Plane chip and bottom-left ETA card use *continuous* float/bobbing
 *     instead of one-shot entrance fades, so the homepage stays visibly
 *     alive after the initial paint instead of going static.
 *   - Background scanline keeps its slow vertical sweep.
 */
export function HeroVisual() {
  return (
    <div className="relative w-full aspect-[5/4] sm:aspect-[5/3.6] lg:aspect-[5/4.6]">
      {/* Background gradient blob */}
      <div className="absolute inset-0 -z-10 rounded-[2.5rem] overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-[hsl(var(--sage-100))] via-[hsl(var(--sage-200)/0.7)] to-[hsl(var(--emerald-400)/0.18)] dark:from-[hsl(var(--sage-700)/0.35)] dark:via-[hsl(var(--sage-800)/0.45)] dark:to-[hsl(var(--emerald-600)/0.2)]" />
        <div className="absolute -top-12 -left-12 h-64 w-64 rounded-full bg-[hsl(var(--sage-300)/0.6)] blur-3xl" />
        <div className="absolute -bottom-16 -right-12 h-72 w-72 rounded-full bg-[hsl(var(--emerald-400)/0.35)] blur-3xl" />
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.07] mix-blend-multiply dark:opacity-[0.12]"
          viewBox="0 0 400 320"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden
        >
          <defs>
            <pattern id="dots" x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="400" height="320" fill="url(#dots)" />
        </svg>
        {/* Bandung skyline silhouette */}
        <svg
          className="absolute inset-x-0 bottom-0 w-full h-1/2 text-[hsl(var(--sage-700)/0.85)] dark:text-[hsl(var(--sage-900)/0.95)]"
          viewBox="0 0 800 200"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            fill="currentColor"
            d="M0 150 L40 150 L40 110 L70 110 L70 130 L110 130 L110 90 L150 90 L150 120 L190 120 L190 70 L230 70 L230 110 L260 110 L260 130 L300 130 L300 80 L340 80 L340 60 L380 60 L380 100 L420 100 L420 70 L450 70 L450 95 L490 95 L490 75 L520 75 L520 110 L560 110 L560 90 L600 90 L600 120 L640 120 L640 95 L680 95 L680 130 L720 130 L720 105 L760 105 L760 140 L800 140 L800 200 L0 200 Z"
          />
          <path
            opacity="0.5"
            fill="currentColor"
            d="M0 170 L120 100 L220 145 L320 90 L420 130 L540 80 L660 130 L780 85 L800 95 L800 200 L0 200 Z"
          />
          <path opacity="0.85" fill="currentColor" d="M0 190 Q200 160 400 185 T800 180 L800 200 L0 200 Z" />
        </svg>

        {/* Continuous diagonal sweep so the section never goes static. */}
        <motion.div
          aria-hidden
          initial={{ y: "-30%" }}
          animate={{ y: "130%" }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute inset-x-0 h-32 bg-linear-to-b from-transparent via-white/12 to-transparent"
        />
      </div>

      {/* Route badge — drifts left/right continuously. */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: [0, -6, 0] }}
        transition={{
          opacity: { duration: 0.6, delay: 0.2 },
          y: { duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.6 },
        }}
        className="absolute top-6 left-6 sm:top-10 sm:left-10"
      >
        <div className="glass rounded-2xl px-3 py-2 flex items-center gap-2 text-xs font-medium">
          <Plane className="h-4 w-4 text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-200))]" />
          Bandung → Samarinda
        </div>
      </motion.div>

      {/* Process pipeline card — neutral, no shopper name. */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="absolute top-1/2 -translate-y-1/2 right-4 sm:right-8 w-[58%] sm:w-[60%] lg:w-[58%] glass-strong rounded-3xl p-4 sm:p-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))]">
              Alur titip
            </p>
            <p className="mt-1 text-sm font-semibold leading-tight">
              Belanja → Packing → Kirim
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--sage-100))] dark:bg-[hsl(var(--sage-700)/0.4)] text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-200))] px-2.5 py-1 text-[11px] font-medium">
            <ShieldCheck className="h-3 w-3" />
            Aman
          </span>
        </div>

        {/* Step pipeline — each step pulses in sequence so the user reads
            them like a progress flow without committing to a fake "live"
            status for any specific order. */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <PulseStep icon={ShoppingBag} label="Belanja" delay={0} />
          <PulseStep icon={Package} label="Packing" delay={1.2} />
          <PulseStep icon={Truck} label="Kirim" delay={2.4} />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-[11px] text-[hsl(var(--muted-foreground))]">
          <Stat label="Reguler" value="3–4 hari" />
          <Stat label="Kargo" value="10 hari" />
          <Stat label="Tujuan" value="Door-to-door" />
        </div>
      </motion.div>

      {/* ETA card — continuous floating */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: [0, -4, 0], opacity: 1 }}
        transition={{
          opacity: { duration: 0.8, delay: 0.5 },
          y: { duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 0.9 },
        }}
        className="absolute bottom-6 left-4 sm:bottom-10 sm:left-10 glass rounded-2xl px-4 py-3 flex items-center gap-3"
      >
        <div className="h-9 w-9 rounded-xl bg-[hsl(var(--emerald-500)/0.15)] grid place-items-center">
          <MapPin className="h-4 w-4 text-[hsl(var(--emerald-600))]" />
        </div>
        <div>
          <p className="text-[11px] text-[hsl(var(--muted-foreground))]">Tiba di Samarinda</p>
          <p className="text-sm font-semibold">Reguler 3–4 hari · Kargo 10 hari</p>
        </div>
      </motion.div>

      {/* Sparkle accent — slow rotation */}
      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1, rotate: 360 }}
        transition={{
          opacity: { delay: 0.9, duration: 0.6 },
          scale: { delay: 0.9, duration: 0.6 },
          rotate: { duration: 18, repeat: Infinity, ease: "linear" },
        }}
        className="absolute -top-1 right-1/3 hidden sm:block"
      >
        <div className="rounded-full bg-[hsl(var(--surface))] border border-[hsl(var(--border))] p-2 shadow-md">
          <Sparkles className="h-4 w-4 text-[hsl(var(--sage-600))]" />
        </div>
      </motion.div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[hsl(var(--surface-2))] px-2.5 py-2">
      <p className="text-[10px] uppercase tracking-wide opacity-80">{label}</p>
      <p className="text-[11px] font-medium text-[hsl(var(--foreground))] truncate">{value}</p>
    </div>
  );
}

function PulseStep({
  icon: Icon,
  label,
  delay,
}: {
  icon: React.ElementType;
  label: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0.55 }}
      animate={{ opacity: [0.55, 1, 0.55] }}
      transition={{
        duration: 3.6,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
      className="flex items-center gap-1.5 rounded-xl bg-[hsl(var(--surface))] border border-[hsl(var(--border))] px-2.5 py-2 text-[11px] text-[hsl(var(--foreground))]"
    >
      <Icon className="h-3.5 w-3.5 text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))]" />
      <span className="truncate">{label}</span>
    </motion.div>
  );
}
