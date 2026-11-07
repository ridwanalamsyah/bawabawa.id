"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Check, ShoppingBag, ShoppingCart, Store } from "lucide-react";
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
    () => ["Semua", ...Array.from(new Set(products.map((p) => p.category).filter(Boolean) as string[]))],
    [products],
  );
  const [active, setActive] = useState("Semua");
  const visible = active === "Semua" ? products : products.filter((p) => p.category === active);

  return (
    <>
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
                "shrink-0 rounded-full border px-4 h-9 text-sm transition",
                active === c
                  ? "border-[hsl(var(--sage-700))] bg-[hsl(var(--sage-700))] text-white"
                  : "border-[hsl(var(--border))] bg-[hsl(var(--surface))] hover:bg-[hsl(var(--surface-2))]",
              )}
            >
              {c}
            </button>
          ))}
        </div>
      )}
      <ul className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {visible.map((p, i) => (
          <li key={p.id} data-reveal style={delay(Math.min(i, 7) * 60)}>
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
    <GlassCard className="lift h-full overflow-hidden flex flex-col">
      <div className="aspect-square bg-[hsl(var(--surface-2))] grid place-items-center">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt={product.name} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <ShoppingBag className="h-8 w-8 text-[hsl(var(--muted-foreground))]" aria-hidden />
        )}
      </div>
      <div className="p-3 sm:p-4 flex flex-col gap-2 flex-1">
        {product.category && <Badge variant="neutral" className="self-start">{product.category}</Badge>}
        <h2 className="text-sm sm:text-base font-semibold leading-snug">{product.name}</h2>
        {product.originStore && (
          <p className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1">
            <Store className="h-3.5 w-3.5" aria-hidden /> {product.originStore}
          </p>
        )}
        {product.description && (
          <p className="text-xs text-[hsl(var(--muted-foreground))] line-clamp-2">{product.description}</p>
        )}
        <p className="mt-auto text-base font-semibold tabular-nums">{formatIDR(product.price)}</p>
        {product.weightKg != null && (
          <p className="text-[11px] text-[hsl(var(--muted-foreground))]">± {product.weightKg} kg</p>
        )}
        {product.variants.length > 0 && (
          <label className="text-xs">
            <span className="sr-only">Varian {product.name}</span>
            <select
              value={variant}
              onChange={(e) => setVariant(e.target.value)}
              className="mt-1 h-9 w-full rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--surface))] px-2 text-sm"
            >
              {product.variants.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
        )}
        <Button size="sm" variant={added ? "soft" : "primary"} onClick={add} aria-live="polite">
          {added ? (
            <>
              <Check className="h-4 w-4" aria-hidden /> Masuk keranjang
            </>
          ) : (
            "Tambah"
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
    <div className="fixed bottom-0 inset-x-0 z-30 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
      <div className="mx-auto max-w-3xl rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface)/0.95)] shadow-lg px-4 py-3 flex items-center gap-3">
        <ShoppingCart key={count} className="animate-bump h-5 w-5 text-[hsl(var(--sage-700))]" aria-hidden />
        <p className="flex-1 text-sm">
          <strong>{count} barang</strong> · {formatIDR(subtotal)}
        </p>
        <Button asChild variant="primary">
          <Link href="/katalog/checkout">Checkout</Link>
        </Button>
      </div>
    </div>
  );
}
