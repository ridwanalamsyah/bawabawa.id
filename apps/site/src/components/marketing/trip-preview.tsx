"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Plane, Package2, Users } from "lucide-react";
import { trips } from "@/lib/mock/trips";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export function TripPreview() {
  const top = trips.filter((t) => t.status !== "in_transit").slice(0, 3);
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))]">
              Open Trip terdekat
            </p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight">
              Pilih jadwal keberangkatan Bandung → Samarinda berikutnya.
            </h2>
          </div>
          <Button asChild variant="outline">
            <Link href="/open-trip">
              Semua Open Trip <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {top.map((t, i) => {
            const filled = Math.round((t.bookedKg / t.capacityKg) * 100);
            const isFull = t.status === "fullbooked" || filled >= 100;
            return (
              <motion.article
                key={t.id}
                initial={{ y: 22, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="group relative overflow-hidden rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-6 hover:shadow-[0_24px_60px_-30px_hsl(var(--sage-700)/0.45)] transition-all"
              >
                <div className="absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-[hsl(var(--sage-100))] to-transparent dark:from-[hsl(var(--sage-700)/0.25)]" />
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-mono text-[hsl(var(--muted-foreground))]">{t.code}</p>
                    <h3 className="mt-1 text-lg font-semibold">
                      {t.origin} <span className="text-[hsl(var(--muted-foreground))]">→</span> {t.destination}
                    </h3>
                  </div>
                  {isFull ? (
                    <Badge variant="warning">Fullbooked</Badge>
                  ) : (
                    <Badge variant="success">Slot tersedia</Badge>
                  )}
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl bg-[hsl(var(--surface-2))] p-3">
                    <p className="text-[11px] text-[hsl(var(--muted-foreground))]">Berangkat</p>
                    <p className="font-medium mt-0.5">{formatDate(t.departAt, { weekday: "short", day: "numeric", month: "short" })}</p>
                  </div>
                  <div className="rounded-2xl bg-[hsl(var(--surface-2))] p-3">
                    <p className="text-[11px] text-[hsl(var(--muted-foreground))]">Estimasi tiba</p>
                    <p className="font-medium mt-0.5">{formatDate(t.arriveEstimateAt, { weekday: "short", day: "numeric", month: "short" })}</p>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="flex items-center justify-between text-xs text-[hsl(var(--muted-foreground))]">
                    <span className="flex items-center gap-1.5"><Package2 className="h-3.5 w-3.5" /> Kapasitas terisi</span>
                    <span className="font-medium text-[hsl(var(--foreground))]">{t.bookedKg}/{t.capacityKg} kg</span>
                  </div>
                  <Progress value={filled} className="mt-2" />
                </div>

                <div className="mt-5 flex flex-wrap gap-1.5">
                  {t.popularCategories.map((c) => (
                    <Badge key={c} variant="neutral">{c}</Badge>
                  ))}
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
                    <Users className="h-3.5 w-3.5" />
                    {t.shopper.name} · ★ {t.shopper.rating}
                  </div>
                  <Button asChild size="sm" variant={isFull ? "outline" : "primary"} disabled={isFull}>
                    <Link href={`/request?trip=${t.id}`}>
                      {isFull ? "Notify saya" : "Pilih slot"} <Plane className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
