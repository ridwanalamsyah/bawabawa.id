"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";

const QUICK_CHIPS = [
  { label: "Roti Macan", store: "Roti Macan Buah Batu" },
  { label: "Bolu Pisang Tjilaki 9", store: "Tjilaki 9 Cihapit" },
  { label: "Roti Merak", store: "Roti Merak Sadang Serang" },
  { label: "Rochi Mochi", store: "Rochi Jl. Riau 61" },
  { label: "Studio Bolen", store: "Studio Bolen Dago" },
  { label: "Kopi Makjay", store: "Kopi Makmur Jaya" },
];

export function HeroQuickSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    const params = new URLSearchParams();
    if (trimmed) params.set("item", trimmed);
    router.push(`/request${params.toString() ? `?${params.toString()}` : ""}`);
  }

  function handleChipClick(chip: { label: string; store: string }) {
    const params = new URLSearchParams({
      item: chip.label,
      store: chip.store,
    });
    router.push(`/request?${params.toString()}`);
  }

  return (
    <div className="max-w-xl space-y-3">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row gap-2 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-1.5 shadow-xs focus-within:border-[hsl(var(--sage-600))] transition-colors"
      >
        <div className="relative flex-1 flex items-center">
          <Search className="ml-3 h-4 w-4 text-[hsl(var(--muted-foreground))] shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ketik barang atau toko Bandung (mis. Roti Macan)..."
            aria-label="Nama barang atau toko Bandung"
            className="h-10 w-full bg-transparent pl-2.5 pr-3 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] outline-none"
          />
        </div>
        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[hsl(var(--sage-700))] px-4 text-xs font-semibold text-white hover:bg-[hsl(var(--sage-800))] transition-colors shrink-0"
        >
          <span>Titip Barang</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-[hsl(var(--muted-foreground))] mr-1">
          Populer:
        </span>
        {QUICK_CHIPS.map((c) => (
          <button
            key={c.label}
            type="button"
            onClick={() => handleChipClick(c)}
            className="rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-2.5 py-1 text-xs font-medium text-[hsl(var(--foreground))] hover:border-[hsl(var(--sage-600))] transition-colors"
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}
