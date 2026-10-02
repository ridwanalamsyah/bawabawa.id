"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatIDR } from "@/lib/utils";
import { TIERS, availableTiers, computePricing, recommendTier } from "@/lib/pricing";

const WEIGHTS = [0.5, 1, 2, 5, 10];

/**
 * The hero's right column: a working price estimate instead of a fake
 * dashboard mock-up. Uses the same formula as the order form.
 */
export function OngkirCalculator() {
  const priceId = useId();
  const [price, setPrice] = useState(300000);
  const [kg, setKg] = useState(1);
  const best = recommendTier(kg);
  const rows = availableTiers().map((tier) => ({
    tier,
    pricing: computePricing({ itemsTotal: price, totalKg: kg, tier }),
  }));

  return (
    <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-5 sm:p-6">
      <h2 className="text-lg">Hitung perkiraan biaya</h2>

      <label htmlFor={priceId} className="mt-5 block text-sm font-medium">
        Harga barang
      </label>
      <div className="mt-1.5 relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[hsl(var(--muted-foreground))]">Rp</span>
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
                "h-10 rounded-lg border text-sm tabular-nums",
                kg === w
                  ? "border-[hsl(var(--foreground))] bg-[hsl(var(--foreground))] text-[hsl(var(--bg))]"
                  : "border-[hsl(var(--border))] hover:border-[hsl(var(--foreground)/0.4)]",
              )}
            >
              {w.toLocaleString("id-ID")} kg
            </button>
          ))}
        </div>
      </fieldset>

      <dl className="mt-5 divide-y divide-[hsl(var(--border))] border-y border-[hsl(var(--border))]">
        {rows.map(({ tier, pricing }) => (
          <div key={tier} className="flex items-baseline justify-between gap-3 py-3">
            <dt className="text-sm">
              <span className="font-semibold">{TIERS[tier].label}</span>
              <span className="text-[hsl(var(--muted-foreground))]"> · {TIERS[tier].eta}</span>
              {tier === best && (
                <span className="ml-2 text-xs font-medium text-[hsl(var(--emerald-600))]">lebih hemat</span>
              )}
            </dt>
            <dd className="text-base font-semibold tabular-nums">{formatIDR(pricing.total)}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-xs leading-relaxed text-[hsl(var(--muted-foreground))]">
        Sudah termasuk harga barang, jasa titip 8% (min. Rp20.000) dan ongkir. Harga final dikirim
        tim setelah cek stok — kamu bayar setelah setuju.
      </p>
      <Button asChild className="mt-5 w-full" size="lg">
        <Link href="/request">
          Titip barang ini <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </Button>
    </div>
  );
}
