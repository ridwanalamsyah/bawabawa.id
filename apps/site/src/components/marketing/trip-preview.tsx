import Link from "next/link";
import { ArrowRight, Package2, Plane } from "lucide-react";
import { erpSafe } from "@/lib/erp-client";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

type Trip = {
  id: string;
  code: string;
  origin: string;
  destination: string;
  departAt: string;
  arriveEstimateAt: string | null;
  capacityKg: number;
  bookedKg: number;
  status: string;
  popularCategories: string[] | null;
};

/**
 * Next published Open Trips, straight from the ERP (this section used to
 * render mock trips with invented shopper names and ratings). Renders
 * nothing when no trip is open, so the page never advertises a schedule
 * that doesn't exist.
 */
export async function TripPreview() {
  const res = await erpSafe<Trip[]>({
    path: "/trips",
    timeoutMs: 4000,
    cache: "force-cache",
    next: { revalidate: 60, tags: ["trips"] },
  });
  const top = (res.ok && Array.isArray(res.data) ? res.data : [])
    .filter((t) => t.status === "open" || t.status === "fullbooked")
    .sort((a, b) => a.departAt.localeCompare(b.departAt))
    .slice(0, 3);
  if (top.length === 0) return null;

  return (
    <section className="py-16 sm:py-24" aria-labelledby="trip-preview-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))]">
              Open Trip terdekat
            </p>
            <h2 id="trip-preview-title" className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight">
              Kirim barang berat lebih hemat lewat Open Trip.
            </h2>
            <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
              Flat Rp200rb sampai 50 kg — cocok untuk belanja banyak atau barang berat.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/open-trip">
              Semua jadwal <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {top.map((t) => {
            const filled = t.capacityKg > 0 ? Math.min(100, Math.round((t.bookedKg / t.capacityKg) * 100)) : 0;
            const isFull = t.status === "fullbooked" || filled >= 100;
            return (
              <article
                key={t.id}
                className="rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-mono text-[hsl(var(--muted-foreground))]">{t.code}</p>
                    <h3 className="mt-1 text-lg font-semibold">
                      {t.origin} <span className="text-[hsl(var(--muted-foreground))]">→</span> {t.destination}
                    </h3>
                  </div>
                  {isFull ? <Badge variant="warning">Penuh</Badge> : <Badge variant="success">Slot tersedia</Badge>}
                </div>

                <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl bg-[hsl(var(--surface-2))] p-3">
                    <dt className="text-[11px] text-[hsl(var(--muted-foreground))]">Berangkat</dt>
                    <dd className="font-medium mt-0.5">{formatDate(t.departAt, { weekday: "short", day: "numeric", month: "short", year: undefined })}</dd>
                  </div>
                  <div className="rounded-2xl bg-[hsl(var(--surface-2))] p-3">
                    <dt className="text-[11px] text-[hsl(var(--muted-foreground))]">Estimasi tiba</dt>
                    <dd className="font-medium mt-0.5">
                      {t.arriveEstimateAt
                        ? formatDate(t.arriveEstimateAt, { weekday: "short", day: "numeric", month: "short", year: undefined })
                        : "Diinfokan"}
                    </dd>
                  </div>
                </dl>

                <div className="mt-5">
                  <div className="flex items-center justify-between text-xs text-[hsl(var(--muted-foreground))]">
                    <span className="flex items-center gap-1.5">
                      <Package2 className="h-3.5 w-3.5" aria-hidden /> Kapasitas terisi
                    </span>
                    <span className="font-medium text-[hsl(var(--foreground))]">
                      {t.bookedKg}/{t.capacityKg} kg
                    </span>
                  </div>
                  <Progress value={filled} className="mt-2" />
                </div>

                {t.popularCategories && t.popularCategories.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-1.5">
                    {t.popularCategories.map((c) => (
                      <Badge key={c} variant="neutral">
                        {c}
                      </Badge>
                    ))}
                  </div>
                )}

                {!isFull && (
                  <Button asChild size="sm" variant="primary" className="mt-5 w-full">
                    <Link href="/request">
                      Titip lewat trip ini <Plane className="h-3.5 w-3.5" aria-hidden />
                    </Link>
                  </Button>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
