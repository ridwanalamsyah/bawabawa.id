"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, MessageCircle, Package } from "lucide-react";
import { useEffect, useState } from "react";
import { waLink } from "@/lib/contact";

const HIDDEN_ON = ["/request", "/katalog", "/track", "/lacak", "/login"];

/** Mobile-only bottom bar; the desktop counterpart is WhatsAppFloat. */
export function StickyMobileCTA() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 320);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (HIDDEN_ON.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return null;

  return (
    <>
      {visible && (
        <div
          className="animate-rise fixed bottom-0 inset-x-0 z-30 md:hidden p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
        >
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface)/0.96)] shadow-[0_-12px_40px_-12px_rgba(36,32,26,0.16)] px-3 py-2.5 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[hsl(var(--sage-700))] text-white shrink-0">
              <Package className="h-4 w-4" aria-hidden />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-[hsl(var(--foreground))] truncate">
                🛵 Bandung · 🚐 Travel Jabar · ✈️ Samarinda
              </p>
              <p className="text-[11px] text-[hsl(var(--muted-foreground))] truncate">
                Jastip mulai Rp15rb · Bayar via Transfer/QRIS
              </p>
            </div>
            <a
              href={waLink("Halo Admin Bawabawa, saya mau tanya jastip barang viral dari Bandung.")}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Tanya lewat WhatsApp"
              className="h-10 w-10 grid place-items-center rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--bg))] text-[#1a9e4b]"
            >
              <MessageCircle className="h-5 w-5" aria-hidden />
            </a>
            <Link
              href="/request"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[hsl(var(--sage-700))] text-white px-3.5 py-2.5 text-sm font-semibold shadow-xs active:scale-[0.98] transition-transform"
            >
              Titip
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
