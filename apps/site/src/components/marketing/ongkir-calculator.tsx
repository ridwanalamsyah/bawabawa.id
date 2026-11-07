"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatIDR } from "@/lib/utils";
import {
  DEFAULT_ZONE_RATES,
  computeZoneEstimate,
  type DeliveryZoneKey,
  type ZoneRateConfig,
} from "@/lib/viral-bandung-data";

const WEIGHTS = [0.5, 1, 2, 3, 5];

export function OngkirCalculator({
  zones = DEFAULT_ZONE_RATES,
}: {
  zones?: ZoneRateConfig[];
}) {
  const priceId = useId();
  const [price, setPrice] = useState(125000);
  const [kg, setKg] = useState(1);
  const [selectedZone, setSelectedZone] = useState<DeliveryZoneKey>("jabar_travel");

  const rows = zones.map((z) => ({
    zone: z,
    est: computeZoneEstimate({
      zoneId: z.id,
      itemSubtotalRp: price,
      weightKg: kg,
      zones,
    }),
  }));

  return (
    <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-5 sm:p-6">
      <h2 className="text-lg font-semibold">Hitung perkiraan biaya</h2>

      <label htmlFor={priceId} className="mt-4 block text-sm font-medium">
        Harga barang di toko
      </label>
      <div className="mt-1.5 relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[hsl(var(--muted-foreground))]">
          Rp
        </span>
        <input
          id={priceId}
          inputMode="numeric"
          value={price ? price.toLocaleString("id-ID") : ""}
          onChange={(e) => setPrice(Number(e.target.value.replace(/\D/g, "")) || 0)}
          className="h-11 w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--bg))] pl-10 pr-4 text-base tabular-nums outline-none focus:border-[hsl(var(--ring))]"
        />
      </div>

      <fieldset className="mt-4">
        <legend className="text-sm font-medium">Perkiraan berat</legend>
        <div className="mt-1.5 grid grid-cols-5 gap-1.5">
          {WEIGHTS.map((w) => (
            <button
              key={w}
              type="button"
              aria-pressed={kg === w}
              onClick={() => setKg(w)}
              className={cn(
                "h-10 rounded-lg border text-sm tabular-nums transition-colors",
                kg === w
                  ? "border-[hsl(var(--foreground))] bg-[hsl(var(--foreground))] text-[hsl(var(--bg))]"
                  : "border-[hsl(var(--border))] hover:border-[hsl(var(--foreground)/0.4)]"
              )}
            >
              {w.toLocaleString("id-ID")} kg
            </button>
          ))}
        </div>
      </fieldset>

      <dl className="mt-5 divide-y divide-[hsl(var(--border))] border-y border-[hsl(var(--border))]">
        {rows.map(({ zone, est }) => {
          const active = selectedZone === zone.id;
          return (
            <div
              key={zone.id}
              onClick={() => setSelectedZone(zone.id)}
              className={cn(
                "flex items-baseline justify-between gap-3 py-3 cursor-pointer transition-colors rounded-lg px-2 -mx-2",
                active ? "bg-[hsl(var(--surface-2)/0.65)]" : "hover:bg-[hsl(var(--surface-2)/0.35)]"
              )}
            >
              <dt className="text-sm">
                <span className="font-semibold text-[hsl(var(--foreground))]">{zone.shortLabel}</span>
                <span className="text-[hsl(var(--muted-foreground))]"> · {zone.eta}</span>
              </dt>
              <dd className="text-base font-semibold tabular-nums">
                <span key={est.totalRp} className="animate-tick">
                  {formatIDR(est.totalRp)}
                </span>
              </dd>
            </div>
          );
        })}
      </dl>

      <p className="mt-3 text-xs leading-relaxed text-[hsl(var(--muted-foreground))]">
        Sudah termasuk harga barang, jasa titip, dan ongkir. Pembayaran mudah via Transfer BCA/Mandiri
        atau QRIS setelah stok toko dikonfirmasi di WhatsApp.
      </p>

      <Button asChild className="mt-4 w-full" size="lg">
        <Link href={`/request?zone=${selectedZone}`} className="nudge">
          Titip barang ini <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </Button>
    </div>
  );
}
