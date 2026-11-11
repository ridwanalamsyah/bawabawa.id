"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ShoppingBag } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/katalog", label: "Katalog" },
  { href: "/#jadwal-kloter", label: "Jadwal Kloter" },
  { href: "/#harga", label: "Tarif" },
  { href: "/lacak", label: "Lacak Pesanan" },
  { href: "/blog", label: "Blog" },
];

export function MarketingNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

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
    <header className="sticky top-0 z-50 w-full border-b border-[#DDD5C4] bg-[#FAF6EE]/95 backdrop-blur-md">
      <div className="mx-auto max-w-[1240px] flex h-[68px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Logo />
        </Link>

        <nav className="hidden md:flex items-center gap-1" aria-label="Navigasi Utama">
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
                  "rounded-md px-3.5 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-[#F2ECDF] text-[#1C2016] font-semibold"
                    : "text-[#4E5346] hover:text-[#1C2016] hover:bg-[#F2ECDF]/60"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2.5">
          <Link
            href="/request"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-md border border-[#C9BFA9] bg-[#FFFDF9] px-3.5 text-xs font-semibold text-[#1C2016] hover:bg-[#F2ECDF] transition-colors"
            aria-label="Keranjang Titipan"
          >
            <ShoppingBag className="h-4 w-4 text-[#4A5828]" />
            <span>Keranjang</span>
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-sm bg-[#F2ECDF] px-1.5 font-mono text-[11px] font-bold text-[#1C2016] tabular-nums">
              {cartCount}
            </span>
          </Link>

          <Link
            href="/request"
            className="hidden sm:inline-flex min-h-[44px] items-center justify-center rounded-md bg-[#4A5828] px-4 text-xs font-semibold text-[#FAF6EE] hover:bg-[#3A461E] transition-colors"
          >
            Titip Sekarang
          </Link>

          <button
            type="button"
            onClick={() => setOpen((s) => !s)}
            aria-expanded={open}
            aria-label={open ? "Tutup menu navigasi" : "Buka menu navigasi"}
            className="md:hidden inline-flex min-h-[44px] items-center gap-1.5 rounded-md border border-[#C9BFA9] bg-[#FFFDF9] px-3 text-xs font-semibold text-[#1C2016]"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            <span>{open ? "Tutup" : "Menu"}</span>
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-[#DDD5C4] bg-[#FAF6EE] px-4 py-4 flex flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-3.5 py-3 text-sm font-semibold text-[#1C2016] hover:bg-[#F2ECDF]"
            >
              {item.label}
            </Link>
          ))}
          <div className="pt-2">
            <Link
              href="/request"
              onClick={() => setOpen(false)}
              className="flex min-h-[44px] w-full items-center justify-center rounded-md bg-[#4A5828] px-4 text-sm font-semibold text-[#FAF6EE] hover:bg-[#3A461E]"
            >
              Titip Sekarang
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
