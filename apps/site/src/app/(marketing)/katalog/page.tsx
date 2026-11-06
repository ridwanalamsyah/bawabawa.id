import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, MapPin, Plane, Sparkles, Truck } from "lucide-react";
import { erpSafe } from "@/lib/erp-client";
import { GlassCard } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import type { CatalogProduct } from "@/app/api/catalog/route";
import { CatalogGrid, CartBar } from "./catalog-client";
import { delay } from "@/lib/motion";
import { VIRAL_BANDUNG_CATALOG } from "@/lib/viral-bandung-data";
import { getHubSamarindaStock } from "@/lib/site-content";

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
  const [catalog, trips, hubStock] = await Promise.all([
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
    getHubSamarindaStock(),
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
    <section className="py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <span className="animate-rise inline-flex items-center gap-1.5 rounded-full bg-[#F5DFAD] px-3 py-1 text-xs font-bold text-[#24201A]">
            <Sparkles className="h-3.5 w-3.5 text-[#C8524B]" /> Katalog Resmi Jastip Bandung
          </span>
          <h1
            style={delay(60)}
            className="animate-rise mt-3 font-display text-3xl sm:text-5xl font-bold tracking-tight leading-[1.06] text-[#24201A]"
          >
            Kuliner, Roti &amp; Barang Viral Bandung
          </h1>
          <p style={delay(120)} className="animate-rise mt-3 text-sm sm:text-base text-[hsl(var(--muted-foreground))] leading-relaxed">
            Harga tertera adalah <strong>harga asli toko Bandung</strong>. Pilih barang favoritmu, masukkan ke keranjang titipan, lalu pilih jalur pengiriman (<strong>Bandung Instant</strong>, <strong>Shuttle Travel Jawa Barat/Jakarta</strong>, atau <strong>Kloter Hub Samarinda</strong>). Barang yang kamu cari belum ada di daftar?{" "}
            <Link href="/request" className="font-bold text-[hsl(var(--sage-700))] underline underline-offset-4">
              Tulis manual barang/toko Bandung apa saja di sini →
            </Link>
          </p>
        </div>

        {/* Info 3 Jalur Pengiriman */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-3.5 flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[hsl(var(--sage-100))] text-[hsl(var(--sage-700))]">
              <MapPin className="h-4 w-4" />
            </span>
            <div className="text-xs">
              <p className="font-bold text-[#24201A]">🛵 Jalur 1 · Bandung Raya Instant</p>
              <p className="text-[hsl(var(--muted-foreground))] mt-0.5">
                Semua produk (termasuk Kopi Makjay &amp; Sapporo Soes dingin) bisa diantar hari ini.
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-3.5 flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#FBE8E6] text-[#9E3B34]">
              <Truck className="h-4 w-4" />
            </span>
            <div className="text-xs">
              <p className="font-bold text-[#24201A]">🚐 Jalur 2 · Travel Jabar &amp; Jakarta</p>
              <p className="text-[hsl(var(--muted-foreground))] mt-0.5">
                Sameday 4–8 jam via Cititrans, DayTrans, Arnes, Bhinneka, Pasteur Trans.
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-3.5 flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#F5DFAD] text-[#24201A]">
              <Plane className="h-4 w-4" />
            </span>
            <div className="text-xs">
              <p className="font-bold text-[#24201A]">✈️ Jalur 3 · Kloter Hub Samarinda</p>
              <p className="text-[hsl(var(--muted-foreground))] mt-0.5">
                Khusus produk tahan ≥3 hari + tersedia {hubStock.length} item Ready Stock di Hub Samarinda.
              </p>
            </div>
          </div>
        </div>

        {nextTrip && (
          <GlassCard className="mt-5 p-4 flex flex-wrap items-center gap-3 bg-[#FCF3E4]">
            <CalendarClock className="h-5 w-5 text-[hsl(var(--sage-700))]" aria-hidden />
            <p className="text-xs sm:text-sm">
              <strong>Kloter {nextTrip.code}</strong> berangkat{" "}
              {formatDate(nextTrip.departAt, { weekday: "long", day: "numeric", month: "long", year: undefined })} ·{" "}
              {Math.max(0, nextTrip.capacityKg - nextTrip.bookedKg)} kg kuota tersisa
              {nextTrip.poClosesAt && (
                <>
                  {" · "}
                  <strong>
                    Cut-off PO{" "}
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
            <Link href="/open-trip" className="text-xs font-bold text-[hsl(var(--sage-700))] underline sm:ml-auto">
              Lihat Jadwal Lengkap →
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
