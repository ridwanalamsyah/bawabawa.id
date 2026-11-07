import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { erpSafe } from "@/lib/erp-client";
import { GlassCard } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import type { CatalogProduct } from "@/app/api/catalog/route";
import { CatalogGrid, CartBar } from "./catalog-client";
import { delay } from "@/lib/motion";
import { VIRAL_BANDUNG_CATALOG } from "@/lib/viral-bandung-data";

export const metadata: Metadata = {
  title: "Katalog Kuliner & Barang Bandung",
  description:
    "Katalog jastip Roti Macan, Bolu Pisang Tjilaki 9, Roti Merak, Rochi, Studio Bolen, Seroja Bake, Sapporo Soes, Puln, Kue Warisan, Kopi Makjay, Basreng & In Parfume Bandung.",
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
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="animate-rise text-xs uppercase tracking-[0.2em] text-[hsl(var(--sage-700))] font-semibold">
            Katalog Pilihan
          </p>
          <h1
            style={delay(60)}
            className="animate-rise mt-2 text-3xl sm:text-5xl font-bold tracking-tight leading-[1.08]"
          >
            Barang yang paling sering dititip dari Bandung.
          </h1>
          <p
            style={delay(120)}
            className="animate-rise mt-3 text-sm sm:text-base text-[hsl(var(--muted-foreground))] leading-relaxed"
          >
            Harga di bawah adalah harga toko Bandung (belum termasuk jastip &amp; ongkir sesuai jalur kirim). Barang yang kamu mau belum ada?{" "}
            <Link href="/request" className="underline text-[hsl(var(--sage-700))] font-medium">
              Tulis di form titip sekarang
            </Link>
            .
          </p>
        </div>

        {nextTrip && (
          <GlassCard className="mt-6 p-4 flex flex-wrap items-center gap-3">
            <CalendarClock className="h-5 w-5 text-[hsl(var(--sage-700))]" aria-hidden />
            <p className="text-xs sm:text-sm">
              <strong>Kloter {nextTrip.code}</strong> berangkat{" "}
              {formatDate(nextTrip.departAt, { weekday: "long", day: "numeric", month: "long", year: undefined })} ·{" "}
              {Math.max(0, nextTrip.capacityKg - nextTrip.bookedKg)} kg tersisa
              {nextTrip.poClosesAt && (
                <>
                  {" · "}
                  <strong>
                    Tutup PO{" "}
                    {formatDate(nextTrip.poClosesAt, {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: undefined,
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </strong>
                </>
              )}
            </p>
            <Link href="/open-trip" className="text-xs font-semibold text-[hsl(var(--sage-700))] underline sm:ml-auto">
              Jadwal lengkap →
            </Link>
          </GlassCard>
        )}

        <div className="mt-8">
          <CatalogGrid products={products} />
        </div>
      </div>
      <CartBar />
    </section>
  );
}
