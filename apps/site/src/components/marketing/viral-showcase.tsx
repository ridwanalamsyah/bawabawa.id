"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Clock,
  MapPin,
  PackageCheck,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cart } from "@/lib/cart";
import { cn, formatIDR } from "@/lib/utils";
import type { CatalogProduct } from "@/app/api/catalog/route";
import {
  VIRAL_BANDUNG_STORES,
  resolveBandungProductImage,
  type HubSamarindaStockItem,
} from "@/lib/viral-bandung-data";

export function ViralShowcase({
  products,
  hubStock,
}: {
  products: CatalogProduct[];
  hubStock: HubSamarindaStockItem[];
}) {
  const categories = useMemo(
    () => [
      "Semua",
      ...Array.from(
        new Set(products.map((p) => p.category).filter(Boolean) as string[])
      ),
    ],
    [products]
  );

  const [activeCategory, setActiveCategory] = useState("Semua");
  const [addedId, setAddedId] = useState<string | null>(null);

  const visibleProducts = useMemo(() => {
    const filtered =
      activeCategory === "Semua"
        ? products
        : products.filter((p) => p.category === activeCategory);
    return filtered.slice(0, 8);
  }, [products, activeCategory]);

  const handleAddToCart = (product: CatalogProduct) => {
    cart.add({
      productId: product.id,
      name: product.name,
      price: product.price,
      weightKg: product.weightKg ?? 0.5,
      imageUrl: product.imageUrl,
      variant: product.variants?.[0] || undefined,
      tripId: product.tripId,
    });
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("bawabawa-cart-updated"));
    }
    setAddedId(product.id);
    setTimeout(() => {
      setAddedId((prev) => (prev === product.id ? null : prev));
    }, 1400);
  };

  return (
    <section
      id="katalog-viral"
      className="py-14 sm:py-20"
      aria-labelledby="viral-showcase-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* 1. Katalog Grid (Visual & Concise) */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2
                id="viral-showcase-heading"
                className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[hsl(var(--foreground))]"
              >
                Katalog Hits Bandung
              </h2>
              <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                Harga asli outlet Bandung. Klik <strong>+ Titip</strong> untuk masuk ke keranjang.
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="self-start sm:self-auto">
              <Link href="/katalog">
                Semua Produk ({products.length}) <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          {/* Category Filter Pills */}
          <div className="mt-5 flex items-center gap-1.5 overflow-x-auto pb-1">
            {categories.map((cat) => {
              const active = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all border",
                    active
                      ? "border-[hsl(var(--sage-700))] bg-[hsl(var(--sage-700))] text-white"
                      : "border-[hsl(var(--border))] bg-[hsl(var(--surface))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                  )}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* 8 Visual Product Cards */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {visibleProducts.map((p) => {
              const isAdded = addedId === p.id;
              const [shortTitle, subtitle] = p.name.split(" — ");
              return (
                <div
                  key={p.id}
                  className="group rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] overflow-hidden flex flex-col justify-between transition-all hover:border-[hsl(var(--sage-600))]"
                >
                  <div>
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-[hsl(var(--surface-2))]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={resolveBandungProductImage(p)}
                        alt={p.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      {p.readyAtSamarinda && (
                        <span className="absolute bottom-2 right-2 rounded-full bg-[hsl(var(--sage-700))] px-2.5 py-0.5 text-[10px] font-semibold text-white">
                          Ready Samarinda
                        </span>
                      )}
                    </div>

                    <div className="p-3.5">
                      <p className="text-[11px] font-medium text-[hsl(var(--muted-foreground))] truncate">
                        {p.originStore ?? p.category}
                      </p>
                      <h3 className="mt-0.5 text-sm font-bold text-[hsl(var(--foreground))] line-clamp-1">
                        {shortTitle}
                      </h3>
                      {subtitle && (
                        <p className="text-xs text-[hsl(var(--muted-foreground))] line-clamp-1">
                          {subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="px-3.5 pb-3.5 pt-2.5 border-t border-[hsl(var(--border))] flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-[hsl(var(--foreground))] tabular-nums">
                      {formatIDR(p.price)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAddToCart(p)}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                        isAdded
                          ? "bg-[hsl(var(--sage-100))] text-[hsl(var(--sage-800))]"
                          : "bg-[hsl(var(--sage-700))] text-white hover:bg-[hsl(var(--sage-800))]"
                      )}
                    >
                      {isAdded ? (
                        <>
                          <Check className="h-3.5 w-3.5" /> Masuk
                        </>
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5" /> Titip
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Compact 2-Column Bento: Toko Langganan Bandung + Ready Stock Hub Samarinda */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left: Toko Langganan Bandung */}
          <div className="lg:col-span-7 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-5 sm:p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display text-lg font-bold text-[hsl(var(--foreground))]">
                  Toko Langganan Bandung
                </h3>
                <Link
                  href="/request"
                  className="text-xs font-semibold text-[hsl(var(--sage-700))] hover:underline"
                >
                  Titip Toko Lain →
                </Link>
              </div>
              <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
                Klik toko untuk langsung menitip menu spesifik sesuai jadwal antrean.
              </p>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {VIRAL_BANDUNG_STORES.slice(0, 6).map((store) => (
                  <Link
                    key={store.id}
                    href={`/request?store=${encodeURIComponent(store.name)}&item=${encodeURIComponent(store.signatureItems[0] ?? "")}`}
                    className="group rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--bg))] px-3.5 py-2.5 hover:border-[hsl(var(--sage-600))] transition-colors flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[hsl(var(--foreground))] truncate group-hover:text-[hsl(var(--sage-700))]">
                        {store.name}
                      </p>
                      <p className="mt-0.5 text-[11px] text-[hsl(var(--muted-foreground))] truncate flex items-center gap-1">
                        <MapPin className="h-3 w-3 shrink-0" /> {store.district}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-[hsl(var(--sage-700))] shrink-0">
                      Titip →
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[hsl(var(--border))] flex items-center justify-between text-xs text-[hsl(var(--muted-foreground))]">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-[hsl(var(--sage-700))]" />
                Belanja kloter pagi (07.30 WIB) &amp; sore (14.00 WIB)
              </span>
              <Link href="/katalog" className="font-semibold text-[hsl(var(--foreground))] hover:underline">
                +3 toko lainnya
              </Link>
            </div>
          </div>

          {/* Right: Ready Stock di Hub Samarinda */}
          <div className="lg:col-span-5 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-5 sm:p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--sage-100))] px-2.5 py-0.5 text-[11px] font-semibold text-[hsl(var(--sage-800))]">
                  <PackageCheck className="h-3.5 w-3.5" /> Hub Samarinda
                </span>
                <span className="text-[11px] font-semibold text-[hsl(var(--sage-700))]">
                  Voucher: BAWASMD
                </span>
              </div>

              <h3 className="mt-2 font-display text-lg font-bold text-[hsl(var(--foreground))]">
                Ready Stock di Samarinda
              </h3>
              <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
                Bisa diambil hari ini di Samarinda tanpa tunggu PO.
              </p>

              <div className="mt-4 divide-y divide-[hsl(var(--border))] border-y border-[hsl(var(--border))]">
                {hubStock.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    className="py-2.5 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[hsl(var(--foreground))] truncate">
                        {item.productName}
                      </p>
                      <p className="text-[11px] text-[hsl(var(--muted-foreground))] truncate">
                        Sisa {item.stockQty} {item.unit} · {formatIDR(item.priceSamarindaRp)}
                      </p>
                    </div>
                    <Link
                      href={`/request?zone=samarinda_hub&item=${encodeURIComponent(item.productName)}&store=${encodeURIComponent(item.originStore)}&voucher=BAWASMD`}
                      className="rounded-full bg-[hsl(var(--sage-700))] px-3 py-1 text-[11px] font-semibold text-white hover:bg-[hsl(var(--sage-800))] shrink-0"
                    >
                      Ambil
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <Button asChild variant="outline" size="sm" className="w-full justify-between">
                <Link href="/request?zone=samarinda_hub&voucher=BAWASMD">
                  <span>Pesan via Hub Samarinda</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
