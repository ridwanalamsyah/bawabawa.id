"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

const QUICK_CHIPS = [
  { label: "Roti Macan", store: "Roti Macan Buah Batu" },
  { label: "Bolu Pisang Tjilaki 9", store: "Tjilaki 9 Cihapit" },
  { label: "Roti Merak", store: "Roti Merak Sadang Serang" },
  { label: "Rochi Mochi", store: "Rochi Jl. Riau 61" },
  { label: "Studio Bolen", store: "Studio Bolen Dago" },
  { label: "Kopi Makjay", store: "Kopi Makmur Jaya" },
  { label: "In Parfume", store: "In Parfume Banceuy" },
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
      <form onSubmit={handleSubmit} className="space-y-1.5">
        <label
          htmlFor="hero-search-input"
          className="block font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-[#4E5346]"
        >
          Cari Kuliner atau Toko Bandung
        </label>
        <div className="flex flex-col sm:flex-row gap-2 rounded-md border border-[#C9BFA9] bg-[#FFFDF9] p-1.5 focus-within:border-[#4A5828] transition-colors">
          <div className="relative flex-1 flex items-center">
            <Search className="ml-2.5 h-4 w-4 text-[#4E5346] shrink-0" />
            <input
              id="hero-search-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ketik barang atau toko Bandung (mis. Roti Macan)..."
              className="min-h-[40px] w-full bg-transparent pl-2.5 pr-3 text-sm text-[#1C2016] placeholder:text-[#4E5346]/75 outline-none"
            />
          </div>
          <button
            type="submit"
            className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-[#4A5828] px-5 text-xs font-semibold text-[#FAF6EE] hover:bg-[#3A461E] transition-colors shrink-0"
          >
            Titip Barang
          </button>
        </div>
      </form>

      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-[#4E5346] mr-1">
          Populer:
        </span>
        {QUICK_CHIPS.map((c) => (
          <button
            key={c.label}
            type="button"
            onClick={() => handleChipClick(c)}
            className="min-h-[36px] rounded-md border border-[#C9BFA9] bg-[#FFFDF9] px-2.5 py-1 text-xs font-medium text-[#1C2016] hover:border-[#4A5828] hover:bg-[#F2ECDF] transition-colors"
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}
