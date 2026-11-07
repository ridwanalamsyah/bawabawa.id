"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Check, Plus, Search, ShoppingCart } from "lucide-react";
import { GlassCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn, formatIDR } from "@/lib/utils";
import { cart, cartCount } from "@/lib/cart";
import { track } from "@/lib/analytics";
import type { CatalogProduct } from "@/app/api/catalog/route";
import { VIRAL_BANDUNG_CATALOG } from "@/lib/viral-bandung-data";
import { delay } from "@/lib/motion";

const IMAGE_BY_ID = new Map(
  VIRAL_BANDUNG_CATALOG.filter((p) => p.imageUrl).map((p) => [p.id, p.imageUrl!])
);
const IMAGE_BY_NAME = new Map(
  VIRAL_BANDUNG_CATALOG.filter((p) => p.imageUrl).map((p) => [p.name.toLowerCase(), p.imageUrl!])
);

function resolveProductImage(product: CatalogProduct): string {
  if (product.imageUrl) return product.imageUrl;
  const byId = IMAGE_BY_ID.get(product.id);
  if (byId) return byId;
  const byName = IMAGE_BY_NAME.get(product.name.toLowerCase());
  if (byName) return byName;
  const cat = (product.category ?? "").toLowerCase();
  if (cat.includes("minuman") || cat.includes("kopi")) return "/images/catalog/kopi-makjay.jpg";
  if (cat.includes("snack") || cat.includes("keripik")) return "/images/catalog/basreng-bandung.jpg";
  if (cat.includes("parfum") || cat.includes("fashion")) return "/images/catalog/in-parfume-fashion.jpg";
  return "/images/catalog/roti-macan.jpg";
}

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
            "rounded-full border px-4 h-10 text-xs font-semibold transition-colors shrink-0",
            onlySamarindaReady
              ? "border-[hsl(var(--foreground))] bg-[hsl(var(--foreground))] text-[hsl(var(--bg))]"
              : "border-[hsl(var(--border))] bg-[hsl(var(--surface))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface-2))]"
          )}
        >
          Ready di Hub Samarinda
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
                "shrink-0 rounded-full border px-4 h-9 text-xs sm:text-sm font-medium transition",
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

      <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
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
  const photoUrl = resolveProductImage(product);

  const add = () => {
    cart.add({
      productId: product.id,
      name: product.name,
      price: product.price,
      weightKg: product.weightKg ?? 0.5,
      imageUrl: photoUrl,
      variant: variant || undefined,
      tripId: product.tripId,
    });
    track("catalog_add");
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <GlassCard className="lift h-full overflow-hidden flex flex-col justify-between p-0">
      <div>
        <div className="relative aspect-[4/3] overflow-hidden bg-[hsl(var(--surface-2))]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoUrl}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
          {product.readyAtSamarinda && (
            <span className="absolute top-3 left-3 rounded-full bg-[hsl(var(--surface)/0.92)] backdrop-blur-sm px-2.5 py-0.5 text-[11px] font-medium text-[hsl(var(--sage-800))]">
              Ready Hub Samarinda
            </span>
          )}
        </div>

        <div className="p-4 pb-2">
          {product.originStore && (
            <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">{product.originStore}</p>
          )}
          <h2 className="mt-0.5 text-sm sm:text-base font-semibold leading-snug text-[hsl(var(--foreground))]">
            {product.name}
          </h2>
          {product.description && (
            <p className="mt-1.5 text-xs text-[hsl(var(--muted-foreground))] line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          )}
        </div>
      </div>

      <div className="p-4 pt-3 mt-1 border-t border-[hsl(var(--border)/0.7)] flex flex-col gap-2.5">
        <div className="flex items-baseline justify-between">
          <p className="text-base font-bold tabular-nums text-[hsl(var(--foreground))]">
            {formatIDR(product.price)}
          </p>
          {product.weightKg != null && (
            <span className="text-xs text-[hsl(var(--muted-foreground))]">~{product.weightKg} kg</span>
          )}
        </div>

        {product.variants.length > 0 && (
          <label className="text-xs">
            <span className="sr-only">Varian {product.name}</span>
            <select
              value={variant}
              onChange={(e) => setVariant(e.target.value)}
              className="h-9 w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--bg))] px-2.5 text-xs"
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
      <div className="mx-auto max-w-3xl glass rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3">
        <ShoppingCart key={count} className="animate-bump h-5 w-5 text-[hsl(var(--sage-700))] shrink-0" aria-hidden />
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-semibold truncate">
            {count} barang · {formatIDR(subtotal)}
          </p>
          <p className="text-[11px] text-[hsl(var(--muted-foreground))] truncate">
            Harga toko Bandung, belum termasuk jasa titip &amp; ongkir
          </p>
        </div>
        <Button asChild variant="primary" size="sm" className="shrink-0">
          <Link href="/request?from=cart">Lanjut Pesan →</Link>
        </Button>
      </div>
    </div>
  );
}
