"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STORAGE_KEY = "bb_cookie_consent_v1";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        const t = setTimeout(() => setVisible(true), 1600);
        return () => clearTimeout(t);
      }
    } catch {
      // ignore (SSR / private mode)
    }
  }, []);

  const accept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ at: Date.now(), v: "accept-all" }));
    } catch {
      /* noop */
    }
    setVisible(false);
  };

  const reject = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ at: Date.now(), v: "essential-only" }));
    } catch {
      /* noop */
    }
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 64, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 64, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:max-w-md z-50"
          role="dialog"
          aria-live="polite"
          aria-label="Persetujuan cookie"
        >
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface)/0.95)] backdrop-blur-xl shadow-[0_20px_60px_-20px_rgba(0,0,0,0.25)] p-4 sm:p-5">
            <p className="font-semibold text-[hsl(var(--foreground))] text-sm">
              Kami pakai cookie untuk pengalaman terbaik
            </p>
            <p className="mt-1.5 text-xs sm:text-[13px] text-[hsl(var(--muted-foreground))] leading-relaxed">
              Cookie esensial digunakan untuk login & checkout. Cookie analitik membantu kami
              memperbaiki layanan. Sesuai{" "}
              <Link href="/privacy" className="underline decoration-dotted underline-offset-2 hover:text-[hsl(var(--sage-700))]">
                UU PDP
              </Link>
              , kamu bisa atur preferensi kapan saja.
            </p>
            <div className="mt-3 flex flex-col sm:flex-row gap-2">
              <button
                onClick={accept}
                className="flex-1 rounded-xl bg-linear-to-br from-[hsl(var(--sage-600))] to-[hsl(var(--sage-800))] text-white px-3 py-2 text-sm font-semibold shadow-sm hover:shadow-md transition-shadow"
              >
                Setuju semua
              </button>
              <button
                onClick={reject}
                className="flex-1 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-3 py-2 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface-2))] transition-colors"
              >
                Esensial saja
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
