"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio } from "lucide-react";

type Activity = {
  id: string;
  text: string;
  status?: string;
  at: string; // ISO timestamp from API
};

type Feed = { items: Activity[]; source: "erp" | "fallback" };

function timeAgo(iso: string): string {
  if (!iso) return "baru saja";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "baru saja";
  const diff = Math.max(0, Date.now() - then);
  const s = Math.floor(diff / 1000);
  if (s < 30) return "baru saja";
  if (s < 60) return `${s}s lalu`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}j lalu`;
  const d = Math.floor(h / 24);
  return `${d}h lalu`;
}

export function LiveFeed() {
  const [feed, setFeed] = useState<Feed | null>(null);
  const [cursor, setCursor] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/analytics/activity", { cache: "no-store" });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data = (await res.json()) as Feed;
        if (!cancelled) setFeed(data);
      } catch {
        if (!cancelled) setFeed({ items: [], source: "fallback" });
      }
    };
    void load();
    const reload = setInterval(() => void load(), 30_000);
    return () => {
      cancelled = true;
      clearInterval(reload);
    };
  }, []);

  // Cycle through the available items so users see motion when there are 2+
  // activity records.
  useEffect(() => {
    if (!feed?.items.length) return;
    const t = setInterval(() => {
      setCursor((c) => (c + 1) % feed.items.length);
    }, 3500);
    return () => clearInterval(t);
  }, [feed?.items.length]);

  const items = feed?.items ?? [];
  const current = items[cursor];
  const isEmpty = feed !== null && items.length === 0;

  return (
    <section className="pb-12 sm:pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--surface)/0.7)] backdrop-blur-md p-5 sm:p-6 flex items-start gap-5">
          <div className="hidden sm:flex h-10 w-10 rounded-2xl bg-[hsl(var(--sage-100))] dark:bg-[hsl(var(--sage-700)/0.4)] items-center justify-center text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-200))] shrink-0">
            <Radio className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))]">
              Live activity
            </p>
            <div className="mt-2 relative h-7 overflow-hidden">
              {feed === null && (
                <p className="absolute inset-0 text-sm sm:text-base text-[hsl(var(--muted-foreground))]">
                  Memuat aktivitas dari ERP…
                </p>
              )}
              {isEmpty && (
                <p className="absolute inset-0 text-sm sm:text-base text-[hsl(var(--muted-foreground))]">
                  Belum ada aktivitas — jadilah customer pertama kami.
                </p>
              )}
              {current && (
                <AnimatePresence initial={false}>
                  <motion.p
                    key={current.id}
                    initial={{ y: 28, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -28, opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 text-sm sm:text-base font-medium truncate"
                  >
                    {current.text}{" "}
                    <span className="text-[hsl(var(--muted-foreground))] font-normal">
                      · {timeAgo(current.at)}
                    </span>
                  </motion.p>
                </AnimatePresence>
              )}
            </div>
          </div>
          <div className="hidden md:flex flex-col items-end gap-2 text-xs text-[hsl(var(--muted-foreground))]">
            <span className="inline-flex items-center gap-1.5">
              <span className="relative inline-flex h-2 w-2">
                <span className="absolute inset-0 rounded-full bg-[hsl(var(--emerald-500))] opacity-75 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[hsl(var(--emerald-500))]" />
              </span>
              <span className="font-medium text-[hsl(var(--emerald-600))] dark:text-[hsl(var(--emerald-400))]">
                {items.length} aktivitas terbaru
              </span>
            </span>
            <span>Disinkron dari ERP setiap 30s</span>
          </div>
        </div>
      </div>
    </section>
  );
}
