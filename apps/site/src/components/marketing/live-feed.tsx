"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio } from "lucide-react";
import { liveActivity } from "@/lib/mock/analytics";

export function LiveFeed() {
  const [items, setItems] = useState(liveActivity);
  useEffect(() => {
    const t = setInterval(() => {
      setItems((curr) => {
        const head = curr[curr.length - 1];
        return [head, ...curr.slice(0, -1)];
      });
    }, 3500);
    return () => clearInterval(t);
  }, []);
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
              <AnimatePresence initial={false}>
                <motion.p
                  key={items[0].id}
                  initial={{ y: 28, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -28, opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 text-sm sm:text-base font-medium truncate"
                >
                  {items[0].text} <span className="text-[hsl(var(--muted-foreground))] font-normal">· {items[0].at}</span>
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
          <div className="hidden md:flex flex-col items-end gap-2 text-xs text-[hsl(var(--muted-foreground))]">
            <span className="inline-flex items-center gap-1.5">
              <span className="relative inline-flex h-2 w-2">
                <span className="absolute inset-0 rounded-full bg-[hsl(var(--emerald-500))] opacity-75 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[hsl(var(--emerald-500))]" />
              </span>
              <span className="font-medium text-[hsl(var(--emerald-600))] dark:text-[hsl(var(--emerald-400))]">137 customer online</span>
            </span>
            <span>Streamed via WebSocket · ERP sync ✓</span>
          </div>
        </div>
      </div>
    </section>
  );
}
