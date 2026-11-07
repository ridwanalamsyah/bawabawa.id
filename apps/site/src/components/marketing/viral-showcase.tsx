"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Plus, ShoppingBag } from "lucide-react";
import { cart } from "@/lib/cart";
import { cn, formatIDR } from "@/lib/utils";
import type { CatalogProduct } from "@/app/api/catalog/route";
import {
  VIRAL_BANDUNG_CATALOG,
  VIRAL_BANDUNG_STORES,
  type HubSamarindaStockItem,
} from "@/lib/viral-bandung-data";

function resolveProductImage(product: CatalogProduct): string {
  if (product.imageUrl) return product.imageUrl;
  const match = VIRAL_BANDUNG_CATALOG.find(
    (v) => v.id === product.id || v.name.toLowerCase() === product.name.toLowerCase()
  );
  if (match?.imageUrl) return match.imageUrl;
  const cat = (product.category ?? "").toLowerCase();
  if (cat.includes("kopi") || cat.includes("dessert")) return "/images/catalog/kopi-makjay.jpg";
  if (cat.includes("camilan") || cat.includes("pedas") || cat.includes("frozen"))
    return "/images/catalog/basreng-bandung.jpg";
  if (cat.includes("parfum") || cat.includes("fashion"))
    return "/images/catalog/in-parfume-fashion.jpg";
  return "/images/catalog/roti-macan.jpg";
}

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
      imageUrl: resolveProductImage(product),
      variant: product.variants?.[0] || undefined,
      tripId: product.tripId,
    });
    setAddedId(product.id);
    setTimeout(() => setAddedId((prev) => (prev === product.id ? null : prev)), 1400);
  };

  return (
    <section className="py-12 sm:py-16" aria-labelledby="viral-showcase-title">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-16">
        {/* 1. Katalog Populer Bandung */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 id="viral-showcase-title" className="text-2xl sm:text-3xl font-bold">
                Lagi ramai dititip dari Bandung
              </h2>
              <p className="mt-1.5 text-[15px] text-[hsl(var(--muted-foreground))]">
                Harga asli toko Bandung. Pilih langsung atau tulis pesanan manual di formulir.
              </p>
            </div>
            <Link
              href="/katalog"
              className="nudge text-sm font-medium underline underline-offset-4 shrink-0"
            >
              Lihat semua ({products.length}) <ArrowRight className="inline h-4 w-4" aria-hidden />
            </Link>
          </div>

          {/* Filter Kategori */}
          <div className="mt-6 flex gap-2 overflow-x-auto pb-2 -mx-1 px-1" role="tablist">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={activeCategory === cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "shrink-0 rounded-full border px-4 h-9 text-sm transition-colors",
                  activeCategory === cat
                    ? "border-[hsl(var(--sage-700))] bg-[hsl(var(--sage-700))] text-white"
                    : "border-[hsl(var(--border))] bg-[hsl(var(--surface))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface-2))]"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grid Produk dengan Foto Asli */}
          <ul className="mt-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
            {visibleProducts.map((p) => {
              const isAdded = addedId === p.id;
              const imgSrc = resolveProductImage(p);
              return (
                <li
                  key={p.id}
                  className="lift group rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] overflow-hidden flex flex-col"
                >
                  <div className="relative aspect-[4/3] bg-[hsl(var(--surface-2))] overflow-hidden">
                    {imgSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imgSrc}
                        alt={p.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full grid place-items-center">
                        <ShoppingBag className="h-7 w-7 text-[hsl(var(--muted-foreground))]" />
                      </div>
                    )}
                    {p.readyAtSamarinda && (
                      <span className="absolute left-2.5 top-2.5 rounded-full bg-[hsl(var(--surface)/0.92)] backdrop-blur-sm px-2.5 py-0.5 text-[11px] font-medium text-[hsl(var(--sage-800))]">
                        Ready Samarinda
                      </span>
                    )}
                  </div>

                  <div className="p-3.5 sm:p-4 flex flex-col flex-1">
                    {p.originStore && (
                      <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">
                        {p.originStore}
                      </p>
                    )}
                    <h3 className="mt-1 text-sm sm:text-[15px] font-semibold leading-snug line-clamp-2">
                      {p.name}
                    </h3>

                    <div className="mt-auto pt-3 flex items-center justify-between gap-2">
                      <span className="text-sm sm:text-[15px] font-semibold tabular-nums">
                        {formatIDR(p.price)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAddToCart(p)}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors",
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
                </li>
              );
            })}
          </ul>
        </div>

        {/* 2. Editorial Split: Toko Langganan Bandung & Stok Ready Hub Samarinda */}
        <div className="border-t border-[hsl(var(--border))] pt-14 grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7">
            <div className="flex items-baseline justify-between gap-4">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold">Toko langganan di Bandung</h3>
                <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                  Klik toko untuk langsung menitip menu spesifik dari outlet terkait.
                </p>
              </div>
              <Link
                href="/request"
                className="text-sm font-medium underline underline-offset-4 shrink-0"
              >
                Toko lain →
              </Link>
            </div>

            <ul className="mt-5 divide-y divide-[hsl(var(--border))] border-y border-[hsl(var(--border))]">
              {VIRAL_BANDUNG_STORES.slice(0, 6).map((store) => (
                <li key={store.id}>
                  <Link
                    href={`/request?store=${encodeURIComponent(store.name)}&item=${encodeURIComponent(store.signatureItems[0] ?? "")}`}
                    className="group flex items-center justify-between gap-4 py-3.5 hover:bg-[hsl(var(--surface-2)/0.5)] px-2 -mx-2 rounded-lg transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-sm sm:text-[15px] text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--sage-700))]">
                        {store.name}
                        <span className="ml-2 font-normal text-xs text-[hsl(var(--muted-foreground))]">
                          {store.district}
                        </span>
                      </p>
                      <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))] truncate">
                        {store.signatureItems.join(" · ")}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs font-medium text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--foreground))]">
                      {store.queueSchedule} →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {hubStock.length > 0 && (
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-6">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-lg font-semibold">Ready stock di Hub Samarinda</h3>
                  <span className="text-xs font-medium text-[hsl(var(--sage-700))]">
                    Tanpa tunggu kloter
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-[hsl(var(--muted-foreground))]">
                  Khusus area Samarinda, Tenggarong &amp; Balikpapan. Bisa diambil langsung di Hub
                  Samarinda atau diantar kurir lokal hari ini.
                </p>

                <ul className="mt-4 divide-y divide-[hsl(var(--border))] border-y border-[hsl(var(--border))]">
                  {hubStock.map((item) => (
                    <li key={item.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{item.productName}</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">
                          Sisa {item.stockQty} {item.unit} · {item.variant}
                        </p>
                      </div>
                      <Link
                        href={`/request?zone=samarinda_hub&item=${encodeURIComponent(item.productName + " (" + item.variant + ")")}&store=${encodeURIComponent(item.originStore)}&voucher=BAWASMD`}
                        className="shrink-0 text-sm font-semibold tabular-nums text-[hsl(var(--sage-700))] hover:underline"
                      >
                        {formatIDR(item.priceSamarindaRp)} →
                      </Link>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/request?zone=samarinda_hub&voucher=BAWASMD"
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[hsl(var(--sage-700))] underline underline-offset-4"
                >
                  Pesan stok Hub Samarinda <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
