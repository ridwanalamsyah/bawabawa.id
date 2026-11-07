"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ShoppingBag, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { cart, cartCount } from "@/lib/cart";
import { cn } from "@/lib/utils";
import { delay } from "@/lib/motion";
import type { LiveShopperStatusConfig } from "@/lib/viral-bandung-data";

const NAV = [
  { href: "/katalog", label: "Katalog" },
  { href: "/request", label: "Titip Barang" },
  { href: "/open-trip", label: "Open Trip" },
  { href: "/lacak", label: "Lacak Pesanan" },
  { href: "/blog", label: "Artikel" },
];

export function MarketingNav({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  liveStatus,
}: {
  liveStatus?: LiveShopperStatusConfig;
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    const sync = () => setCount(cartCount(cart.get()));
    sync();
    return cart.subscribe(sync);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "backdrop-blur-xl bg-[hsl(var(--bg)/0.92)] border-b border-[hsl(var(--border))]"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto max-w-7xl flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <Logo />
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "text-[hsl(var(--sage-800))]"
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
          {count > 0 && (
            <Link
              href="/request?from=cart"
              className="relative inline-flex h-9 items-center gap-1.5 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-3 text-xs font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface-2))] transition-colors"
              aria-label="Keranjang Titipan"
            >
              <ShoppingBag className="h-3.5 w-3.5 text-[hsl(var(--sage-700))]" />
              <span>{count}</span>
            </Link>
          )}

          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/request">Titip Barang</Link>
          </Button>

          <button
            onClick={() => setOpen((s) => !s)}
            className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--surface))]"
            aria-label="Toggle menu"
          >
            {open ? <X className="animate-spin-in h-5 w-5" /> : <Menu className="animate-spin-in h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="animate-drop md:hidden border-t border-[hsl(var(--border))] bg-[hsl(var(--bg))] px-4 py-4 flex flex-col gap-1">
          {NAV.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              style={delay(40 + i * 40)}
              className="animate-rise rounded-xl px-4 py-3 text-sm hover:bg-[hsl(var(--surface-2))]"
            >
              {item.label}
            </Link>
          ))}
          <div className="pt-2 flex justify-end">
            <Button asChild size="sm">
              <Link href="/request" onClick={() => setOpen(false)}>
                Titip barang
              </Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
