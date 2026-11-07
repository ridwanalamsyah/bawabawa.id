import Link from "next/link";
import { ArrowRight, Check, CreditCard, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatIDR } from "@/lib/utils";
import { DEFAULT_ZONE_RATES } from "@/lib/viral-bandung-data";

export function Pricing() {
  const zones = DEFAULT_ZONE_RATES;

  return (
    <section
      id="harga"
      className="py-12 sm:py-16 border-t border-[hsl(var(--border))]"
      aria-labelledby="pricing-title"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2
              id="pricing-title"
              className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[hsl(var(--foreground))]"
            >
              Tarif 3 Jalur Pengiriman
            </h2>
            <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
              Total = Harga Toko + Jasa Titip (min. Rp20.000) + Ongkir.
            </p>
          </div>
          <div className="inline-flex items-center gap-3 text-xs font-medium text-[hsl(var(--muted-foreground))]">
            <span className="inline-flex items-center gap-1">
              <CreditCard className="h-3.5 w-3.5 text-[hsl(var(--sage-700))]" /> BCA · Mandiri · SeaBank
            </span>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <QrCode className="h-3.5 w-3.5 text-[hsl(var(--sage-700))]" /> QRIS Resmi
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {zones.map((z, idx) => {
            const isHighlighted = idx === 1;
            return (
              <div
                key={z.id}
                className={`rounded-2xl border p-5 flex flex-col justify-between gap-5 ${
                  isHighlighted
                    ? "border-[hsl(var(--sage-700))] bg-[hsl(var(--surface))] shadow-xs"
                    : "border-[hsl(var(--border))] bg-[hsl(var(--surface))]"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full bg-[hsl(var(--sage-100))] px-2.5 py-0.5 text-[11px] font-semibold text-[hsl(var(--sage-800))]">
                      {z.shortLabel}
                    </span>
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">{z.eta}</span>
                  </div>

                  <div className="pt-1 flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold text-[hsl(var(--foreground))] tabular-nums">
                      {formatIDR(z.baseShippingRp)}
                    </span>
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">
                      / {z.freeKgIncluded} kg pertama
                    </span>
                  </div>

                  <ul className="space-y-1.5 pt-2 border-t border-[hsl(var(--border))] text-xs text-[hsl(var(--muted-foreground))]">
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-[hsl(var(--sage-700))] shrink-0 mt-0.5" />
                      <span className="line-clamp-1">
                        {z.cities.slice(0, 4).join(", ")}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-[hsl(var(--sage-700))] shrink-0 mt-0.5" />
                      <span>
                        Jastip {Math.round(z.jastipFeeRate * 100)}% (min. {formatIDR(z.jastipFeeMinRp)})
                      </span>
                    </li>
                  </ul>
                </div>

                <Button
                  asChild
                  size="sm"
                  variant={isHighlighted ? "primary" : "outline"}
                  className="w-full justify-between"
                >
                  <Link href={`/request?zone=${z.id}`}>
                    <span>Pilih {z.shortLabel}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
