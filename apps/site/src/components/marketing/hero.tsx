"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, ShieldCheck, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroVisual } from "./hero-visual";
import { LiveStats } from "./live-stats";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-14 pb-20 lg:pt-20 lg:pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6">
            <motion.div
              initial={{ y: 18, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--surface)/0.8)] backdrop-blur px-3 py-1 text-xs font-medium text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-200))]"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Layanan jasa titip Bandung → Samarinda · resmi & terpercaya
            </motion.div>
            <motion.h1
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.05 }}
              className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-[-0.03em] leading-[1.05]"
            >
              Titip barang dari{" "}
              <span className="relative inline-block">
                <span className="bg-gradient-to-br from-[hsl(var(--sage-700))] via-[hsl(var(--olive-500))] to-[hsl(var(--emerald-600))] bg-clip-text text-transparent">
                  Bandung
                </span>
                <span className="absolute -bottom-1 left-0 right-0 h-1.5 bg-[hsl(var(--emerald-400)/0.35)] -z-10 rounded-full" />
              </span>{" "}
              ke Samarinda <span className="text-[hsl(var(--muted-foreground))]">tanpa ribet.</span>
            </motion.h1>
            <motion.p
              initial={{ y: 18, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="mt-5 max-w-xl text-base sm:text-lg text-[hsl(var(--muted-foreground))] leading-relaxed"
            >
              Personal shopper terverifikasi membelikan barang di Bandung —
              dari Pasar Baru, Trans Studio Mall, hingga toko favorit kamu — lalu
              dikirim aman sampai depan rumah di Samarinda. Cepat, transparan, dan terpercaya.
            </motion.p>

            <motion.div
              initial={{ y: 18, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="mt-8 flex flex-col sm:flex-row gap-3"
            >
              <Button asChild size="lg" variant="primary">
                <Link href="/request">
                  Titip Sekarang
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/open-trip">Lihat Open Trip</Link>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-8 flex items-center gap-6 text-sm text-[hsl(var(--muted-foreground))]"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[hsl(var(--emerald-500))]" />
                Garansi barang aman
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 fill-[hsl(var(--warning))] stroke-[hsl(var(--warning))]" />
                <span>4.96 dari 1.2k+ ulasan</span>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-6"
          >
            <HeroVisual />
          </motion.div>
        </div>

        <LiveStats />
      </div>
    </section>
  );
}
