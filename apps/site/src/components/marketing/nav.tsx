"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowUpRight, ShoppingBag } from "lucide-react";

const navLinks = [
  { href: "/katalog", label: "Katalog Bandung" },
  { href: "/#cara-kerja", label: "Cara Kerja" },
  { href: "/#harga", label: "Tarif & Ongkir" },
  { href: "/lacak", label: "Lacak Resi" },
  { href: "/blog", label: "Jurnal" },
];

export function MarketingNav() {
  const [open, setOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    function readCart() {
      try {
        const raw = localStorage.getItem("bawabawa_cart_v1");
        if (!raw) {
          setCartCount(0);
          return;
        }
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setCartCount(parsed.reduce((acc, item) => acc + (Number(item.qty) || 1), 0));
        }
      } catch {
        setCartCount(0);
      }
    }
    readCart();
    window.addEventListener("storage", readCart);
    window.addEventListener("bawabawa-cart-updated", readCart);
    return () => {
      window.removeEventListener("storage", readCart);
      window.removeEventListener("bawabawa-cart-updated", readCart);
    };
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-[hsl(var(--border))] bg-white/95 backdrop-blur-md">
      {/* Clean Live Bandung Shopper Status Bar */}
      <div className="border-b border-[hsl(var(--border))] bg-zinc-900 text-zinc-200">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-1.5 text-[11px] font-medium sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
            <span className="truncate">
              <strong className="font-semibold text-white">Live Bandung:</strong> Tim belanja sedang antre kloter pagi (Roti Macan, Tjilaki 9, Roti Merak &amp; Studio Bolen)
            </span>
          </div>
          <div className="hidden items-center gap-4 text-zinc-400 md:flex">
            <span>Bandung Instant 2-4 Jam</span>
            <span className="text-zinc-700">•</span>
            <span>Travel Jabar &amp; JKT Same-Day</span>
            <span className="text-zinc-700">•</span>
            <Link
              href="/katalog?samarinda=ready"
              className="font-semibold text-emerald-400 transition-colors hover:text-emerald-300"
            >
              Hub Samarinda (Voucher BAWASMD) →
            </Link>
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--sage-700))] text-sm font-bold text-white">
            b
          </span>
          <span className="text-lg font-bold tracking-tight text-zinc-900">
            bawabawa<span className="text-[hsl(var(--sage-700))]">.id</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => {
            const active =
              link.href === "/katalog"
                ? pathname.startsWith("/katalog")
                : link.href === "/lacak"
                  ? pathname.startsWith("/lacak")
                  : link.href === "/blog"
                    ? pathname.startsWith("/blog")
                    : false;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-zinc-100 text-zinc-900 font-semibold"
                    : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2.5 lg:flex">
          <Link
            href="/request"
            className="inline-flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
          >
            <ShoppingBag className="h-3.5 w-3.5 text-[hsl(var(--sage-700))]" />
            Keranjang Titipan
            {cartCount > 0 && (
              <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[hsl(var(--sage-700))] px-1.5 text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </Link>
          <Link
            href="/request"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[hsl(var(--sage-700))] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[hsl(var(--sage-800))]"
          >
            Titip Sekarang
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <Link
            href="/request"
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[hsl(var(--border))] bg-white text-zinc-900"
            aria-label="Keranjang Titipan"
          >
            <ShoppingBag className="h-4 w-4" />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[hsl(var(--sage-700))] px-1 text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[hsl(var(--border))] bg-white text-zinc-900"
            aria-label={open ? "Tutup menu" : "Buka menu"}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {open && (
        <div className="border-t border-[hsl(var(--border))] bg-white px-4 pb-5 pt-3 lg:hidden">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-2 border-t border-[hsl(var(--border))] pt-4">
            <Link
              href="/request"
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[hsl(var(--sage-700))] px-4 py-2.5 text-sm font-semibold text-white"
            >
              Titip Barang Sekarang
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
