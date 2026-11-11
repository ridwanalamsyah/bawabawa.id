"use client";

import { useId, useState } from "react";
import Link from "next/link";
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
    <div className="rounded-lg border border-[#C9BFA9] bg-[#FFFDF9] p-5 sm:p-6 shadow-[0_2px_8px_rgba(28,32,22,0.04)]">
      {/* Receipt Header */}
      <div className="flex items-center justify-between gap-2 border-b border-dashed border-[#C9BFA9] pb-3">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[#4E5346]">
            BAWABAWA.ID · NOTA ESTIMASI
          </p>
          <h2 className="mt-0.5 text-base font-bold text-[#1C2016]">
            Cek Estimasi Biaya
          </h2>
        </div>
        <span className="rounded-sm bg-[#F2ECDF] px-2 py-1 font-mono text-[11px] font-semibold text-[#1C2016]">
          {estimate.zone.eta}
        </span>
      </div>

      {/* 3-Zone Segmented Control */}
      <div
        className="mt-3.5 grid grid-cols-3 gap-1.5 rounded-md bg-[#F2ECDF] p-1"
        role="tablist"
        aria-label="Pilih Jalur Pengiriman"
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
                "min-h-[40px] rounded-md px-2 py-1.5 text-xs font-semibold transition-colors text-center",
                active
                  ? "border-2 border-[#4A5828] bg-[#FFFDF9] text-[#1C2016] font-bold"
                  : "border border-transparent text-[#4E5346] hover:text-[#1C2016]"
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Inputs */}
      <div className="mt-4 space-y-3.5">
        <div>
          <label
            htmlFor={priceId}
            className="block font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-[#4E5346]"
          >
            Harga barang di toko (Rp)
          </label>
          <div className="mt-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs font-semibold text-[#4E5346]">
              Rp
            </span>
            <input
              id={priceId}
              inputMode="numeric"
              value={price ? price.toLocaleString("id-ID") : ""}
              onChange={(e) =>
                setPrice(Number(e.target.value.replace(/\D/g, "")) || 0)
              }
              className="min-h-[42px] w-full rounded-md border border-[#C9BFA9] bg-[#FAF6EE] pl-9 pr-3 font-mono text-sm font-bold tabular-nums text-[#1C2016] outline-none focus:border-[#4A5828]"
            />
          </div>
        </div>

        <fieldset>
          <legend className="font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-[#4E5346]">
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
                  "min-h-[40px] rounded-md border font-mono text-xs font-semibold tabular-nums transition-colors",
                  kg === w
                    ? "border-[#4A5828] bg-[#4A5828] text-[#FAF6EE]"
                    : "border-[#C9BFA9] bg-[#FAF6EE] text-[#1C2016] hover:border-[#4A5828]"
                )}
              >
                {w} kg
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      {/* Thermal Receipt Breakdown */}
      <dl className="mt-4 space-y-2 border-t border-dashed border-[#C9BFA9] pt-3.5 font-mono text-xs">
        <div className="flex justify-between text-[#4E5346]">
          <dt>Belanja Toko Bandung</dt>
          <dd className="font-semibold text-[#1C2016] tabular-nums">
            {formatIDR(estimate.itemSubtotalRp)}
          </dd>
        </div>
        <div className="flex justify-between text-[#4E5346]">
          <dt>Jasa Titip ({Math.round(estimate.zone.jastipFeeRate * 100)}%)</dt>
          <dd className="font-semibold text-[#1C2016] tabular-nums">
            {formatIDR(estimate.jastipFeeRp)}
          </dd>
        </div>
        <div className="flex justify-between text-[#4E5346]">
          <dt>Ongkir ({estimate.billableKg} kg)</dt>
          <dd className="font-semibold text-[#1C2016] tabular-nums">
            {formatIDR(estimate.shippingRp)}
          </dd>
        </div>
        {estimate.discountRp > 0 && (
          <div className="flex justify-between text-[#2F5D3A] font-bold">
            <dt>Voucher BAWASMD</dt>
            <dd className="tabular-nums">-{formatIDR(estimate.discountRp)}</dd>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-dashed border-[#C9BFA9] pt-3">
          <div>
            <dt className="font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-[#1C2016]">
              TOTAL ESTIMASI
            </dt>
            <span className="mt-0.5 inline-block rounded-sm border border-[#4A5828] px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-[#4A5828]">
              ESTIMASI RESMI
            </span>
          </div>
          <dd className="font-mono text-xl font-extrabold text-[#1C2016] tabular-nums">
            {formatIDR(estimate.totalRp)}
          </dd>
        </div>
      </dl>

      <div className="mt-3 flex items-center justify-between text-[11px] text-[#4E5346]">
        <span>Transfer BCA/Mandiri &amp; QRIS</span>
        <button
          type="button"
          onClick={() => setUseSmdVoucher((v) => !v)}
          className="font-mono font-semibold text-[#4A5828] underline underline-offset-2"
        >
          {useSmdVoucher ? "Hapus BAWASMD" : "Pakai kode BAWASMD"}
        </button>
      </div>

      <Link
        href={`/request?zone=${zoneId}${useSmdVoucher ? "&voucher=BAWASMD" : ""}`}
        className="mt-3.5 flex min-h-[44px] w-full items-center justify-center rounded-md bg-[#4A5828] px-5 text-sm font-semibold text-[#FAF6EE] hover:bg-[#3A461E] transition-colors"
      >
        Lanjut Titip Barang
      </Link>
    </div>
  );
}
