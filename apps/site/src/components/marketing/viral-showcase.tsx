"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, Plus } from "lucide-react";
import { cart } from "@/lib/cart";
import { cn, formatIDR } from "@/lib/utils";
import type { CatalogProduct } from "@/app/api/catalog/route";
import {
  VIRAL_BANDUNG_STORES,
  resolveBandungProductImage,
  type HubSamarindaStockItem,
} from "@/lib/viral-bandung-data";

const STORE_DEPARTURE_TIMES = [
  "07:30 WIB",
  "08:00 WIB",
  "08:30 WIB",
  "09:00 WIB",
  "09:30 WIB",
  "10:00 WIB",
  "11:00 WIB",
  "13:00 WIB",
  "14:00 WIB",
];

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
    <div>
      {/* 1. Borderless Editorial Lookbook: Katalog Hits Bandung */}
      <section
        id="katalog-viral"
        className="py-14 sm:py-20 bg-[#FAF6EE]"
        aria-labelledby="viral-showcase-heading"
      >
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#DDD5C4] pb-6">
            <div>
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[#4E5346]">
                KURASI LANGSUNG DARI OUTLET BANDUNG
              </p>
              <h2
                id="viral-showcase-heading"
                className="mt-1 font-display text-2xl sm:text-4xl font-bold tracking-[-0.025em] text-[#1C2016]"
              >
                Katalog Hits Bandung
              </h2>
            </div>
            <Link
              href="/katalog"
              className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-[#C9BFA9] bg-[#FFFDF9] px-4 text-xs font-semibold text-[#1C2016] hover:border-[#4A5828] hover:bg-[#F2ECDF] transition-colors self-start sm:self-auto"
            >
              Semua Produk ({products.length})
            </Link>
          </div>

          {/* Rectangular Category Filter Tabs */}
          <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-2">
            {categories.map((cat) => {
              const active = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "min-h-[40px] rounded-md px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors border",
                    active
                      ? "border-[#4A5828] bg-[#4A5828] text-[#FAF6EE]"
                      : "border-[#C9BFA9] bg-[#FFFDF9] text-[#4E5346] hover:text-[#1C2016] hover:border-[#4A5828]"
                  )}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* 4-Column Borderless Editorial Lookbook (No outer card borders per R-14) */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
            {visibleProducts.map((p) => {
              const isAdded = addedId === p.id;
              const [shortTitle, subtitle] = p.name.split(/\s[-–—]\s/);
              return (
                <article
                  key={p.id}
                  className="group flex flex-col justify-between"
                >
                  <div>
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md border border-[#DDD5C4] bg-[#F2ECDF]">
                      <img
                        src={resolveBandungProductImage(p)}
                        alt={p.name}
                        width={480}
                        height={360}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                      {p.readyAtSamarinda && (
                        <span className="absolute bottom-2 left-2 rounded-sm bg-[#1C2016]/90 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-[#FAF6EE]">
                          Ready Hub Samarinda
                        </span>
                      )}
                    </div>

                    <div className="pt-3.5">
                      <h3 className="text-[15px] font-bold leading-snug text-[#1C2016]">
                        {shortTitle}
                      </h3>
                      <p className="mt-0.5 text-xs italic text-[#4E5346] line-clamp-1">
                        {p.originStore ?? p.category}
                        {subtitle ? ` · ${subtitle}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3.5 pt-2.5 border-t border-[#DDD5C4] flex items-center justify-between gap-2">
                    <span className="font-mono text-sm font-bold text-[#1C2016] tabular-nums">
                      {formatIDR(p.price)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAddToCart(p)}
                      className={cn(
                        "inline-flex min-h-[40px] items-center gap-1.5 rounded-md border px-3.5 py-1.5 text-xs font-semibold transition-colors",
                        isAdded
                          ? "border-[#2F5D3A] bg-[#2F5D3A] text-[#FAF6EE]"
                          : "border-[#C9BFA9] bg-[#FFFDF9] text-[#1C2016] hover:border-[#4A5828] hover:bg-[#4A5828] hover:text-[#FAF6EE]"
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
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* 2. Swiss Horizontal Timetable Ledger: Jadwal Kloter & Antrean Toko Bandung */}
      <section
        id="jadwal-kloter"
        className="py-14 sm:py-20 border-t border-[#DDD5C4] bg-[#FAF6EE]"
        aria-labelledby="timetable-heading"
      >
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Left Column (4 Cols) */}
            <div className="lg:col-span-4 space-y-3">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[#4E5346]">
                TIMETABLE HARIAN · 9 TITIK ANTREAN
              </p>
              <h2
                id="timetable-heading"
                className="font-display text-2xl sm:text-3xl font-bold tracking-[-0.025em] text-[#1C2016]"
              >
                Jadwal Kloter &amp; Antrean Toko Bandung
              </h2>
              <p className="text-sm leading-relaxed text-[#4E5346]">
                Tim shopper kami berangkat sesuai jam keluar oven dan pembagian kuota antrean pagi di Bandung. Pilih toko untuk langsung menitip menu andalannya.
              </p>
              <div className="pt-2">
                <Link
                  href="/request"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-[#C9BFA9] bg-[#FFFDF9] px-4 text-xs font-semibold text-[#1C2016] hover:border-[#4A5828] hover:bg-[#F2ECDF] transition-colors"
                >
                  Titip Toko Lain di Bandung
                </Link>
              </div>
            </div>

            {/* Right Column (8 Cols): Horizontal Timetable Rows */}
            <div className="lg:col-span-8 divide-y divide-[#DDD5C4] border-y border-[#C9BFA9]">
              {VIRAL_BANDUNG_STORES.map((store, idx) => {
                const timeSlot = STORE_DEPARTURE_TIMES[idx] ?? "10:00 WIB";
                return (
                  <div
                    key={store.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F2ECDF]/50 px-2 transition-colors"
                  >
                    <div className="flex items-baseline gap-4 min-w-0">
                      <span className="font-mono text-xs font-bold text-[#4A5828] tabular-nums shrink-0 w-[76px]">
                        {timeSlot}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#1C2016]">
                          {store.name}{" "}
                          <span className="font-normal text-xs text-[#4E5346]">
                            ({store.district})
                          </span>
                        </p>
                        <p className="mt-0.5 text-xs text-[#4E5346] truncate">
                          {store.signatureItems.slice(0, 2).join(", ")} · {store.queueSchedule}
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/request?store=${encodeURIComponent(store.name)}&item=${encodeURIComponent(store.signatureItems[0] ?? "")}`}
                      className="inline-flex min-h-[40px] items-center justify-center rounded-md border border-[#C9BFA9] bg-[#FFFDF9] px-3.5 text-xs font-semibold text-[#1C2016] hover:border-[#4A5828] hover:bg-[#4A5828] hover:text-[#FAF6EE] transition-colors shrink-0 self-start sm:self-center"
                    >
                      Titip
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Full-Bleed Deep Olive (#1C2016) Spotlight Band: Ready Stock di Hub Samarinda */}
      <section
        id="hub-samarinda"
        className="py-14 sm:py-20 bg-[#1C2016] text-[#FAF6EE]"
        aria-labelledby="hub-samarinda-heading"
      >
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Left Column (4 Cols) */}
            <div className="lg:col-span-4 space-y-3">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[#D8E2C3]">
                PICKUP POINT KALTIM · TANPA PO
              </p>
              <h2
                id="hub-samarinda-heading"
                className="font-display text-2xl sm:text-3xl font-bold tracking-[-0.025em] text-[#FAF6EE]"
              >
                Ready Stock di Hub Samarinda
              </h2>
              <p className="font-mono text-xs font-semibold text-[#D8E2C3]">
                Voucher code: BAWASMD (Potongan Rp15.000)
              </p>
              <p className="text-sm leading-relaxed text-[#D8D3C8]">
                Khusus warga Samarinda, Balikpapan, dan Tenggarong. Stok produk viral Bandung di bawah ini sudah mendarat di Hub Samarinda dan siap diambil atau dikirim kurir lokal hari ini.
              </p>
              <div className="pt-2">
                <Link
                  href="/request?zone=samarinda_hub&voucher=BAWASMD"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-[#D8E2C3]/30 bg-[#4A5828] px-4 text-xs font-semibold text-[#FAF6EE] hover:bg-[#3A461E] transition-colors"
                >
                  Pesan via Hub Samarinda
                </Link>
              </div>
            </div>

            {/* Right Column (8 Cols): 2x2 Numbered Inline Ledger */}
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 border-t border-[#FAF6EE]/15 pt-6 sm:border-t-0 sm:pt-0">
              {hubStock.slice(0, 4).map((item, index) => (
                <div
                  key={item.id}
                  className="border-b border-[#FAF6EE]/15 pb-5 flex items-start justify-between gap-4"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="font-mono text-sm font-bold text-[#D8E2C3] tabular-nums shrink-0">
                      {index + 1}.
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-[#FAF6EE] leading-snug">
                        {item.productName}
                      </h3>
                      <p className="mt-1 text-xs text-[#D8D3C8]">
                        {item.variant} · Sisa {item.stockQty} {item.unit}
                      </p>
                      <p className="mt-1.5 font-mono text-sm font-bold text-[#D8E2C3] tabular-nums">
                        {formatIDR(item.priceSamarindaRp)}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/request?zone=samarinda_hub&item=${encodeURIComponent(item.productName)}&store=${encodeURIComponent(item.originStore)}&voucher=BAWASMD`}
                    className="inline-flex min-h-[40px] items-center justify-center rounded-md border border-[#FAF6EE]/30 px-3 py-1.5 text-xs font-semibold text-[#FAF6EE] hover:bg-[#FAF6EE] hover:text-[#1C2016] transition-colors shrink-0"
                  >
                    Ambil
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
