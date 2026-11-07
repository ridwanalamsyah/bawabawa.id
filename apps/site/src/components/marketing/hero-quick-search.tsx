"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";
import { track } from "@/lib/analytics";

const POPULAR_PICKS = [
  { label: "Roti Macan", item: "Roti Macan Bandung (Cranberry Cheese)", store: "Roti Macan Buah Batu" },
  { label: "Tjilaki 9", item: "Bolu Pisang Tjilaki 9 Cihapit", store: "Tjilaki 9 Cihapit" },
  { label: "Roti Merak", item: "Roti Merak Bandung (Sobek / Sisir Butter)", store: "Roti Merak Sadang Serang" },
  { label: "Rochi", item: "Rochi Roti Mochi Jl. Riau 61", store: "Rochi Jl. Riau 61" },
  { label: "Studio Bolen", item: "Studio Bolen Trunojoyo Bandung", store: "Studio Bolen Trunojoyo" },
  { label: "Kopi Makjay 1L", item: "Kopi Susu Makmur Jaya (Makjay) 1 Liter", store: "Kedai Kopi Makmur Jaya" },
  { label: "In Parfume", item: "In Parfume Fragrance Bandung 35ml/60ml", store: "In Parfume Banceuy" },
];

export function HeroQuickSearch() {
  const router = useRouter();
  const [value, setValue] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = value.trim();
    track("request_start", { from: "hero_search" });
    if (!v) return router.push("/request");
    const isUrl = /^https?:\/\//i.test(v);
    router.push(`/request?${isUrl ? "link" : "item"}=${encodeURIComponent(v)}`);
  }

  return (
    <div>
      <form
        onSubmit={submit}
        className="relative flex items-center gap-2 rounded-2xl border-2 border-[hsl(var(--sage-700))] bg-[hsl(var(--surface))] p-1.5 pl-4 shadow-[0_10px_30px_-12px_hsl(var(--sage-700)/0.28)]"
      >
        <Search className="h-5 w-5 shrink-0 text-[hsl(var(--sage-700))]" aria-hidden />
        <label htmlFor="hero-search" className="sr-only">
          Nama barang, toko Bandung, atau link
        </label>
        <input
          id="hero-search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoComplete="off"
          placeholder="Ketik barang / toko Bandung (Roti Macan, Tjilaki 9, Makjay) atau tempel link..."
          className="min-w-0 flex-1 bg-transparent py-2.5 text-[15px] outline-none placeholder:text-[hsl(var(--muted-foreground))]"
        />
        <button
          type="submit"
          className="nudge inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[hsl(var(--sage-700))] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[hsl(var(--sage-800))]"
        >
          Titip <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </form>

      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[hsl(var(--muted-foreground))]">
        <span>Populer:</span>
        {POPULAR_PICKS.map((p, idx) => (
          <span key={p.label} className="inline-flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                router.push(
                  `/request?item=${encodeURIComponent(p.item)}&store=${encodeURIComponent(p.store)}`
                )
              }
              className="font-medium text-[hsl(var(--foreground))] underline decoration-[hsl(var(--border))] underline-offset-4 hover:decoration-[hsl(var(--foreground))] transition-colors"
            >
              {p.label}
            </button>
            {idx < POPULAR_PICKS.length - 1 && <span aria-hidden>·</span>}
          </span>
        ))}
      </div>
    </div>
  );
}
