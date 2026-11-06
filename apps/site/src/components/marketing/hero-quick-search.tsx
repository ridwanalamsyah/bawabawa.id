"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, MapPin, Plane, Search, Sparkles, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DeliveryZoneKey } from "@/lib/viral-bandung-data";

const QUICK_PICKS = [
  { label: "🔥 Roti Macan", item: "Roti Macan Bandung (Cranberry Cheese / Double Choco)", store: "Roti Macan Buah Batu" },
  { label: "🍌 Bolu Pisang Tjilaki 9", item: "Bolu Pisang Tjilaki 9 Cihapit", store: "Tjilaki 9 Cihapit" },
  { label: "🦚 Roti Merak", item: "Roti Merak Bandung (Sobek / Sisir Butter)", store: "Roti Merak Sadang Serang" },
  { label: "🍡 Rochi (Roti Mochi)", item: "Rochi Roti Mochi Jl. Riau 61", store: "Rochi Jl. Riau 61" },
  { label: "🥐 Studio Bolen", item: "Studio Bolen Trunojoyo Bandung", store: "Studio Bolen Trunojoyo" },
  { label: "🌿 Seroja Bake", item: "Seroja Bake Pasar Cihapit", store: "Seroja Bake Cihapit" },
  { label: "☕ Kopi Makjay 1L", item: "Kopi Susu Makmur Jaya (Makjay) 1 Liter", store: "Kedai Kopi Makmur Jaya" },
  { label: "✨ In Parfume Bandung", item: "In Parfume Fragrance Bandung 35ml/60ml", store: "In Parfume Banceuy" },
  { label: "🌶️ Basreng Sultan", item: "Basreng Sultan Bandung Daun Jeruk 500gr", store: "Basreng Sultan Bandung" },
];

export function HeroQuickSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [zone, setZone] = useState<DeliveryZoneKey>("jabar_travel");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set("zone", zone);
    if (query.trim()) {
      params.set("item", query.trim());
    }
    router.push(`/request?${params.toString()}`);
  };

  const handleQuickPick = (pick: (typeof QUICK_PICKS)[number]) => {
    const params = new URLSearchParams();
    params.set("zone", zone);
    params.set("item", pick.item);
    params.set("store", pick.store);
    router.push(`/request?${params.toString()}`);
  };

  return (
    <div className="rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-4 sm:p-5 shadow-[0_12px_36px_rgba(36,32,26,0.06)]">
      {/* Pilih Jalur Tujuan */}
      <div className="flex flex-wrap items-center gap-1.5 pb-3 border-b border-[hsl(var(--border))]">
        <span className="text-xs font-bold text-[hsl(var(--muted-foreground))] mr-1">
          Kirim ke mana?
        </span>
        <button
          type="button"
          onClick={() => setZone("bandung_instant")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all",
            zone === "bandung_instant"
              ? "bg-[hsl(var(--sage-700))] text-white shadow-xs"
              : "bg-[hsl(var(--bg))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface-2))]"
          )}
        >
          <MapPin className="h-3 w-3" /> 🛵 Bandung Instant
        </button>
        <button
          type="button"
          onClick={() => setZone("jabar_travel")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all",
            zone === "jabar_travel"
              ? "bg-[hsl(var(--sage-700))] text-white shadow-xs"
              : "bg-[hsl(var(--bg))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface-2))]"
          )}
        >
          <Truck className="h-3 w-3" /> 🚐 Jabar &amp; Jakarta (Travel)
        </button>
        <button
          type="button"
          onClick={() => setZone("samarinda_hub")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all",
            zone === "samarinda_hub"
              ? "bg-[hsl(var(--sage-700))] text-white shadow-xs"
              : "bg-[hsl(var(--bg))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface-2))]"
          )}
        >
          <Plane className="h-3 w-3" /> ✈️ Samarinda &amp; Kaltim (Hub)
        </button>
      </div>

      {/* Input Nama Barang / Toko Viral Bandung */}
      <form onSubmit={handleSubmit} className="mt-3 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ketik barang / toko Bandung (mis. Roti Macan, Tjilaki 9, Makjay, In Parfume)..."
            className="h-12 w-full rounded-2xl border border-[hsl(var(--input))] bg-[hsl(var(--bg))] pl-10 pr-4 text-sm font-medium text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] outline-none focus:border-[hsl(var(--ring))]"
          />
        </div>
        <Button type="submit" size="lg" className="h-12 rounded-2xl px-5 shrink-0">
          Titip Sekarang <ArrowRight className="h-4 w-4" />
        </Button>
      </form>

      {/* Quick-Pick Viral Bandung Chips */}
      <div className="mt-3.5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))] flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-[#E98881]" /> Klik langsung yang lagi viral di Bandung:
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {QUICK_PICKS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => handleQuickPick(p)}
              className="rounded-full border border-[#E6DAC3] bg-[#FCF3E4] px-3 py-1 text-xs font-semibold text-[#24201A] hover:border-[hsl(var(--sage-700))] hover:bg-[#F5DFAD] transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
