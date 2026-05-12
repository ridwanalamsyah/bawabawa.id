"use client";

import Link from "next/link";
import { ArrowRight, Package } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function StickyMobileCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 320);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 64, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 64, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed bottom-0 inset-x-0 z-30 md:hidden p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
        >
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface)/0.85)] backdrop-blur-xl shadow-[0_-12px_40px_-12px_rgba(0,0,0,0.18)] px-3 py-2.5 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-[hsl(var(--sage-500))] to-[hsl(var(--sage-700))] text-white shrink-0">
              <Package className="h-4 w-4" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium">
                Bandung → Samarinda
              </p>
              <p className="text-sm font-semibold text-[hsl(var(--foreground))] truncate">
                Mulai dari Rp 30.000 / kg
              </p>
            </div>
            <Link
              href="/request"
              className="inline-flex items-center gap-1.5 rounded-xl bg-linear-to-br from-[hsl(var(--sage-600))] to-[hsl(var(--sage-800))] text-white px-3.5 py-2.5 text-sm font-semibold shadow-sm active:scale-[0.98] transition-transform"
            >
              Titip
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
