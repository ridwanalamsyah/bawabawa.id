import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, PackageSearch } from "lucide-react";
import { erpSafe } from "@/lib/erp-client";
import { GlassCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import type { CatalogProduct } from "@/app/api/catalog/route";
import { CatalogGrid, CartBar } from "./catalog-client";
import { delay } from "@/lib/motion";

export const metadata: Metadata = {
  title: "Katalog titipan Bandung",
  description:
    "Snack khas, fashion & factory outlet, hijab, sepatu, dan skincare lokal Bandung dengan harga all-in. Pesan, bayar, kami belikan & kirim ke Samarinda.",
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
        (!t.poClosesAt || new Date(t.poClosesAt).getTime() > now),
    )
    .sort((a, b) => a.departAt.localeCompare(b.departAt))[0];
}

export default async function CatalogPage() {
  const [catalog, trips] = await Promise.all([
    erpSafe<CatalogProduct[]>({ path: "/catalog", timeoutMs: 5000, cache: "force-cache", next: { revalidate: 60, tags: ["catalog", "inventory"] } }),
    erpSafe<Trip[]>({ path: "/trips", timeoutMs: 4000, cache: "force-cache", next: { revalidate: 60, tags: ["trips"] } }),
  ]);
  const products = catalog.ok && Array.isArray(catalog.data) ? catalog.data : [];
  const nextTrip = nextOpenTrip(trips.ok && Array.isArray(trips.data) ? trips.data : [], new Date().getTime());

  return (
    <section className="py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="animate-rise text-sm font-medium text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))]">
            Katalog
          </p>
          <h1 style={delay(60)} className="animate-rise mt-3 text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.05]">
            Titipan populer, harga sudah all-in.
          </h1>
          <p style={delay(140)} className="animate-rise mt-4 text-base text-[hsl(var(--muted-foreground))]">
            Harga sudah termasuk jasa titip. Ongkir dihitung dari berat di keranjang.
            Barang yang kamu cari tidak ada?{" "}
            <Link href="/request" className="underline">Titip barang apa saja</Link>.
          </p>
        </div>

        {nextTrip && (
          <GlassCard className="mt-8 p-4 sm:p-5 flex flex-wrap items-center gap-3">
            <CalendarClock className="h-5 w-5 text-[hsl(var(--sage-700))]" aria-hidden />
            <p className="text-sm">
              <strong>Open Trip {nextTrip.code}</strong> berangkat{" "}
              {formatDate(nextTrip.departAt, { weekday: "long", day: "numeric", month: "long", year: undefined })} ·{" "}
              {Math.max(0, nextTrip.capacityKg - nextTrip.bookedKg)} kg slot tersisa
              {nextTrip.poClosesAt && (
                <>
                  {" · "}
                  <strong>
                    PO tutup{" "}
                    {formatDate(nextTrip.poClosesAt, { weekday: "long", day: "numeric", month: "long", year: undefined, hour: "2-digit", minute: "2-digit" })}
                  </strong>
                </>
              )}
            </p>
            <Link href="/open-trip" className="text-sm underline sm:ml-auto">Lihat jadwal</Link>
          </GlassCard>
        )}

        <div className="mt-8">
          {products.length === 0 ? (
            <GlassCard className="p-10 text-center">
              <PackageSearch className="mx-auto h-8 w-8 text-[hsl(var(--muted-foreground))]" aria-hidden />
              <h2 className="mt-4 text-xl font-semibold">Katalog sedang disiapkan</h2>
              <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))] max-w-md mx-auto">
                Belum ada barang di katalog. Kamu tetap bisa titip barang apa saja — tim kami
                cek stok & harga dulu sebelum kamu bayar.
              </p>
              <Button asChild variant="primary" className="mt-6">
                <Link href="/request">Titip barang apa saja</Link>
              </Button>
            </GlassCard>
          ) : (
            <CatalogGrid products={products} />
          )}
        </div>
      </div>
      <CartBar />
    </section>
  );
}
