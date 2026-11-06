"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Check, Plus, Search, ShoppingBag, ShoppingCart, Store } from "lucide-react";
import { GlassCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatIDR } from "@/lib/utils";
import { cart, cartCount } from "@/lib/cart";
import { track } from "@/lib/analytics";
import type { CatalogProduct } from "@/app/api/catalog/route";
import { delay } from "@/lib/motion";

export function CatalogGrid({ products }: { products: CatalogProduct[] }) {
  const categories = useMemo(
    () => [
      "Semua",
      ...Array.from(new Set(products.map((p) => p.category).filter(Boolean) as string[])),
    ],
    [products]
  );
  const [active, setActive] = useState("Semua");
  const [search, setSearch] = useState("");
  const [onlySamarindaReady, setOnlySamarindaReady] = useState(false);

  const visible = useMemo(() => {
    return products.filter((p) => {
      if (active !== "Semua" && p.category !== active) return false;
      if (onlySamarindaReady && !p.readyAtSamarinda) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const hay = `${p.name} ${p.originStore ?? ""} ${p.description ?? ""} ${p.category ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [products, active, search, onlySamarindaReady]);

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari Roti Macan, Tjilaki 9, Rochi, Makjay, In Parfume..."
            className="h-10 w-full rounded-full border border-[hsl(var(--input))] bg-[hsl(var(--surface))] pl-10 pr-4 text-sm outline-none focus:border-[hsl(var(--ring))]"
          />
        </div>
        <button
          type="button"
          onClick={() => setOnlySamarindaReady((s) => !s)}
          className={cn(
            "rounded-full border px-4 h-10 text-xs font-bold transition-colors shrink-0",
            onlySamarindaReady
              ? "border-[#24201A] bg-[#24201A] text-[#FCF3E4]"
              : "border-[hsl(var(--border))] bg-[hsl(var(--surface))] text-[#24201A] hover:bg-[#F5DFAD]"
          )}
        >
          ⚡ Filter Ready Stock di Hub Samarinda
        </button>
      </div>

      {categories.length > 2 && (
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1" role="tablist" aria-label="Kategori">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              role="tab"
              aria-selected={active === c}
              onClick={() => setActive(c)}
              className={cn(
                "shrink-0 rounded-full border px-4 h-9 text-xs sm:text-sm font-semibold transition",
                active === c
                  ? "border-[hsl(var(--sage-700))] bg-[hsl(var(--sage-700))] text-white"
                  : "border-[hsl(var(--border))] bg-[hsl(var(--surface))] hover:bg-[hsl(var(--surface-2))]"
              )}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      <ul className="mt-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {visible.map((p, i) => (
          <li key={p.id} data-reveal style={delay(Math.min(i, 7) * 50)}>
            <ProductCard product={p} />
          </li>
        ))}
      </ul>
    </>
  );
}

function ProductCard({ product }: { product: CatalogProduct }) {
  const [variant, setVariant] = useState(product.variants[0] ?? "");
  const [added, setAdded] = useState(false);

  const add = () => {
    cart.add({
      productId: product.id,
      name: product.name,
      price: product.price,
      weightKg: product.weightKg ?? 0.5,
      imageUrl: product.imageUrl,
      variant: variant || undefined,
      tripId: product.tripId,
    });
    track("catalog_add");
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <GlassCard className="lift h-full overflow-hidden flex flex-col justify-between p-4">
      <div className="flex flex-col gap-2">
        {product.imageUrl && (
          <div className="aspect-4/3 rounded-xl overflow-hidden bg-[hsl(var(--surface-2))] mb-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={product.imageUrl} alt={product.name} loading="lazy" className="h-full w-full object-cover" />
          </div>
        )}

        <div className="flex items-center justify-between gap-2 flex-wrap">
          {product.category && (
            <Badge variant="neutral" className="text-[10px]">
              {product.category}
            </Badge>
          )}
          {product.isViralBadge ? (
            <span className="rounded-full bg-[#F5DFAD] px-2.5 py-0.5 text-[10px] font-bold text-[#24201A]">
              {product.isViralBadge}
            </span>
          ) : product.readyAtSamarinda ? (
            <span className="rounded-full bg-[hsl(var(--sage-100))] px-2.5 py-0.5 text-[10px] font-bold text-[hsl(var(--sage-800))]">
              Ready Hub SMD
            </span>
          ) : null}
        </div>

        <h2 className="text-base font-bold leading-snug text-[#24201A] mt-1">{product.name}</h2>

        {product.originStore && (
          <p className="text-xs font-semibold text-[hsl(var(--sage-700))] flex items-center gap-1">
            <Store className="h-3.5 w-3.5 shrink-0" aria-hidden /> {product.originStore}
          </p>
        )}

        {product.description && (
          <p className="text-xs text-[hsl(var(--muted-foreground))] line-clamp-3 leading-relaxed">
            {product.description}
          </p>
        )}

        {product.shelfLife && (
          <p className="text-[11px] font-medium text-[#9E3B34] bg-[#FBE8E6]/60 rounded-lg px-2 py-1 self-start">
            Ketahanan: {product.shelfLife}
          </p>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-[hsl(var(--border))] flex flex-col gap-2.5">
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] block">
              Harga Toko Bandung
            </span>
            <p className="text-lg font-extrabold tabular-nums text-[#24201A]">
              {formatIDR(product.price)}
            </p>
          </div>
          {product.weightKg != null && (
            <span className="text-xs text-[hsl(var(--muted-foreground))]">± {product.weightKg} kg</span>
          )}
        </div>

        {product.variants.length > 0 && (
          <label className="text-xs">
            <span className="sr-only">Varian {product.name}</span>
            <select
              value={variant}
              onChange={(e) => setVariant(e.target.value)}
              className="h-9 w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--bg))] px-2.5 text-xs font-medium"
            >
              {product.variants.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
        )}

        <Button size="sm" variant={added ? "soft" : "primary"} onClick={add} aria-live="polite" className="w-full">
          {added ? (
            <>
              <Check className="h-4 w-4" aria-hidden /> Masuk Daftar Titipan
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" aria-hidden /> Tambah ke Titipan
            </>
          )}
        </Button>
      </div>
    </GlassCard>
  );
}

export function CartBar() {
  const lines = useSyncExternalStore(cart.subscribe, cart.get, cart.getServer);
  const count = cartCount(lines);
  if (count === 0) return null;
  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  return (
    <div className="fixed bottom-0 inset-x-0 z-40 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
      <div className="mx-auto max-w-3xl rounded-2xl border border-[#24201A] bg-[#24201A] text-[#FCF3E4] shadow-xl px-4 py-3 flex items-center gap-3">
        <ShoppingCart key={count} className="animate-bump h-5 w-5 text-[#F5DFAD] shrink-0" aria-hidden />
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-bold truncate">
            {count} barang dipilih · Harga toko {formatIDR(subtotal)}
          </p>
          <p className="text-[11px] text-[#FCF3E4]/75 truncate">
            Lanjut pilih Jalur Kirim (Bandung / Travel Jabar / Samarinda) &amp; bayar via Transfer/QRIS
          </p>
        </div>
        <Button asChild variant="accent" size="sm" className="shrink-0 font-bold text-[#24201A]">
          <Link href="/request?from=cart">Lanjut Pesan →</Link>
        </Button>
      </div>
    </div>
  );
}
