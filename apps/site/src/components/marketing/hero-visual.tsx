"use client";

import { motion } from "framer-motion";
import { Package, MapPin, Plane, ShoppingBag, Sparkles } from "lucide-react";

export function HeroVisual() {
  return (
    <div className="relative w-full aspect-[5/4] sm:aspect-[5/3.6] lg:aspect-[5/4.6]">
      {/* Background gradient blob */}
      <div className="absolute inset-0 -z-10 rounded-[2.5rem] overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-[hsl(var(--sage-100))] via-[hsl(var(--sage-200)/0.7)] to-[hsl(var(--emerald-400)/0.18)] dark:from-[hsl(var(--sage-700)/0.35)] dark:via-[hsl(var(--sage-800)/0.45)] dark:to-[hsl(var(--emerald-600)/0.2)]" />
        <div className="absolute -top-12 -left-12 h-64 w-64 rounded-full bg-[hsl(var(--sage-300)/0.6)] blur-3xl" />
        <div className="absolute -bottom-16 -right-12 h-72 w-72 rounded-full bg-[hsl(var(--emerald-400)/0.35)] blur-3xl" />
        <svg className="absolute inset-0 w-full h-full opacity-[0.07] mix-blend-multiply dark:opacity-[0.12]" viewBox="0 0 400 320" preserveAspectRatio="xMidYMid slice" aria-hidden>
          <defs>
            <pattern id="dots" x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="400" height="320" fill="url(#dots)" />
        </svg>
        {/* Bandung skyline silhouette */}
        <svg className="absolute inset-x-0 bottom-0 w-full h-1/2 text-[hsl(var(--sage-700)/0.85)] dark:text-[hsl(var(--sage-900)/0.95)]" viewBox="0 0 800 200" preserveAspectRatio="none" aria-hidden>
          <path
            fill="currentColor"
            d="M0 150 L40 150 L40 110 L70 110 L70 130 L110 130 L110 90 L150 90 L150 120 L190 120 L190 70 L230 70 L230 110 L260 110 L260 130 L300 130 L300 80 L340 80 L340 60 L380 60 L380 100 L420 100 L420 70 L450 70 L450 95 L490 95 L490 75 L520 75 L520 110 L560 110 L560 90 L600 90 L600 120 L640 120 L640 95 L680 95 L680 130 L720 130 L720 105 L760 105 L760 140 L800 140 L800 200 L0 200 Z"
          />
          {/* Mountains */}
          <path
            opacity="0.5"
            fill="currentColor"
            d="M0 170 L120 100 L220 145 L320 90 L420 130 L540 80 L660 130 L780 85 L800 95 L800 200 L0 200 Z"
          />
          {/* Foreground hills */}
          <path opacity="0.85" fill="currentColor" d="M0 190 Q200 160 400 185 T800 180 L800 200 L0 200 Z" />
        </svg>

        {/* Subtle scan line */}
        <motion.div
          aria-hidden
          initial={{ y: "-30%" }}
          animate={{ y: "130%" }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute inset-x-0 h-32 bg-linear-to-b from-transparent via-white/12 to-transparent"
        />
      </div>

      {/* Plane */}
      <motion.div
        initial={{ x: -40, y: 30, opacity: 0 }}
        animate={{ x: 0, y: 0, opacity: 1 }}
        transition={{ duration: 1, delay: 0.4 }}
        className="absolute top-6 left-6 sm:top-10 sm:left-10"
      >
        <div className="glass rounded-2xl px-3 py-2 flex items-center gap-2 text-xs font-medium">
          <Plane className="h-4 w-4 text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-200))]" />
          BDG → SMD · Hari ini 09:30
        </div>
      </motion.div>

      {/* Personal shopper card */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="absolute top-1/2 -translate-y-1/2 right-4 sm:right-8 w-[58%] sm:w-[60%] lg:w-[58%] glass-strong rounded-3xl p-4 sm:p-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-linear-to-br from-[hsl(var(--sage-300))] to-[hsl(var(--sage-700))] grid place-items-center text-white text-sm font-semibold">
              RM
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">Rani Maharani</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Personal Shopper · Bandung</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--emerald-500)/0.15)] text-[hsl(var(--emerald-600))] dark:text-[hsl(var(--emerald-400))] px-2.5 py-1 text-[11px] font-medium">
            <span className="relative inline-flex h-1.5 w-1.5">
              <span className="absolute inset-0 rounded-full bg-[hsl(var(--emerald-500))] opacity-75 animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[hsl(var(--emerald-500))]" />
            </span>
            Live belanja
          </span>
        </div>

        <div className="mt-4 rounded-2xl bg-[hsl(var(--surface-2))] p-3 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[hsl(var(--sage-100))] dark:bg-[hsl(var(--sage-700)/0.4)] grid place-items-center">
            <ShoppingBag className="h-5 w-5 text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-200))]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Sedang membeli</p>
            <p className="text-sm font-medium truncate">Sepatu Compass · 2 item</p>
          </div>
          <span className="text-xs font-semibold text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-200))]">Rp 540rb</span>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <Step icon={ShoppingBag} label="Belanja" active />
          <Step icon={Package} label="Packing" />
          <Step icon={Plane} label="Kirim" />
        </div>
      </motion.div>

      {/* Floating package */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.7 }}
        className="absolute bottom-6 left-4 sm:bottom-10 sm:left-10 glass rounded-2xl px-4 py-3 flex items-center gap-3 animate-float"
      >
        <div className="h-9 w-9 rounded-xl bg-[hsl(var(--emerald-500)/0.15)] grid place-items-center">
          <MapPin className="h-4 w-4 text-[hsl(var(--emerald-600))]" />
        </div>
        <div>
          <p className="text-[11px] text-[hsl(var(--muted-foreground))]">Tiba di Samarinda</p>
          <p className="text-sm font-semibold">3 hari · Door-to-door</p>
        </div>
      </motion.div>

      {/* Sparkle accent */}
      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.9, duration: 0.6 }}
        className="absolute -top-1 right-1/3 hidden sm:block"
      >
        <div className="rounded-full bg-[hsl(var(--surface))] border border-[hsl(var(--border))] p-2 shadow-md">
          <Sparkles className="h-4 w-4 text-[hsl(var(--sage-600))]" />
        </div>
      </motion.div>
    </div>
  );
}

function Step({ icon: Icon, label, active }: { icon: React.ElementType; label: string; active?: boolean }) {
  return (
    <div
      className={
        "flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-[11px] " +
        (active
          ? "bg-[hsl(var(--sage-700))] text-[hsl(var(--primary-foreground))]"
          : "bg-[hsl(var(--surface))] text-[hsl(var(--muted-foreground))] border border-[hsl(var(--border))]")
      }
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="truncate">{label}</span>
    </div>
  );
}
