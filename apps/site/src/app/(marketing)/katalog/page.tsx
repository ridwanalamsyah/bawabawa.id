import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { erpSafe } from "@/lib/erp-client";
import { GlassCard } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import type { CatalogProduct } from "@/app/api/catalog/route";
import { CatalogGrid, CartBar } from "./catalog-client";
import { VIRAL_BANDUNG_CATALOG } from "@/lib/viral-bandung-data";

export const metadata: Metadata = {
  title: "Katalog Kuliner & Barang Viral Bandung",
  description:
    "Katalog jastip Roti Macan, Bolu Pisang Tjilaki 9, Roti Merak, Rochi, Studio Bolen, Seroja Bake, Sapporo Soes, Puln, Kue Warisan, Kopi Makjay, Basreng Sultan & In Parfume Bandung.",
  alternates: { canonical: "/katalog" },
};

export const revalidate = 60;

type Trip = {
  id: string;
  code: string;
  departAt: string;
  status: string;
  capacityKg: number;
  bookedKg: number;
  poClosesAt?: string | null;
};

function nextOpenTrip(trips: Trip[], now: number): Trip | undefined {
  return trips
    .filter(
      (t) =>
        t.status === "open" &&
        new Date(t.departAt).getTime() > now &&
        (!t.poClosesAt || new Date(t.poClosesAt).getTime() > now)
    )
    .sort((a, b) => a.departAt.localeCompare(b.departAt))[0];
}

export default async function CatalogPage() {
  const [catalog, trips] = await Promise.all([
    erpSafe<CatalogProduct[]>({
      path: "/catalog",
      timeoutMs: 5000,
      cache: "force-cache",
      next: { revalidate: 60, tags: ["catalog", "inventory"] },
    }),
    erpSafe<Trip[]>({
      path: "/trips",
      timeoutMs: 4000,
      cache: "force-cache",
      next: { revalidate: 60, tags: ["trips"] },
    }),
  ]);

  const products: CatalogProduct[] =
    catalog.ok && Array.isArray(catalog.data) && catalog.data.length > 0
      ? catalog.data
      : VIRAL_BANDUNG_CATALOG;

  const nextTrip = nextOpenTrip(
    trips.ok && Array.isArray(trips.data) ? trips.data : [],
    new Date().getTime()
  );

  return (
    <section className="py-8 sm:py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[hsl(var(--foreground))]">
              Katalog Hits Bandung
            </h1>
            <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
              Harga asli toko Bandung. Barang yang kamu cari belum ada?{" "}
              <Link href="/request" className="font-semibold text-[hsl(var(--sage-700))] underline underline-offset-4">
                Tulis manual di form →
              </Link>
            </p>
          </div>
        </div>

        {nextTrip && (
          <GlassCard className="mt-4 p-3.5 flex flex-wrap items-center gap-3">
            <CalendarClock className="h-4 w-4 text-[hsl(var(--sage-700))]" aria-hidden />
            <p className="text-xs sm:text-sm">
              <strong>Kloter {nextTrip.code}</strong> berangkat{" "}
              {formatDate(nextTrip.departAt, { weekday: "long", day: "numeric", month: "long", year: undefined })} ·{" "}
              {Math.max(0, nextTrip.capacityKg - nextTrip.bookedKg)} kg kuota tersisa
            </p>
            <Link href="/open-trip" className="text-xs font-semibold text-[hsl(var(--sage-700))] underline sm:ml-auto">
              Jadwal Lengkap →
            </Link>
          </GlassCard>
        )}

        <div className="mt-6">
          <CatalogGrid products={products} />
        </div>
      </div>
      <CartBar />
    </section>
  );
}
