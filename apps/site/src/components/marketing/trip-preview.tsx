import Link from "next/link";
import { ArrowRight, Plane } from "lucide-react";
import { erpSafe } from "@/lib/erp-client";
import { Progress } from "@/components/ui/progress";
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
    <section className="py-16 sm:py-20 border-t border-[hsl(var(--border))]" aria-labelledby="trip-preview-title">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <h2 id="trip-preview-title" className="text-2xl sm:text-3xl">
              Jadwal Open Trip
            </h2>
            <p className="mt-2 text-[15px] text-[hsl(var(--muted-foreground))]">
              Kargo bersama, flat Rp200.000 sampai 50 kg.
            </p>
          </div>
          <Link href="/open-trip" className="text-sm font-medium underline underline-offset-4">
            Semua jadwal <ArrowRight className="inline h-4 w-4" aria-hidden />
          </Link>
        </div>

        <ul className="mt-6 divide-y divide-[hsl(var(--border))] border-y border-[hsl(var(--border))]">
          {top.map((t) => {
            const left = Math.max(0, t.capacityKg - t.bookedKg);
            const filled = t.capacityKg > 0 ? Math.min(100, Math.round((t.bookedKg / t.capacityKg) * 100)) : 0;
            const isFull = t.status === "fullbooked" || left <= 0;
            return (
              <li key={t.id} className="py-4 grid grid-cols-2 sm:grid-cols-12 gap-x-4 gap-y-2 items-center">
                <div className="sm:col-span-3">
                  <p className="font-semibold">
                    {formatDate(t.departAt, { weekday: "short", day: "numeric", month: "short", year: undefined })}
                  </p>
                  <p className="text-xs font-mono text-[hsl(var(--muted-foreground))]">{t.code}</p>
                </div>
                <p className="sm:col-span-3 text-sm text-[hsl(var(--muted-foreground))]">
                  Tiba{" "}
                  {t.arriveEstimateAt
                    ? formatDate(t.arriveEstimateAt, { day: "numeric", month: "short", year: undefined })
                    : "diinfokan"}
                </p>
                <div className="col-span-2 sm:col-span-4 flex items-center gap-3">
                  <Progress value={filled} className="h-1.5" />
                  <span className="shrink-0 text-sm tabular-nums">{isFull ? "Penuh" : `${left} kg sisa`}</span>
                </div>
                <div className="col-span-2 sm:col-span-2 sm:text-right">
                  {!isFull && (
                    <Link href="/request" className="text-sm font-semibold underline underline-offset-4">
                      Titip <Plane className="inline h-3.5 w-3.5" aria-hidden />
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
