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
  Sparkles,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cart } from "@/lib/cart";
import { cn, formatIDR } from "@/lib/utils";
import type { CatalogProduct } from "@/app/api/catalog/route";
import {
  VIRAL_BANDUNG_STORES,
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
    setAddedId(product.id);
    setTimeout(() => setAddedId((prev) => (prev === product.id ? null : prev)), 1400);
  };

  return (
    <section className="py-12 sm:py-16" aria-labelledby="viral-showcase-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-14">
        {/* 1. Katalog Kuliner & Barang Viral Bandung */}
        <div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FBE8E6] border border-[#E98881]/40 px-3 py-1 text-xs font-bold text-[#9E3B34]">
                <Sparkles className="h-3.5 w-3.5" /> Kurasi Asli Anak Bandung (Bukan Katalog Kolot!)
              </span>
              <h2
                id="viral-showcase-title"
                className="mt-2.5 font-display text-2xl sm:text-4xl font-bold text-[#24201A]"
              >
                Kuliner, Roti &amp; Barang Viral Bandung
              </h2>
              <p className="mt-1.5 text-sm sm:text-base text-[hsl(var(--muted-foreground))] max-w-2xl">
                Dari antrean subuh <strong>Roti Macan</strong>, <strong>Bolu Pisang Tjilaki 9</strong>,{" "}
                <strong>Roti Merak</strong>, <strong>Rochi</strong>, <strong>Studio Bolen</strong>,{" "}
                <strong>Seroja Bake</strong>, <strong>Kopi Makjay 1L</strong> hingga{" "}
                <strong>In Parfume Banceuy</strong>. Semua bisa kamu titip!
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="self-start md:self-auto">
              <Link href="/katalog">
                Lihat Semua ({products.length} Produk) <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          {/* Filter Kategori */}
          <div className="mt-6 flex gap-2 overflow-x-auto pb-2" role="tablist">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={activeCategory === cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "shrink-0 rounded-full border px-4 py-2 text-xs sm:text-sm font-semibold transition-all",
                  activeCategory === cat
                    ? "border-[hsl(var(--sage-700))] bg-[hsl(var(--sage-700))] text-white shadow-xs"
                    : "border-[hsl(var(--border))] bg-[hsl(var(--surface))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface-2))]"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grid Produk */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {visibleProducts.map((p) => {
              const isAdded = addedId === p.id;
              return (
                <div
                  key={p.id}
                  className="lift rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-4 flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="neutral" className="text-[10px]">
                        {p.category ?? "Viral Bandung"}
                      </Badge>
                      {p.isViralBadge ? (
                        <span className="rounded-full bg-[#F5DFAD] px-2.5 py-0.5 text-[10px] font-bold text-[#24201A]">
                          {p.isViralBadge}
                        </span>
                      ) : p.readyAtSamarinda ? (
                        <span className="rounded-full bg-[hsl(var(--sage-100))] px-2.5 py-0.5 text-[10px] font-bold text-[hsl(var(--sage-800))]">
                          Ready Hub SMD
                        </span>
                      ) : null}
                    </div>

                    <h3 className="mt-2.5 text-base font-bold text-[#24201A] leading-snug">
                      {p.name}
                    </h3>

                    {p.originStore && (
                      <p className="mt-1 text-xs font-semibold text-[hsl(var(--sage-700))] flex items-center gap-1">
                        <Store className="h-3.5 w-3.5 shrink-0" />
                        {p.originStore}
                      </p>
                    )}

                    {p.description && (
                      <p className="mt-1.5 text-xs text-[hsl(var(--muted-foreground))] line-clamp-2 leading-relaxed">
                        {p.description}
                      </p>
                    )}

                    {p.variants?.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1">
                        {p.variants.slice(0, 2).map((v) => (
                          <span
                            key={v}
                            className="rounded-md bg-[hsl(var(--bg))] border border-[hsl(var(--border))] px-2 py-0.5 text-[10px] text-[hsl(var(--muted-foreground))]"
                          >
                            {v}
                          </span>
                        ))}
                        {p.variants.length > 2 && (
                          <span className="text-[10px] text-[hsl(var(--muted-foreground))] self-center">
                            +{p.variants.length - 2} varian
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[hsl(var(--border))] flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                        Harga Toko
                      </p>
                      <p className="text-base font-extrabold tabular-nums text-[#24201A]">
                        {formatIDR(p.price)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleAddToCart(p)}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold transition-colors",
                          isAdded
                            ? "bg-[#F5DFAD] text-[#24201A]"
                            : "bg-[hsl(var(--sage-700))] text-white hover:bg-[hsl(var(--sage-800))]"
                        )}
                      >
                        {isAdded ? (
                          <>
                            <Check className="h-3.5 w-3.5" /> Ditambah
                          </>
                        ) : (
                          <>
                            <Plus className="h-3.5 w-3.5" /> Titip
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Direktori Toko Viral Bandung & Jadwal Antre */}
        <div className="rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--sage-700))]">
                Peta Belanja Tim Bawabawa Bandung
              </span>
              <h3 className="mt-1 font-display text-xl sm:text-2xl font-bold text-[#24201A]">
                Direktori Toko Hits Bandung &amp; Jadwal War Antrean
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-[hsl(var(--muted-foreground))]">
                Tidak menemukan barang di katalog? Klik toko di bawah untuk menitip menu spesifik dari outlet favoritmu.
              </p>
            </div>
            <Link
              href="/request"
              className="text-xs font-bold text-[hsl(var(--sage-700))] underline underline-offset-4 shrink-0"
            >
              Titip Toko Bandung Lainnya →
            </Link>
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {VIRAL_BANDUNG_STORES.map((store) => (
              <Link
                key={store.id}
                href={`/request?store=${encodeURIComponent(store.name)}&item=${encodeURIComponent(store.signatureItems[0] ?? "")}`}
                className="group rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--bg))] p-4 hover:border-[hsl(var(--sage-700))] transition-all flex flex-col justify-between gap-2"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full bg-[#F5DFAD] px-2.5 py-0.5 text-[10px] font-bold text-[#24201A]">
                      {store.badge}
                    </span>
                    <span className="text-[11px] text-[hsl(var(--muted-foreground))] inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-[#E98881]" /> {store.district}
                    </span>
                  </div>
                  <h4 className="mt-2 text-sm font-bold text-[#24201A] group-hover:text-[hsl(var(--sage-700))]">
                    {store.name}
                  </h4>
                  <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                    Menu favorit: <strong className="text-[#24201A]">{store.signatureItems.join(", ")}</strong>
                  </p>
                </div>
                <div className="pt-2 border-t border-[hsl(var(--border)/0.7)] flex items-center justify-between text-[11px] text-[hsl(var(--muted-foreground))]">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3 text-[hsl(var(--sage-700))]" /> {store.queueSchedule}
                  </span>
                  <span className="font-bold text-[hsl(var(--sage-700))]">Titip →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* 3. Ready Stock di Hub Bawabawa Samarinda (Dikelola Partner Samarinda) */}
        {hubStock.length > 0 && (
          <div className="rounded-3xl border-2 border-[#E98881]/50 bg-linear-to-br from-[#FFFDF9] to-[#FBE8E6]/45 p-6 sm:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-[#24201A] px-3 py-1 text-xs font-bold text-[#FCF3E4]">
                  <PackageCheck className="h-3.5 w-3.5 text-[#E98881]" />
                  KHUSUS WARGA SAMARINDA, TENGGARONG &amp; BALIKPAPAN
                </div>
                <h3 className="mt-2.5 font-display text-xl sm:text-2xl font-bold text-[#24201A]">
                  Ready Stock di Hub Bawabawa Samarinda — Bisa Ambil Hari Ini Tanpa PO!
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-[hsl(var(--muted-foreground))] max-w-2xl">
                  Selain ikut kloter PO dari Bandung, Partner Hub Samarinda kami juga menyediakan stok langsung barang-barang hits Bandung yang baru mendarat. Bisa diambil di Pickup Point Samarinda atau dikirim kurir lokal.
                </p>
              </div>
              <Button asChild size="sm" variant="primary" className="shrink-0">
                <Link href="/request?zone=samarinda_hub&voucher=BAWASMD">
                  Pesan dari Hub Samarinda <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {hubStock.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-4 flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-full bg-[hsl(var(--sage-100))] px-2.5 py-0.5 text-[10px] font-bold text-[hsl(var(--sage-800))]">
                        Stok Samarinda: {item.stockQty} {item.unit}
                      </span>
                      <span className="text-[10px] font-semibold text-[#C8524B]">
                        {item.batchArrivalDate}
                      </span>
                    </div>
                    <h4 className="mt-2 text-sm font-bold text-[#24201A]">{item.productName}</h4>
                    <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
                      {item.originStore} · {item.variant}
                    </p>
                  </div>
                  <div className="pt-2.5 border-t border-[hsl(var(--border))] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[hsl(var(--muted-foreground))] block">
                        Harga Ready Samarinda
                      </span>
                      <span className="text-sm font-extrabold text-[#24201A]">
                        {formatIDR(item.priceSamarindaRp)}
                      </span>
                    </div>
                    <Link
                      href={`/request?zone=samarinda_hub&item=${encodeURIComponent(item.productName + " (" + item.variant + ")")}&store=${encodeURIComponent(item.originStore)}&voucher=BAWASMD`}
                      className="inline-flex items-center gap-1 rounded-xl bg-[#24201A] px-3 py-1.5 text-xs font-bold text-[#FCF3E4] hover:bg-[hsl(var(--sage-700))] transition-colors"
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
