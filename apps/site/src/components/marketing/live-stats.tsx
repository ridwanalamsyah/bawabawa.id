"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { TrendingUp, Users, PackageCheck, Activity } from "lucide-react";
import { GlassCard } from "@/components/ui/card";
import { formatIDR, formatNumber } from "@/lib/utils";

type Stat = {
  icon: React.ElementType;
  label: string;
  base: number;
  drift: number;
  format?: "idr" | "number" | "rating";
  prefix?: string;
  suffix?: string;
  tone: string;
};

const STATS: Stat[] = [
  { icon: TrendingUp, label: "Total transaksi (bulan ini)", base: 1_842_000_000, drift: 24000, format: "idr", tone: "from-[hsl(var(--sage-500))] to-[hsl(var(--emerald-500))]" },
  { icon: Users, label: "Customer aktif", base: 12483, drift: 1, format: "number", tone: "from-[hsl(var(--olive-500))] to-[hsl(var(--sage-700))]" },
  { icon: PackageCheck, label: "Pesanan berhasil dikirim", base: 27620, drift: 1, format: "number", tone: "from-[hsl(var(--emerald-500))] to-[hsl(var(--sage-600))]" },
  { icon: Activity, label: "Live order saat ini", base: 137, drift: 1, format: "number", tone: "from-[hsl(var(--sage-700))] to-[hsl(var(--olive-500))]" },
];

export function LiveStats() {
  return (
    <div className="mt-14 sm:mt-20 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {STATS.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, delay: i * 0.08 }}
        >
          <StatCard {...s} />
        </motion.div>
      ))}
    </div>
  );
}

function StatCard({ icon: Icon, label, base, drift, format, tone }: Stat) {
  const [val, setVal] = useState(base);
  const lastDir = useRef<1 | -1>(1);
  useEffect(() => {
    const interval = setInterval(() => {
      setVal((v) => {
        const dir = Math.random() > 0.25 ? 1 : -1;
        lastDir.current = dir;
        const change = drift * (1 + Math.floor(Math.random() * 3));
        return Math.max(0, v + dir * change);
      });
    }, 2400 + Math.random() * 1500);
    return () => clearInterval(interval);
  }, [drift]);

  const formatted =
    format === "idr"
      ? formatIDR(val)
      : format === "rating"
      ? val.toFixed(2)
      : formatNumber(val);

  return (
    <GlassCard className="p-4 sm:p-5 relative overflow-hidden">
      <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-30 blur-2xl bg-linear-to-br ${tone}`} />
      <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
        <span className={`h-7 w-7 rounded-xl grid place-items-center bg-linear-to-br ${tone} text-white`}>
          <Icon className="h-3.5 w-3.5" />
        </span>
        {label}
      </div>
      <p className="mt-3 text-2xl sm:text-[1.7rem] font-semibold tracking-tight tabular-nums">
        {formatted}
      </p>
      <div className="mt-2 flex items-center gap-1.5 text-[11px]">
        <span className="relative inline-flex h-1.5 w-1.5">
          <span className="absolute inset-0 rounded-full bg-[hsl(var(--emerald-500))] opacity-75 animate-ping" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[hsl(var(--emerald-500))]" />
        </span>
        <span className="text-[hsl(var(--emerald-600))] dark:text-[hsl(var(--emerald-400))] font-medium">Live update</span>
      </div>
    </GlassCard>
  );
}
