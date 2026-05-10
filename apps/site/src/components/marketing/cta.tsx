"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FinalCTA() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="relative overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] p-10 sm:p-16 text-center"
        >
          <div className="absolute inset-0 -z-10 bg-linear-to-br from-[hsl(var(--sage-700))] via-[hsl(var(--sage-800))] to-[hsl(var(--sage-900))]" />
          <div className="absolute inset-0 -z-10 opacity-30">
            <div className="absolute -top-32 -left-20 h-96 w-96 rounded-full bg-[hsl(var(--emerald-400))] blur-3xl" />
            <div className="absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-[hsl(var(--olive-300))] blur-3xl" />
          </div>
          <div className="absolute inset-0 -z-10 opacity-[0.07] dot-grid text-white" />

          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[hsl(var(--sage-200))]">
            Mulai sekarang
          </p>
          <h2 className="mt-4 text-3xl sm:text-5xl font-semibold tracking-tight text-white max-w-3xl mx-auto leading-[1.05]">
            Titipan dari Bandung,
            <br />
            sampai depan rumah Samarinda.
          </h2>
          <p className="mt-5 max-w-xl mx-auto text-[hsl(var(--sage-100))]/80">
            Bergabung dengan ribuan customer yang sudah merasakan jasa titip premium ala startup digital.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" variant="accent">
              <Link href="/request">Titip Sekarang <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-transparent text-white border-white/40 hover:bg-white/10">
              <Link href="/open-trip">Lihat Open Trip</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
