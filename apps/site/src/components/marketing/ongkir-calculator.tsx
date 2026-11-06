"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, MapPin, Plane, Sparkles, Truck } from "lucide-react";
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
  const [zoneId, setZoneId] = useState<DeliveryZoneKey>("jabar_travel");
  const [price, setPrice] = useState(125000);
  const [kg, setKg] = useState(1);
  const [voucher, setVoucher] = useState("");

  const est = computeZoneEstimate({
    zoneId,
    itemSubtotalRp: price,
    weightKg: kg,
    voucherCode: voucher,
    zones,
  });

  return (
    <div className="rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-5 sm:p-6 shadow-[0_14px_40px_rgba(36,32,26,0.07)]">
      <div className="flex items-center justify-between gap-2">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F5DFAD] px-2.5 py-0.5 text-[11px] font-bold text-[#24201A]">
            <Sparkles className="h-3 w-3 text-[#C8524B]" /> Simulasi 3 Jalur Pengiriman
          </span>
          <h2 className="mt-1.5 text-lg sm:text-xl font-bold text-[hsl(var(--foreground))]">
            Hitung Estimasi Jastip &amp; Ongkir
          </h2>
        </div>
      </div>

      {/* Pilihan 3 Jalur Pengiriman */}
      <div className="mt-4 grid grid-cols-3 gap-1.5 rounded-2xl bg-[hsl(var(--bg))] p-1.5 border border-[hsl(var(--border))]">
        <button
          type="button"
          onClick={() => setZoneId("bandung_instant")}
          className={cn(
            "flex flex-col items-center justify-center rounded-xl px-2 py-2 text-center transition-all",
            zoneId === "bandung_instant"
              ? "bg-[hsl(var(--sage-700))] text-white shadow-xs"
              : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          )}
        >
          <span className="text-xs font-bold">🛵 Bandung</span>
          <span className="text-[10px] opacity-85">Instant Hari Ini</span>
        </button>
        <button
          type="button"
          onClick={() => setZoneId("jabar_travel")}
          className={cn(
            "flex flex-col items-center justify-center rounded-xl px-2 py-2 text-center transition-all",
            zoneId === "jabar_travel"
              ? "bg-[hsl(var(--sage-700))] text-white shadow-xs"
              : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          )}
        >
          <span className="text-xs font-bold">🚐 Jabar &amp; JKT</span>
          <span className="text-[10px] opacity-85">Travel Sameday</span>
        </button>
        <button
          type="button"
          onClick={() => setZoneId("samarinda_hub")}
          className={cn(
            "flex flex-col items-center justify-center rounded-xl px-2 py-2 text-center transition-all",
            zoneId === "samarinda_hub"
              ? "bg-[hsl(var(--sage-700))] text-white shadow-xs"
              : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          )}
        >
          <span className="text-xs font-bold">✈️ Samarinda</span>
          <span className="text-[10px] opacity-85">Kloter &amp; Hub</span>
        </button>
      </div>

      {/* Info Jalur Aktif */}
      <div className="mt-3 rounded-2xl bg-[#FCF3E4] border border-[#E6DAC3] p-3 text-xs">
        <div className="flex items-center justify-between gap-2 font-bold text-[#24201A]">
          <span className="inline-flex items-center gap-1.5">
            {zoneId === "bandung_instant" && <MapPin className="h-3.5 w-3.5 text-[hsl(var(--sage-700))]" />}
            {zoneId === "jabar_travel" && <Truck className="h-3.5 w-3.5 text-[#C8524B]" />}
            {zoneId === "samarinda_hub" && <Plane className="h-3.5 w-3.5 text-[hsl(var(--sage-700))]" />}
            {est.zone.label}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-[hsl(var(--muted-foreground))] leading-relaxed">
          <strong>Estimasi tiba:</strong> {est.zone.eta} · Cakupan: {est.zone.cities.slice(0, 4).join(", ")}
          {est.zone.cities.length > 4 ? ", dll." : ""}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor={priceId} className="block text-xs font-semibold text-[hsl(var(--foreground))]">
            Perkiraan harga barang toko
          </label>
          <div className="mt-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[hsl(var(--muted-foreground))]">
              Rp
            </span>
            <input
              id={priceId}
              inputMode="numeric"
              value={price ? price.toLocaleString("id-ID") : ""}
              onChange={(e) => setPrice(Number(e.target.value.replace(/\D/g, "")) || 0)}
              className="h-10 w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--bg))] pl-8 pr-3 text-sm font-semibold tabular-nums outline-none focus:border-[hsl(var(--ring))]"
            />
          </div>
        </div>

        <div>
          <span className="block text-xs font-semibold text-[hsl(var(--foreground))]">
            Perkiraan berat paket
          </span>
          <div className="mt-1 grid grid-cols-5 gap-1">
            {WEIGHTS.map((w) => (
              <button
                key={w}
                type="button"
                aria-pressed={kg === w}
                onClick={() => setKg(w)}
                className={cn(
                  "h-10 rounded-xl border text-xs font-semibold tabular-nums transition-colors",
                  kg === w
                    ? "border-[#24201A] bg-[#24201A] text-[#FCF3E4]"
                    : "border-[hsl(var(--border))] bg-[hsl(var(--bg))] hover:bg-[hsl(var(--surface-2))]"
                )}
              >
                {w}kg
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Rincian Biaya Transparan */}
      <dl className="mt-4 space-y-2 border-y border-[hsl(var(--border))] py-3 text-xs">
        <div className="flex items-center justify-between">
          <dt className="text-[hsl(var(--muted-foreground))]">Harga asli barang di toko Bandung</dt>
          <dd className="font-semibold tabular-nums">{formatIDR(est.itemSubtotalRp)}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-[hsl(var(--muted-foreground))]">
            Jasa titip &amp; antre ({Math.round(est.zone.jastipFeeRate * 100)}%, min. {formatIDR(est.zone.jastipFeeMinRp)})
          </dt>
          <dd className="font-semibold tabular-nums">{formatIDR(est.jastipFeeRp)}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-[hsl(var(--muted-foreground))]">
            Ongkir {est.zone.shortLabel} ({est.billableKg} kg)
          </dt>
          <dd className="font-semibold tabular-nums">{formatIDR(est.shippingRp)}</dd>
        </div>
        {est.discountRp > 0 && (
          <div className="flex items-center justify-between text-[hsl(var(--sage-700))] font-semibold">
            <dt>Potongan Voucher ({voucher.toUpperCase()})</dt>
            <dd className="tabular-nums">-{formatIDR(est.discountRp)}</dd>
          </div>
        )}
        <div className="flex items-baseline justify-between pt-2 border-t border-[hsl(var(--border))]">
          <dt className="text-sm font-bold text-[hsl(var(--foreground))]">Total Estimasi All-In</dt>
          <dd className="text-lg font-extrabold tabular-nums text-[hsl(var(--sage-700))]">
            {formatIDR(est.totalRp)}
          </dd>
        </div>
      </dl>

      <div className="mt-3 flex items-center justify-between gap-2 text-[11px] text-[hsl(var(--muted-foreground))]">
        <span className="inline-flex items-center gap-1">
          <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--sage-700))]" />
          Bayar via Transfer BCA/Mandiri &amp; QRIS
        </span>
        <button
          type="button"
          onClick={() => setVoucher(voucher === "BAWASMD" ? "" : "BAWASMD")}
          className="font-semibold text-[#C8524B] underline underline-offset-2"
        >
          {voucher === "BAWASMD" ? "Hapus kode BAWASMD" : "Pakai kode BAWASMD"}
        </button>
      </div>

      <Button asChild className="mt-4 w-full" size="lg">
        <Link href={`/request?zone=${zoneId}`} className="nudge">
          Titip via {est.zone.shortLabel} <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </Button>
    </div>
  );
}
