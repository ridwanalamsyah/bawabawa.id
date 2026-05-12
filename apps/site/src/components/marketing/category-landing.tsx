"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/card";
import { AmbientOrbs } from "./ambient-orbs";
import type { CategoryPage } from "@/lib/seo/categories";

export function CategoryLanding({ page }: { page: CategoryPage }) {
  return (
    <>
      <section className="relative overflow-hidden">
        <AmbientOrbs />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-14 pb-16 lg:pt-20">
          <motion.div
            initial={{ y: 18, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--surface)/0.8)] backdrop-blur px-3 py-1 text-xs font-medium text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-200))]"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {page.heroEyebrow}
          </motion.div>
          <motion.h1
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="mt-5 text-4xl sm:text-5xl font-semibold tracking-[-0.02em] leading-tight max-w-3xl"
          >
            {page.heroHeadline.split("Bandung")[0]}
            <span className="bg-linear-to-br from-[hsl(var(--sage-700))] via-[hsl(var(--olive-500))] to-[hsl(var(--emerald-600))] bg-clip-text text-transparent">
              Bandung
            </span>
            {page.heroHeadline.split("Bandung")[1]}
          </motion.h1>
          <motion.p
            initial={{ y: 18, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-5 max-w-2xl text-[hsl(var(--muted-foreground))] leading-relaxed"
          >
            {page.heroDescription}
          </motion.p>
          <motion.div
            initial={{ y: 18, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-7 flex flex-col sm:flex-row gap-3"
          >
            <Button asChild size="lg" variant="primary">
              <Link href={`/request?cat=${page.slug}`}>
                Titip {page.title} Sekarang
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/open-trip">Lihat Open Trip</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))]">
              Contoh barang
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Brand & produk populer</h2>
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {page.examples.map((ex) => (
                <div
                  key={ex}
                  className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface)/0.7)] backdrop-blur-sm px-3 py-2.5 flex items-center gap-2"
                >
                  <span className="h-2 w-2 rounded-full bg-[hsl(var(--sage-500))]" />
                  <span className="text-sm font-medium">{ex}</span>
                </div>
              ))}
            </div>
          </div>

          <GlassCard className="p-6">
            <div className="flex items-center gap-2 text-sm text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))] font-semibold">
              <ShieldCheck className="h-4 w-4" />
              Komitmen Bawabawa
            </div>
            <ul className="mt-4 space-y-3 text-sm">
              {[
                "Original 100% dari outlet / toko resmi",
                "Foto barang sebelum bayar (di toko)",
                "Tracking 9-step realtime di dashboard",
                "Garansi sampai Rp 5jt (default), asuransi opsional",
                "Refund 100% kalau pembatalan sebelum belanja",
                "Personal shopper KYC & rating publik",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2.5">
                  <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[hsl(var(--sage-700))] text-white shrink-0">
                    <Check className="h-3 w-3" />
                  </span>
                  <span className="text-[hsl(var(--foreground))]">{line}</span>
                </li>
              ))}
            </ul>
          </GlassCard>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-semibold tracking-tight">Pertanyaan {page.title}</h2>
        <div className="mt-5 space-y-3">
          {page.faq.map((f) => (
            <details
              key={f.q}
              className="group rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface)/0.7)] backdrop-blur-sm p-5 [&[open]>summary>span.toggle]:rotate-45 [&[open]>summary>span.toggle]:bg-[hsl(var(--sage-700))] [&[open]>summary>span.toggle]:text-white"
            >
              <summary className="cursor-pointer list-none flex items-start justify-between gap-3 font-medium">
                {f.q}
                <span className="toggle inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--surface))] transition-all">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
                {f.a}
              </p>
            </details>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link
            href={`/request?cat=${page.slug}`}
            className="inline-flex items-center gap-2 rounded-2xl bg-linear-to-br from-[hsl(var(--sage-600))] to-[hsl(var(--sage-800))] text-white px-6 py-3 font-semibold shadow-md hover:shadow-lg transition-shadow"
          >
            Mulai titip {page.title.toLowerCase()}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
