"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, MapPin, Menu, ShoppingBag, Sparkles, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { cart, cartCount } from "@/lib/cart";
import { cn } from "@/lib/utils";
import { delay } from "@/lib/motion";
import { DEFAULT_LIVE_STATUS, type LiveShopperStatusConfig } from "@/lib/viral-bandung-data";

const NAV = [
  { href: "/katalog", label: "Katalog Viral Bandung" },
  { href: "/request", label: "Titip Barang" },
  { href: "/open-trip", label: "Jadwal & Jalur Kirim" },
  { href: "/lacak", label: "Lacak & Bayar" },
  { href: "/blog", label: "Artikel" },
];

export function MarketingNav({
  liveStatus = DEFAULT_LIVE_STATUS,
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
          ? "backdrop-blur-xl bg-[hsl(var(--surface)/0.95)] border-b border-[hsl(var(--border))] shadow-xs"
          : "bg-[hsl(var(--bg)/0.9)] backdrop-blur-md border-b border-[hsl(var(--border)/0.6)]"
      )}
    >
      {/* Top Live Shopper Status Bar (Editable in Admin -> Pengaturan) */}
      {liveStatus.active && (
        <div className="bg-[#24201A] text-[#FCF3E4] text-xs py-1.5 px-4 border-b border-white/10">
          <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E98881]/20 border border-[#E98881]/40 px-2 py-0.5 text-[11px] font-semibold text-[#F6B6B1] shrink-0">
                <span className="h-1.5 w-1.5 rounded-full bg-[#E98881] animate-ping" />
                LIVE BANDUNG
              </span>
              <span className="truncate font-medium text-[#FCF3E4]/95">
                {liveStatus.headline}
              </span>
            </div>
            <div className="hidden lg:flex items-center gap-4 text-[11px] text-[#FCF3E4]/80 shrink-0">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3 text-[#E98881]" />
                {liveStatus.currentLocation}
              </span>
              <span className="text-white/30">•</span>
              <span className="inline-flex items-center gap-1 text-[#F5DFAD] font-medium">
                <Sparkles className="h-3 w-3 text-[#E98881]" />
                {liveStatus.hubSamarindaStatus}
              </span>
            </div>
          </div>
        </div>
      )}

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
                  "relative rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors",
                  active
                    ? "text-[#24201A]"
                    : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                )}
              >
                {active && (
                  <span className="absolute inset-0 rounded-full bg-[#F5DFAD] border border-[#E6DAC3] -z-10" />
                )}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href={count > 0 ? "/request?from=cart" : "/katalog"}
            className="relative inline-flex h-10 items-center gap-1.5 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-3.5 text-xs font-semibold text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface-2))] transition-colors"
            aria-label="Keranjang Titipan"
          >
            <ShoppingBag className="h-4 w-4 text-[hsl(var(--sage-700))]" />
            <span className="hidden sm:inline">Titipan</span>
            {count > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#E98881] px-1.5 text-[11px] font-bold text-[#24201A]">
                {count}
              </span>
            )}
          </Link>

          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/request">
              Titip Sekarang
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
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
        <div className="animate-drop md:hidden border-t border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-4 py-4 flex flex-col gap-1 shadow-lg">
          {NAV.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              style={delay(40 + i * 40)}
              className="animate-rise rounded-xl px-4 py-3 text-sm font-semibold hover:bg-[hsl(var(--surface-2))]"
            >
              {item.label}
            </Link>
          ))}
          <div className="pt-3 mt-1 border-t border-[hsl(var(--border))] flex items-center justify-between gap-2">
            <span className="text-xs text-[hsl(var(--muted-foreground))]">
              🛵 Bandung · 🚐 Jabar Travel · ✈️ Samarinda
            </span>
            <Button asChild size="sm">
              <Link href="/request" onClick={() => setOpen(false)}>
                Titip Barang
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
