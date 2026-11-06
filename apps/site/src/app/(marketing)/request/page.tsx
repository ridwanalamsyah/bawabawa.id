import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles } from "lucide-react";
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
    <section className="py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F5DFAD] px-3 py-1 text-xs font-bold text-[#24201A]">
            <Sparkles className="h-3.5 w-3.5 text-[#C8524B]" /> Form Jastip 1 Halaman · Tanpa Buat Akun
          </span>
          <h1 className="mt-3 font-display text-3xl sm:text-5xl font-bold tracking-tight leading-[1.06] text-[#24201A]">
            Titip Kuliner &amp; Barang Viral Bandung
          </h1>
          <p className="mt-3 text-sm sm:text-base text-[hsl(var(--muted-foreground))] leading-relaxed">
            Pilih jalur pengiriman (<strong>🛵 Bandung Instant</strong>, <strong>🚐 Travel Jawa Barat &amp; Jakarta</strong>, atau <strong>✈️ Hub Samarinda</strong>), masukkan daftar barang &amp; toko Bandung, lalu konfirmasi mudah via <strong>Transfer Bank / QRIS &amp; WhatsApp</strong>. Mau pilih dari daftar populer?{" "}
            <Link href="/katalog" className="font-bold text-[hsl(var(--sage-700))] underline underline-offset-4">
              Buka Katalog Viral Bandung →
            </Link>
          </p>
        </div>
        <div className="mt-8">
          <RequestFlow zones={zones} payment={payment} />
        </div>
      </div>
    </section>
  );
}
