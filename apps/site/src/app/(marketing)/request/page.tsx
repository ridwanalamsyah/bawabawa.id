import type { Metadata } from "next";
import Link from "next/link";
import { RequestFlow } from "./flow";
import { getPaymentInfo, getZoneRates } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Form Titip Barang & Kuliner Viral Bandung",
  description:
    "Form 1 halaman jastip Bandung (Roti Macan, Tjilaki 9, Roti Merak, Rochi, Studio Bolen, Makjay, In Parfume). Pilih Jalur Bandung Instant, Travel Jabar/Jakarta, atau Hub Samarinda.",
};

export default async function RequestPage() {
  const [zones, payment] = await Promise.all([getZoneRates(), getPaymentInfo()]);

  return (
    <section className="py-8 sm:py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[hsl(var(--foreground))]">
              Form Titip Barang Bandung
            </h1>
            <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
              Pilih jalur pengiriman, masukkan daftar barang, lalu konfirmasi via Transfer Bank atau QRIS.
            </p>
          </div>
          <Link
            href="/katalog"
            className="text-xs font-semibold text-[hsl(var(--sage-700))] hover:underline shrink-0"
          >
            Pilih dari Katalog →
          </Link>
        </div>
        <div className="mt-6">
          <RequestFlow zones={zones} payment={payment} />
        </div>
      </div>
    </section>
  );
}
