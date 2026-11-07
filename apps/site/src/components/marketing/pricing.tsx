import Link from "next/link";
import { ArrowRight, Check, CreditCard, QrCode, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatIDR } from "@/lib/utils";
import { DEFAULT_ZONE_RATES } from "@/lib/viral-bandung-data";

export function Pricing() {
  const zones = DEFAULT_ZONE_RATES;

  return (
    <section
      id="harga"
      className="py-16 sm:py-24 border-t border-[hsl(var(--border))] bg-white"
      aria-labelledby="pricing-title"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--sage-700))]">
              Struktur Biaya Transparan
            </span>
            <h2
              id="pricing-title"
              className="mt-2 font-display text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900"
            >
              Harga Toko Asli + Jasa Titip 8% + Ongkir Sesuai Zona
            </h2>
            <p className="mt-2 text-sm text-zinc-600 leading-relaxed">
              Kami tidak menaikkan harga menu diam-diam. Struk asli outlet Bandung selalu dilampirkan bersama Nota Rincian PDF.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-zinc-50 px-3.5 py-2 text-xs font-medium text-zinc-700">
            <ShieldCheck className="h-4 w-4 text-[hsl(var(--sage-700))]" />
            Minimum fee jastip Rp20.000 per toko · Gratis gabung beberapa menu
          </div>
        </div>

        {/* 3 Zone Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {zones.map((z, idx) => {
            const isHighlighted = idx === 1;
            return (
              <div
                key={z.id}
                className={`rounded-2xl border p-6 flex flex-col justify-between gap-6 transition-shadow ${
                  isHighlighted
                    ? "border-[hsl(var(--sage-700))] bg-white shadow-md"
                    : "border-[hsl(var(--border))] bg-zinc-50/60"
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-md bg-[hsl(var(--sage-50))] px-2.5 py-1 text-xs font-semibold text-[hsl(var(--sage-800))]">
                      {z.badge}
                    </span>
                    <span className="text-xs font-medium text-zinc-500">{z.eta}</span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-zinc-900">{z.label}</h3>
                    <p className="mt-1 text-xs text-zinc-600 leading-relaxed">
                      {z.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[hsl(var(--border))] flex items-baseline justify-between">
                    <div>
                      <span className="text-xs text-zinc-500 block">Tarif Ongkir Dasar</span>
                      <span className="text-2xl font-bold text-zinc-900 tabular-nums">
                        {formatIDR(z.baseShippingRp)}
                      </span>
                      <span className="text-xs text-zinc-500 ml-1">
                        / {z.freeKgIncluded} kg pertama
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-zinc-500 block">Jasa Titip</span>
                      <span className="text-sm font-bold text-[hsl(var(--sage-700))]">
                        {Math.round(z.jastipFeeRate * 100)}% (min {formatIDR(z.jastipFeeMinRp)})
                      </span>
                    </div>
                  </div>

                  <ul className="space-y-2 pt-2 text-xs text-zinc-600">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-[hsl(var(--sage-700))] shrink-0 mt-0.5" />
                      <span>
                        Cakupan kota: <strong className="font-semibold text-zinc-900">{z.cities.join(", ")}</strong>
                      </span>
                    </li>
                    {z.shuttles && z.shuttles.length > 0 && (
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-[hsl(var(--sage-700))] shrink-0 mt-0.5" />
                        <span>
                          Pool Shuttle: <strong className="font-semibold text-zinc-900">{z.shuttles.join(", ")}</strong>
                        </span>
                      </li>
                    )}
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-[hsl(var(--sage-700))] shrink-0 mt-0.5" />
                      <span>
                        Tambahan berat di atas {z.freeKgIncluded} kg: {formatIDR(z.perKgRp)}/kg
                      </span>
                    </li>
                  </ul>
                </div>

                <Button
                  asChild
                  size="default"
                  variant={isHighlighted ? "primary" : "outline"}
                  className="w-full justify-between"
                >
                  <Link href={`/request?zone=${z.id}`}>
                    <span>Pilih {z.shortLabel}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            );
          })}
        </div>

        {/* Direct Payment Info Box */}
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-zinc-50 p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[hsl(var(--sage-700))]">
              <QrCode className="h-4 w-4" />
              Pembayaran Langsung Tanpa Biaya Payment Gateway
            </div>
            <h3 className="text-lg font-bold text-zinc-900">
              Transfer Bank (BCA / Mandiri / SeaBank) &amp; QRIS Resmi Bawabawa.id
            </h3>
            <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
              Tidak ada biaya admin virtual account tambahan. Setelah submit form titipan, Anda langsung mendapatkan{" "}
              <strong className="font-semibold text-zinc-900">Nota Rincian PDF</strong> beserta kode QRIS &amp; nomor rekening resmi untuk konfirmasi cepat via WhatsApp Admin.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-[hsl(var(--border))] bg-white px-3 py-2 text-xs font-semibold text-zinc-800">
              <CreditCard className="h-3.5 w-3.5 text-[hsl(var(--sage-700))]" /> BCA · Mandiri · SeaBank
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-[hsl(var(--border))] bg-white px-3 py-2 text-xs font-semibold text-zinc-800">
              <QrCode className="h-3.5 w-3.5 text-[hsl(var(--sage-700))]" /> QRIS All E-Wallet &amp; M-Banking
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
