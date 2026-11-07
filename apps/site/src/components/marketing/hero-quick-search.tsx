"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, MapPin, Plane, Search, Truck } from "lucide-react";
import { track } from "@/lib/analytics";
import type { DeliveryZoneKey } from "@/lib/viral-bandung-data";
import { cn } from "@/lib/utils";

const QUICK_POPULAR_CHIPS = [
  { label: "Roti Macan", store: "Roti Macan Buah Batu" },
  { label: "Bolu Pisang Tjilaki 9", store: "Tjilaki 9 Cihapit" },
  { label: "Roti Merak", store: "Roti Merak Sadang Serang" },
  { label: "Rochi Mochi", store: "Rochi Jl. Riau 61" },
  { label: "Studio Bolen", store: "Studio Bolen Trunojoyo" },
  { label: "Kopi Makjay 1L", store: "Kedai Kopi Makmur Jaya" },
  { label: "In Parfume", store: "In Parfume Banceuy" },
];

export function HeroQuickSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [zone, setZone] = useState<DeliveryZoneKey>("jabar_travel");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    track("request_start", { from: "hero_quick_search", zone });
    const params = new URLSearchParams();
    params.set("zone", zone);
    if (q) params.set("item", q);
    router.push(`/request?${params.toString()}`);
  }

  function handleChipClick(item: string, store: string) {
    track("request_start", { from: "hero_chip", item, zone });
    const params = new URLSearchParams({
      zone,
      item,
      store,
    });
    router.push(`/request?${params.toString()}`);
  }

  return (
    <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--bg))] p-3.5 sm:p-4">
      {/* 1. Pilih Jalur Pengiriman */}
      <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
        <span className="text-[11px] font-semibold text-[hsl(var(--muted-foreground))] mr-1">
          Jalur Kirim:
        </span>
        {[
          { id: "bandung_instant" as const, label: "Bandung Instant", icon: MapPin },
          { id: "jabar_travel" as const, label: "Travel Jabar & JKT", icon: Truck },
          { id: "samarinda_hub" as const, label: "Kloter Samarinda", icon: Plane },
        ].map((z) => {
          const Icon = z.icon;
          const active = zone === z.id;
          return (
            <button
              key={z.id}
              type="button"
              onClick={() => setZone(z.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all",
                active
                  ? "bg-[hsl(var(--sage-700))] text-white shadow-xs"
                  : "bg-white text-[hsl(var(--foreground))] border border-[hsl(var(--border))] hover:bg-[hsl(var(--surface-2))]"
              )}
            >
              <Icon className="h-3 w-3" />
              {z.label}
            </button>
          );
        })}
      </div>

      {/* 2. Input Barang / Toko Bandung */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 rounded-xl border border-[hsl(var(--input))] bg-white p-1.5 pl-3.5 focus-within:border-[hsl(var(--sage-700))]"
      >
        <Search className="h-4 w-4 shrink-0 text-[hsl(var(--muted-foreground))]" aria-hidden />
        <label htmlFor="hero-item-input" className="sr-only">
          Ketik nama makanan, roti, atau barang Bandung yang ingin dititip
        </label>
        <input
          id="hero-item-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
          placeholder="Ketik barang atau toko Bandung (mis. Roti Macan, Tjilaki 9, Makjay)..."
          className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-[hsl(var(--muted-foreground))]"
        />
        <button
          type="submit"
          className="nudge inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[hsl(var(--sage-700))] px-4 py-2 text-xs sm:text-sm font-semibold text-white transition-colors hover:bg-[hsl(var(--sage-800))]"
        >
          Titip Sekarang <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </button>
      </form>

      {/* 3. Quick Chips Produk Viral Bandung */}
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-medium text-[hsl(var(--muted-foreground))]">
          Cepat pilih:
        </span>
        {QUICK_POPULAR_CHIPS.map((c) => (
          <button
            key={c.label}
            type="button"
            onClick={() => handleChipClick(c.label, c.store)}
            className="rounded-md border border-[hsl(var(--border))] bg-white px-2 py-0.5 text-[11px] font-medium text-[hsl(var(--foreground))] hover:border-[hsl(var(--sage-700))] hover:text-[hsl(var(--sage-700))] transition-colors"
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}
