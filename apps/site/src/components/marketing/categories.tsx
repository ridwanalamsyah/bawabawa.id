"use client";

import { motion } from "framer-motion";
import { Shirt, Sparkles, Coffee, Footprints, Briefcase, Scissors, Cookie, Smartphone } from "lucide-react";

const CATS = [
  { icon: Shirt, label: "Fashion", count: "1.8k titipan", tone: "from-[hsl(var(--sage-300))] to-[hsl(var(--sage-600))]" },
  { icon: Sparkles, label: "Skincare", count: "920 titipan", tone: "from-[hsl(var(--olive-300))] to-[hsl(var(--olive-700))]" },
  { icon: Cookie, label: "Snack Bandung", count: "1.4k titipan", tone: "from-[hsl(var(--emerald-400))] to-[hsl(var(--sage-700))]" },
  { icon: Footprints, label: "Sepatu Brand", count: "640 titipan", tone: "from-[hsl(var(--sage-500))] to-[hsl(var(--olive-700))]" },
  { icon: Briefcase, label: "Tas", count: "412 titipan", tone: "from-[hsl(var(--sage-400))] to-[hsl(var(--emerald-500))]" },
  { icon: Scissors, label: "Hijab", count: "780 titipan", tone: "from-[hsl(var(--olive-300))] to-[hsl(var(--sage-700))]" },
  { icon: Coffee, label: "Kopi & Pangan", count: "320 titipan", tone: "from-[hsl(var(--sage-300))] to-[hsl(var(--olive-500))]" },
  { icon: Smartphone, label: "Aksesoris", count: "210 titipan", tone: "from-[hsl(var(--emerald-400))] to-[hsl(var(--sage-600))]" },
];

export function Categories() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))]">
              Kategori populer
            </p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight">
              Apa yang lagi sering dititip dari Bandung?
            </h2>
          </div>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Update otomatis dari sistem ERP Bawabawa setiap minggu.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {CATS.map((c, i) => (
            <motion.button
              key={c.label}
              initial={{ y: 18, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: i * 0.04 }}
              className="group relative overflow-hidden rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--surface)/0.85)] backdrop-blur p-5 text-left hover:border-[hsl(var(--sage-400))] transition-all"
            >
              <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-25 blur-2xl bg-gradient-to-br ${c.tone} transition-opacity group-hover:opacity-40`} />
              <div className={`relative h-10 w-10 rounded-2xl grid place-items-center text-white bg-gradient-to-br ${c.tone}`}>
                <c.icon className="h-5 w-5" />
              </div>
              <p className="mt-4 font-semibold">{c.label}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">{c.count}</p>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}
