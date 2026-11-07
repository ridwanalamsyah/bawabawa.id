import type { Metadata } from "next";
import Link from "next/link";
import { RequestFlow } from "./flow";
import { getPaymentInfo, getZoneRates } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Titip Sekarang",
  description:
    "Form jastip Bandung (Roti Macan, Tjilaki 9, Roti Merak, Rochi, Studio Bolen, Makjay, In Parfume). Pilih jalur Bandung Instant, Travel Jabar/Jakarta, atau Hub Samarinda.",
};

export default async function RequestPage() {
  const [zones, payment] = await Promise.all([getZoneRates(), getPaymentInfo()]);

  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--sage-700))] font-semibold">
            Titip Sekarang
          </p>
          <h1 className="mt-2 text-3xl sm:text-5xl font-bold tracking-tight leading-[1.08]">
            Titip barang apa saja dari Bandung.
          </h1>
          <p className="mt-3 text-sm sm:text-base text-[hsl(var(--muted-foreground))] leading-relaxed">
            Satu halaman, tanpa perlu buat akun. Mau pilih dari barang yang sudah ada?{" "}
            <Link href="/katalog" className="underline text-[hsl(var(--sage-700))] font-medium">
              Lihat katalog pilihan
            </Link>
            .
          </p>
        </div>
        <div className="mt-8">
          <RequestFlow zones={zones} payment={payment} />
        </div>
      </div>
    </section>
  );
}
