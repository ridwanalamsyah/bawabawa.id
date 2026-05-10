"use client";

import { useState } from "react";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";

const FILTERS = [
  { v: "all", label: "Semua trip" },
  { v: "available", label: "Slot tersedia" },
  { v: "fullbooked", label: "Fullbooked" },
  { v: "in_transit", label: "Sedang berjalan" },
];

export function TripFilterTabs() {
  const [active, setActive] = useState("all");
  const [q, setQ] = useState("");
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-3">
      <div className="inline-flex items-center gap-1 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-1 text-sm overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f.v}
            onClick={() => setActive(f.v)}
            className={
              "rounded-full px-4 py-1.5 transition-all whitespace-nowrap " +
              (active === f.v
                ? "bg-[hsl(var(--sage-700))] text-[hsl(var(--primary-foreground))] shadow-[0_4px_16px_-6px_hsl(var(--sage-700)/0.55)]"
                : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--surface-2))]")
            }
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="md:ml-auto flex items-center gap-2">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari kode trip / kategori" className="pl-10 w-full md:w-64" />
        </div>
        <button className="inline-flex h-11 items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-4 text-sm hover:bg-[hsl(var(--surface-2))]">
          <Filter className="h-4 w-4" /> Filter
        </button>
      </div>
    </div>
  );
}
