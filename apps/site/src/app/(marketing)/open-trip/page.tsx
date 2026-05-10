import type { Metadata } from "next";
import Link from "next/link";
import { trips } from "@/lib/mock/trips";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { ArrowRight, Plane, Package2, Users, Calendar } from "lucide-react";
import { TripFilterTabs } from "./filter-tabs";

export const metadata: Metadata = {
  title: "Open Trip Bandung → Samarinda",
  description: "Lihat jadwal trip Bawabawa.id berikutnya, kapasitas tersedia, dan kategori barang populer.",
};

export default function OpenTripPage() {
  return (
    <>
      <section className="relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12 pb-10">
          <div className="grid lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-7">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))]">
                Open Trip
              </p>
              <h1 className="mt-3 text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.05]">
                Jadwal keberangkatan{" "}
                <span className="bg-linear-to-br from-[hsl(var(--sage-700))] via-[hsl(var(--olive-500))] to-[hsl(var(--emerald-600))] bg-clip-text text-transparent">
                  Bandung → Samarinda
                </span>
              </h1>
              <p className="mt-4 text-base text-[hsl(var(--muted-foreground))] max-w-xl">
                Pilih slot trip yang sesuai. Kapasitas, status, dan kategori populer di-update secara realtime dari ERP Bawabawa.
              </p>
            </div>
            <div className="lg:col-span-5">
              <GlassCard className="p-5">
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <Stat label="Trip aktif" value={trips.filter((t) => t.status !== "closed").length.toString()} />
                  <Stat label="Slot tersedia" value={trips.reduce((acc, t) => acc + Math.max(0, t.capacityKg - t.bookedKg), 0).toString() + " kg"} />
                  <Stat label="Trip terdekat" value={formatDate(trips[0].departAt, { day: "numeric", month: "short" })} />
                </div>
              </GlassCard>
            </div>
          </div>
          <div className="mt-8">
            <TripFilterTabs />
          </div>
        </div>
      </section>

      <section className="pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trips.map((t) => {
              const filled = Math.round((t.bookedKg / t.capacityKg) * 100);
              const isFull = t.status === "fullbooked" || filled >= 100;
              const isInTransit = t.status === "in_transit";
              return (
                <article
                  key={t.id}
                  className="group relative overflow-hidden rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-6 hover:shadow-[0_24px_60px_-30px_hsl(var(--sage-700)/0.45)] transition-all"
                >
                  <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-linear-to-br from-[hsl(var(--sage-200))] to-transparent dark:from-[hsl(var(--sage-700)/0.4)] opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-mono text-[hsl(var(--muted-foreground))]">{t.code}</p>
                      <h3 className="mt-1 text-lg font-semibold flex items-center gap-2">
                        {t.origin} <Plane className="h-4 w-4 text-[hsl(var(--sage-500))]" /> {t.destination}
                      </h3>
                    </div>
                    {isInTransit ? (
                      <Badge variant="info">Dalam perjalanan</Badge>
                    ) : isFull ? (
                      <Badge variant="warning">Fullbooked</Badge>
                    ) : (
                      <Badge variant="success">Slot tersedia</Badge>
                    )}
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-2xl bg-[hsl(var(--surface-2))] p-3">
                      <p className="text-[11px] text-[hsl(var(--muted-foreground))] flex items-center gap-1.5"><Calendar className="h-3 w-3" /> Berangkat</p>
                      <p className="font-medium mt-0.5">{formatDate(t.departAt, { weekday: "short", day: "numeric", month: "short" })}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">{new Date(t.departAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB</p>
                    </div>
                    <div className="rounded-2xl bg-[hsl(var(--surface-2))] p-3">
                      <p className="text-[11px] text-[hsl(var(--muted-foreground))] flex items-center gap-1.5"><Calendar className="h-3 w-3" /> Estimasi tiba</p>
                      <p className="font-medium mt-0.5">{formatDate(t.arriveEstimateAt, { weekday: "short", day: "numeric", month: "short" })}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">{new Date(t.arriveEstimateAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WITA</p>
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="flex items-center justify-between text-xs text-[hsl(var(--muted-foreground))]">
                      <span className="flex items-center gap-1.5"><Package2 className="h-3.5 w-3.5" /> Kapasitas</span>
                      <span className="font-medium text-[hsl(var(--foreground))]">{t.bookedKg}/{t.capacityKg} kg</span>
                    </div>
                    <Progress value={filled} className="mt-2" />
                    <p className="mt-1.5 text-[11px] text-[hsl(var(--muted-foreground))]">
                      {Math.max(0, t.capacityKg - t.bookedKg)} kg slot tersisa
                    </p>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-1.5">
                    {t.popularCategories.map((c) => (
                      <Badge key={c} variant="neutral">{c}</Badge>
                    ))}
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))] min-w-0">
                      <span className="h-7 w-7 rounded-full bg-linear-to-br from-[hsl(var(--sage-300))] to-[hsl(var(--sage-700))] grid place-items-center text-white text-[10px] font-semibold">
                        {t.shopper.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[hsl(var(--foreground))] text-xs font-medium">{t.shopper.name}</p>
                        <p className="text-[11px]"><Users className="h-3 w-3 inline mr-0.5" />{t.shopper.trips} trip · ★ {t.shopper.rating}</p>
                      </div>
                    </div>
                    <Button asChild size="sm" variant={isFull || isInTransit ? "outline" : "primary"} disabled={isInTransit}>
                      <Link href={`/request?trip=${t.id}`}>
                        {isFull ? "Notify saya" : isInTransit ? "Track" : "Pilih"} <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[hsl(var(--surface-2))] p-3">
      <p className="text-[11px] text-[hsl(var(--muted-foreground))]">{label}</p>
      <p className="mt-0.5 text-lg font-semibold">{value}</p>
    </div>
  );
}
