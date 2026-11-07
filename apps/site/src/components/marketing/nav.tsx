"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ShoppingBag } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/katalog", label: "Katalog" },
  { href: "/request", label: "Titip Barang" },
  { href: "/#cara-kerja", label: "Cara Kerja" },
  { href: "/#harga", label: "Tarif" },
  { href: "/lacak", label: "Lacak Pesanan" },
  { href: "/blog", label: "Blog" },
];

export function MarketingNav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "backdrop-blur-xl bg-[hsl(var(--bg)/0.92)] border-b border-[hsl(var(--border))]"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto max-w-6xl flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 group">
          <Logo />
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV.map((item) => {
            const active =
              item.href.startsWith("/#")
                ? false
                : pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "text-[hsl(var(--sage-800))] font-semibold"
                    : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                )}
              >
                {active && (
                  <span className="absolute inset-0 rounded-full bg-[hsl(var(--sage-100))] -z-10" />
                )}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/request"
            className="relative inline-flex h-9 items-center gap-1.5 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-3.5 text-xs font-semibold text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface-2))] transition-colors"
            aria-label="Keranjang Titipan"
          >
            <ShoppingBag className="h-3.5 w-3.5 text-[hsl(var(--sage-700))]" />
            <span className="hidden sm:inline">Keranjang</span>
            {cartCount > 0 && (
              <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[hsl(var(--sage-700))] px-1 text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </Link>

          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/request">Titip Sekarang</Link>
          </Button>

          <button
            onClick={() => setOpen((s) => !s)}
            className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--surface))]"
            aria-label="Toggle menu"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-[hsl(var(--border))] bg-[hsl(var(--bg))] px-4 py-4 flex flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-[hsl(var(--surface-2))]"
            >
              {item.label}
            </Link>
          ))}
          <div className="pt-2">
            <Button asChild size="sm" className="w-full">
              <Link href="/request" onClick={() => setOpen(false)}>
                Titip Barang Sekarang
              </Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
