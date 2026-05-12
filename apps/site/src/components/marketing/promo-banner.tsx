"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import Link from "next/link";

type Banner = {
  id: string;
  enabled: boolean;
  text: string;
  cta?: { label: string; href: string };
};

const FALLBACK_BANNER: Banner = {
  id: "default-2025",
  enabled: true,
  text: "Diskon Rp 25rb untuk titip pertama — pakai kode WELCOME2025",
  cta: { label: "Klaim sekarang", href: "/request?ref=WELCOME2025" },
};

const STORAGE_KEY = "bb_promo_banner_dismissed";

type BannerState = { banner: Banner; dismissed: boolean };

function readDismissedId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Top promo banner that reads from `/api/cms?tag=promo-banner` (with fallback
 * to a sensible default). Customer dismissal is stored per-banner-id in
 * localStorage so re-enabling a new campaign automatically re-shows it.
 */
export function PromoBanner() {
  const [state, setState] = useState<BannerState | null>(null);

  useEffect(() => {
    let cancelled = false;
    const dismissedId = readDismissedId();
    fetch("/api/cms?tag=promo-banner", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        const fromErp = data?.promoBanner ?? data?.banner ?? null;
        const next: Banner = fromErp?.enabled
          ? {
              id: fromErp.id ?? "erp",
              enabled: true,
              text: fromErp.text,
              cta: fromErp.cta,
            }
          : FALLBACK_BANNER;
        setState({ banner: next, dismissed: dismissedId === next.id });
      })
      .catch(() => {
        if (cancelled) return;
        setState({
          banner: FALLBACK_BANNER,
          dismissed: dismissedId === FALLBACK_BANNER.id,
        });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!state || !state.banner.enabled || state.dismissed) return null;
  const { banner } = state;

  return (
    <div className="relative bg-linear-to-r from-[hsl(var(--sage-700))] via-[hsl(var(--olive-700))] to-[hsl(var(--emerald-600))] text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-3">
        <p className="text-xs sm:text-sm font-medium flex-1 min-w-0">
          <span className="mr-1.5">✨</span>
          <span className="truncate">{banner.text}</span>
          {banner.cta && (
            <Link
              href={banner.cta.href}
              className="ml-2 underline decoration-white/60 underline-offset-2 hover:decoration-white whitespace-nowrap"
            >
              {banner.cta.label}
            </Link>
          )}
        </p>
        <button
          onClick={() => {
            setState((prev) => (prev ? { ...prev, dismissed: true } : prev));
            try {
              localStorage.setItem(STORAGE_KEY, banner.id);
            } catch {
              /* noop */
            }
          }}
          aria-label="Tutup banner promo"
          className="shrink-0 rounded-full p-1 hover:bg-white/10 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
