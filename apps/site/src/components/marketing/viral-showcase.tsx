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
  ShoppingBag,
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
    return filtered.slice(0, 12);
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
      className="py-16 sm:py-24 border-t border-[hsl(var(--border))] bg-[hsl(var(--bg))]"
      aria-labelledby="viral-showcase-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
        {/* 1. Katalog Barang Viral Bandung */}
        <div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--sage-700))]">
                Kurasi Belanja Bandung 2026
              </span>
              <h2
                id="viral-showcase-heading"
                className="mt-2 font-display text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900"
              >
                Katalog Jastip Bandung Terpopuler
              </h2>
              <p className="mt-2 text-sm text-zinc-600 max-w-2xl leading-relaxed">
                Dari antrean pagi{" "}
                <strong className="font-semibold text-zinc-900">
                  Roti Macan, Tjilaki 9, Roti Merak, Studio Bolen, Seroja Bake
                </strong>{" "}
                hingga{" "}
                <strong className="font-semibold text-zinc-900">
                  Kopi Makjay, In Parfume &amp; Basreng Daun Jeruk
                </strong>
                . Klik <strong className="font-semibold text-zinc-900">+ Titip</strong> untuk memasukkan ke keranjang titipan.
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="self-start md:self-auto">
              <Link href="/katalog">
                Lihat Semua {products.length} Produk <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          {/* Category Filter Pills */}
          <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-2">
            {categories.map((cat) => {
              const active = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "rounded-lg px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-all border",
                    active
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-[hsl(var(--border))] bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-900"
                  )}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Product Grid */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {visibleProducts.map((p) => {
              const isAdded = addedId === p.id;
              return (
                <div
                  key={p.id}
                  className="group rounded-2xl border border-[hsl(var(--border))] bg-white overflow-hidden flex flex-col justify-between transition-all hover:border-zinc-300 hover:shadow-md"
                >
                  <div>
                    <div className="relative h-48 w-full overflow-hidden bg-zinc-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={resolveBandungProductImage(p)}
                        alt={p.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                        {p.category && (
                          <span className="rounded-md bg-zinc-900/85 backdrop-blur-xs px-2.5 py-1 text-[11px] font-semibold text-white">
                            {p.category}
                          </span>
                        )}
                      </div>
                      {p.readyAtSamarinda && (
                        <span className="absolute bottom-2.5 right-2.5 rounded-md bg-[hsl(var(--sage-700))] px-2 py-0.5 text-[10px] font-semibold text-white shadow-xs">
                          Ready Hub Samarinda
                        </span>
                      )}
                    </div>

                    <div className="p-4">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                        <MapPin className="h-3.5 w-3.5 text-[hsl(var(--sage-700))] shrink-0" />
                        <span className="truncate">{p.originStore ?? "Outlet Resmi Bandung"}</span>
                      </div>
                      <h3 className="mt-1 text-base font-bold text-zinc-900 line-clamp-1">
                        {p.name}
                      </h3>
                      <p className="mt-1 text-xs text-zinc-600 line-clamp-2 leading-relaxed">
                        {p.description}
                      </p>
                    </div>
                  </div>

                  <div className="px-4 pb-4 pt-3 border-t border-[hsl(var(--border))] flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[11px] text-zinc-500 block">Harga Toko</span>
                      <span className="text-sm font-bold text-zinc-900 tabular-nums">
                        {formatIDR(p.price)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddToCart(p)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors",
                        isAdded
                          ? "bg-[hsl(var(--sage-100))] text-[hsl(var(--sage-800))]"
                          : "bg-[hsl(var(--sage-700))] text-white hover:bg-[hsl(var(--sage-800))]"
                      )}
                    >
                      {isAdded ? (
                        <>
                          <Check className="h-3.5 w-3.5" /> Ditambahkan
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

        {/* 2. Direktori Toko Bandung & Jadwal Antre */}
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-white p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--sage-700))]">
                Rute Belanja Harian
              </span>
              <h3 className="mt-1 font-display text-xl sm:text-2xl font-bold text-zinc-900">
                Toko Langganan di Bandung &amp; Jam Kloter Antrean
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-zinc-600">
                Klik salah satu toko di bawah untuk langsung menitip menu spesifik dari outlet tersebut.
              </p>
            </div>
            <Link
              href="/request"
              className="text-xs font-semibold text-[hsl(var(--sage-700))] hover:underline shrink-0"
            >
              Titip Toko Bandung Lainnya →
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {VIRAL_BANDUNG_STORES.map((store) => (
              <Link
                key={store.id}
                href={`/request?store=${encodeURIComponent(store.name)}&item=${encodeURIComponent(store.signatureItems[0] ?? "")}`}
                className="group rounded-xl border border-[hsl(var(--border))] bg-zinc-50/60 p-4 hover:bg-white hover:border-zinc-300 hover:shadow-xs transition-all flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-md bg-[hsl(var(--sage-50))] px-2 py-0.5 text-[11px] font-semibold text-[hsl(var(--sage-800))]">
                      {store.badge}
                    </span>
                    <span className="text-xs text-zinc-500 inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-zinc-400" /> {store.district}
                    </span>
                  </div>
                  <h4 className="mt-2.5 text-sm font-bold text-zinc-900 group-hover:text-[hsl(var(--sage-700))]">
                    {store.name}
                  </h4>
                  <p className="mt-1 text-xs text-zinc-600">
                    Favorit: <strong className="font-medium text-zinc-900">{store.signatureItems.join(", ")}</strong>
                  </p>
                </div>
                <div className="pt-2.5 border-t border-[hsl(var(--border))] flex items-center justify-between text-xs text-zinc-500">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-[hsl(var(--sage-700))]" /> {store.queueSchedule}
                  </span>
                  <span className="font-semibold text-[hsl(var(--sage-700))]">Titip →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* 3. Ready Stock di Hub Bawabawa Samarinda */}
        {hubStock.length > 0 && (
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-white p-6 sm:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-md bg-[hsl(var(--sage-50))] px-2.5 py-1 text-xs font-semibold text-[hsl(var(--sage-800))]">
                  <PackageCheck className="h-3.5 w-3.5 text-[hsl(var(--sage-700))]" />
                  Hub Bawabawa Samarinda · Kalimantan Timur
                </div>
                <h3 className="mt-2 font-display text-xl sm:text-2xl font-bold text-zinc-900">
                  Ready Stock di Samarinda — Ambil Hari Ini Tanpa PO
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-zinc-600 max-w-2xl">
                  Dikelola oleh Partner Hub Samarinda. Stok mendarat dari kloter kargo Bandung terbaru dan siap dikirim via kurir lokal atau diambil di Pickup Point Samarinda.
                </p>
              </div>
              <Button asChild size="sm" variant="primary" className="shrink-0">
                <Link href="/request?zone=samarinda_hub&voucher=BAWASMD">
                  Pesan dari Hub Samarinda <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {hubStock.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-[hsl(var(--border))] bg-zinc-50/60 p-4 flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-md bg-[hsl(var(--sage-50))] px-2 py-0.5 text-[11px] font-semibold text-[hsl(var(--sage-800))]">
                        Sisa {item.stockQty} {item.unit}
                      </span>
                      <span className="text-[11px] font-medium text-zinc-500">
                        {item.batchArrivalDate}
                      </span>
                    </div>
                    <h4 className="mt-2.5 text-sm font-bold text-zinc-900">{item.productName}</h4>
                    <p className="mt-0.5 text-xs text-zinc-600">
                      {item.originStore} · {item.variant}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-[hsl(var(--border))] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-zinc-500 block">
                        Harga Ready Samarinda
                      </span>
                      <span className="text-sm font-bold text-zinc-900 tabular-nums">
                        {formatIDR(item.priceSamarindaRp)}
                      </span>
                    </div>
                    <Link
                      href={`/request?zone=samarinda_hub&item=${encodeURIComponent(item.productName + " (" + item.variant + ")")}&store=${encodeURIComponent(item.originStore)}&voucher=BAWASMD`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-[hsl(var(--sage-700))] transition-colors"
                    >
                      <ShoppingBag className="h-3 w-3" /> Ambil
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
