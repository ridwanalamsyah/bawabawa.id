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

export function OngkirCalculator({ zones }: { zones?: ZoneRateConfig[] }) {
  const priceId = useId();
  const activeZones = zones?.length ? zones : DEFAULT_ZONE_RATES;
  const [zoneId, setZoneId] = useState<DeliveryZoneKey>("jabar_travel");
  const [price, setPrice] = useState(125000);
  const [kg, setKg] = useState(1);
  const [useSmdVoucher, setUseSmdVoucher] = useState(false);

  const estimate = computeZoneEstimate({
    zoneId,
    itemSubtotalRp: price,
    weightKg: kg,
    voucherCode: useSmdVoucher ? "BAWASMD" : undefined,
    zones: activeZones,
  });

  return (
    <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-5 sm:p-6 shadow-xs">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-base font-bold text-[hsl(var(--foreground))]">
          Cek Estimasi Biaya
        </h2>
        <span className="text-xs text-[hsl(var(--muted-foreground))]">
          {estimate.zone.eta}
        </span>
      </div>

      {/* 3-Zone Segmented Control */}
      <div
        className="mt-3.5 grid grid-cols-3 gap-1 rounded-xl bg-[hsl(var(--surface-2))] p-1"
        role="tablist"
      >
        {[
          { id: "bandung_instant" as const, label: "Bandung" },
          { id: "jabar_travel" as const, label: "Jabar & JKT" },
          { id: "samarinda_hub" as const, label: "Samarinda" },
        ].map((tab) => {
          const active = zoneId === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setZoneId(tab.id)}
              className={cn(
                "rounded-lg py-2 px-2 text-xs font-semibold transition-all text-center",
                active
                  ? "bg-[hsl(var(--surface))] text-[hsl(var(--foreground))] shadow-2xs"
                  : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Inputs */}
      <div className="mt-4 space-y-3">
        <div>
          <label
            htmlFor={priceId}
            className="block text-xs font-medium text-[hsl(var(--muted-foreground))]"
          >
            Harga barang di toko
          </label>
          <div className="mt-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[hsl(var(--muted-foreground))]">
              Rp
            </span>
            <input
              id={priceId}
              inputMode="numeric"
              value={price ? price.toLocaleString("id-ID") : ""}
              onChange={(e) =>
                setPrice(Number(e.target.value.replace(/\D/g, "")) || 0)
              }
              className="h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--bg))] pl-8 pr-3 text-sm font-semibold tabular-nums text-[hsl(var(--foreground))] outline-none focus:border-[hsl(var(--sage-600))]"
            />
          </div>
        </div>

        <fieldset>
          <legend className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
            Berat paket
          </legend>
          <div className="mt-1 grid grid-cols-5 gap-1.5">
            {WEIGHTS.map((w) => (
              <button
                key={w}
                type="button"
                aria-pressed={kg === w}
                onClick={() => setKg(w)}
                className={cn(
                  "h-9 rounded-lg border text-xs font-semibold tabular-nums transition-colors",
                  kg === w
                    ? "border-[hsl(var(--sage-700))] bg-[hsl(var(--sage-700))] text-white"
                    : "border-[hsl(var(--border))] bg-[hsl(var(--bg))] text-[hsl(var(--foreground))] hover:border-[hsl(var(--sage-500))]"
                )}
              >
                {w} kg
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      {/* Breakdown */}
      <dl className="mt-4 space-y-1.5 border-t border-[hsl(var(--border))] pt-3.5 text-xs">
        <div className="flex justify-between text-[hsl(var(--muted-foreground))]">
          <dt>Harga barang</dt>
          <dd className="font-medium text-[hsl(var(--foreground))] tabular-nums">
            {formatIDR(estimate.itemSubtotalRp)}
          </dd>
        </div>
        <div className="flex justify-between text-[hsl(var(--muted-foreground))]">
          <dt>Jasa titip ({Math.round(estimate.zone.jastipFeeRate * 100)}%)</dt>
          <dd className="font-medium text-[hsl(var(--foreground))] tabular-nums">
            {formatIDR(estimate.jastipFeeRp)}
          </dd>
        </div>
        <div className="flex justify-between text-[hsl(var(--muted-foreground))]">
          <dt>Ongkir ({estimate.billableKg} kg)</dt>
          <dd className="font-medium text-[hsl(var(--foreground))] tabular-nums">
            {formatIDR(estimate.shippingRp)}
          </dd>
        </div>
        {estimate.discountRp > 0 && (
          <div className="flex justify-between text-[hsl(var(--sage-700))] font-semibold">
            <dt>Voucher BAWASMD</dt>
            <dd className="tabular-nums">-{formatIDR(estimate.discountRp)}</dd>
          </div>
        )}
        <div className="flex items-baseline justify-between border-t border-[hsl(var(--border))] pt-2.5">
          <dt className="text-xs font-semibold text-[hsl(var(--foreground))]">
            Total Estimasi
          </dt>
          <dd className="text-lg font-bold text-[hsl(var(--sage-700))] tabular-nums">
            {formatIDR(estimate.totalRp)}
          </dd>
        </div>
      </dl>

      <div className="mt-3 flex items-center justify-between text-[11px] text-[hsl(var(--muted-foreground))]">
        <span>Transfer BCA/Mandiri &amp; QRIS</span>
        <button
          type="button"
          onClick={() => setUseSmdVoucher((v) => !v)}
          className="font-semibold text-[hsl(var(--sage-700))] underline underline-offset-2"
        >
          {useSmdVoucher ? "Hapus BAWASMD" : "Pakai kode BAWASMD"}
        </button>
      </div>

      <Button asChild className="mt-3.5 w-full" size="default">
        <Link
          href={`/request?zone=${zoneId}${useSmdVoucher ? "&voucher=BAWASMD" : ""}`}
        >
          Lanjut Titip Barang <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}
