"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { TrendingUp, Users, PackageCheck, Activity, Sparkles } from "lucide-react";
import { GlassCard } from "@/components/ui/card";
import { formatIDR, formatNumber } from "@/lib/utils";

type Summary = {
  revenueMonth: number;
  activeOrders: number;
  activeCustomers: number;
  totalOrdersAllTime: number;
  softLaunch: boolean;
  source: "erp" | "fallback";
};

const SOFT_LAUNCH_FALLBACK: Summary = {
  revenueMonth: 0,
  activeOrders: 0,
  activeCustomers: 0,
  totalOrdersAllTime: 0,
  softLaunch: true,
  source: "fallback",
};

type Stat = {
  icon: React.ElementType;
  label: string;
  value: number;
  format?: "idr" | "number";
  tone: string;
};

function buildStats(s: Summary): Stat[] {
  return [
    {
      icon: TrendingUp,
      label: "Total transaksi (bulan ini)",
      value: s.revenueMonth,
      format: "idr",
      tone: "from-[hsl(var(--sage-500))] to-[hsl(var(--emerald-500))]",
    },
    {
      icon: Users,
      label: "Customer terdaftar",
      value: s.activeCustomers,
      format: "number",
      tone: "from-[hsl(var(--olive-500))] to-[hsl(var(--sage-700))]",
    },
    {
      icon: PackageCheck,
      label: "Pesanan tercatat",
      value: s.totalOrdersAllTime,
      format: "number",
      tone: "from-[hsl(var(--emerald-500))] to-[hsl(var(--sage-600))]",
    },
    {
      icon: Activity,
      label: "Pesanan aktif",
      value: s.activeOrders,
      format: "number",
      tone: "from-[hsl(var(--sage-700))] to-[hsl(var(--olive-500))]",
    },
  ];
}

export function LiveStats() {
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/analytics/overview", { cache: "no-store" });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data = (await res.json()) as Summary;
        if (!cancelled) setSummary(data);
      } catch {
        if (!cancelled) setSummary(SOFT_LAUNCH_FALLBACK);
      }
    };
    void load();
    // Light polling — counters reflect new activity within a minute without
    // hammering the API.
    const t = setInterval(() => void load(), 60_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  const data = summary ?? SOFT_LAUNCH_FALLBACK;
  const stats = buildStats(data);
  const isEmpty =
    data.totalOrdersAllTime === 0 &&
    data.activeCustomers === 0 &&
    data.revenueMonth === 0;

  return (
    <div className="mt-14 sm:mt-20">
      {isEmpty && (
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--surface)/0.8)] backdrop-blur px-3 py-1 text-xs text-[hsl(var(--muted-foreground))]">
          <Sparkles className="h-3.5 w-3.5 text-[hsl(var(--sage-600))]" />
          Soft launch — angka di bawah ini akan terisi otomatis setelah ada pesanan masuk.
        </div>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
          >
            <StatCard {...s} loading={summary === null} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

type StatCardProps = Stat & { loading?: boolean };

function StatCard({ icon: Icon, label, value, format, tone, loading }: StatCardProps) {
  const formatted =
    format === "idr" ? formatIDR(value) : formatNumber(value);

  return (
    <GlassCard className="p-4 sm:p-5 relative overflow-hidden">
      <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-30 blur-2xl bg-linear-to-br ${tone}`} />
      <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
        <span className={`h-7 w-7 rounded-xl grid place-items-center bg-linear-to-br ${tone} text-white`}>
          <Icon className="h-3.5 w-3.5" />
        </span>
        {label}
      </div>
      <p
        className="mt-3 text-2xl sm:text-[1.7rem] font-semibold tracking-tight tabular-nums"
        aria-live="polite"
      >
        {loading ? "—" : formatted}
      </p>
      <div className="mt-2 flex items-center gap-1.5 text-[11px]">
        <span className="relative inline-flex h-1.5 w-1.5">
          <span className="absolute inset-0 rounded-full bg-[hsl(var(--emerald-500))] opacity-75 animate-ping" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[hsl(var(--emerald-500))]" />
        </span>
        <span className="text-[hsl(var(--emerald-600))] dark:text-[hsl(var(--emerald-400))] font-medium">
          Diperbarui realtime
        </span>
      </div>
    </GlassCard>
  );
}
