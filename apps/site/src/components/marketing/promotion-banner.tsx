"use client";

import { useEffect, useState } from "react";
import { Tag } from "lucide-react";

/**
 * Slim promotion banner above the hero. Only renders if the ERP has
 * vouchers with `is_public = true` AND `is_active = true` AND within
 * their validity window. If the admin hasn't enabled any public
 * voucher, the component renders nothing — no fake placeholder copy.
 */
type Promotion = {
  code: string;
  description: string | null;
  discountType: "percentage" | "fixed";
  discountValue: number;
  maxDiscount: number | null;
  minOrderAmount: number;
  bannerLabel: string | null;
  bannerPriority: number;
  endsAt: string | null;
};

function formatLabel(p: Promotion): string {
  if (p.bannerLabel) return p.bannerLabel;
  if (p.description) return p.description;
  const value =
    p.discountType === "percentage"
      ? `${p.discountValue}%`
      : new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          maximumFractionDigits: 0
        }).format(p.discountValue);
  return `Diskon ${value} dengan kode ${p.code}`;
}

export function PromotionBanner() {
  const [items, setItems] = useState<Promotion[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/analytics/promotions", {
          cache: "no-store"
        });
        if (!res.ok) {
          if (!cancelled) setItems([]);
          return;
        }
        const body = (await res.json()) as { items?: Promotion[] };
        if (!cancelled) setItems(Array.isArray(body.items) ? body.items : []);
      } catch {
        if (!cancelled) setItems([]);
      }
    };
    void load();
    const id = setInterval(() => void load(), 120_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (!items || items.length === 0) return null;

  const primary = items[0];

  return (
    <div className="w-full bg-emerald-600/10 border-b border-emerald-600/20">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2 text-sm text-emerald-900 dark:text-emerald-100">
        <Tag className="h-4 w-4 flex-shrink-0" aria-hidden />
        <p className="flex-1 truncate">
          <span className="font-semibold">{formatLabel(primary)}</span>
          {" — pakai kode "}
          <code className="rounded bg-emerald-600/20 px-1.5 py-0.5 font-mono text-xs font-semibold">
            {primary.code}
          </code>
          {primary.endsAt ? (
            <span className="ml-2 text-xs opacity-80">
              berlaku sampai{" "}
              {new Date(primary.endsAt).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short"
              })}
            </span>
          ) : null}
        </p>
        {items.length > 1 ? (
          <span className="hidden text-xs opacity-70 md:inline">
            +{items.length - 1} promo lain
          </span>
        ) : null}
      </div>
    </div>
  );
}
