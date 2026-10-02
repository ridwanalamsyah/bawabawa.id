import { Star } from "lucide-react";
import { erpSafe } from "@/lib/erp-client";

type Review = {
  id: string;
  customer_name: string;
  city: string | null;
  rating: number;
  body: string;
  is_verified: boolean;
};

/**
 * Published customer reviews. Every entry comes from a delivered order
 * (submitted from the tracking page) and is approved by the team before it
 * shows here. Renders nothing until at least one review is published.
 */
export async function Reviews() {
  const res = await erpSafe<Review[]>({
    path: "/reports/testimonials",
    timeoutMs: 4000,
    cache: "force-cache",
    next: { revalidate: 300, tags: ["testimonials"] },
  });
  const items = (res.ok && Array.isArray(res.data) ? res.data : []).slice(0, 6);
  if (items.length === 0) return null;

  return (
    <section className="py-16 sm:py-20 border-t border-[hsl(var(--border))]" aria-labelledby="reviews-title">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 id="reviews-title" className="text-2xl sm:text-3xl">
          Kata yang sudah titip
        </h2>
        <p className="mt-2 text-[15px] text-[hsl(var(--muted-foreground))]">
          Ulasan dari pesanan yang sudah sampai.
        </p>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((r) => (
            <li key={r.id} className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
              <div className="flex gap-0.5" aria-label={`${r.rating} dari 5 bintang`}>
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < r.rating ? "fill-[hsl(var(--warning))] text-[hsl(var(--warning))]" : "text-[hsl(var(--border))]"}`}
                    aria-hidden
                  />
                ))}
              </div>
              <p className="mt-3 text-[15px] leading-relaxed">{r.body}</p>
              <p className="mt-4 text-sm text-[hsl(var(--muted-foreground))]">
                {r.customer_name}
                {r.city ? ` · ${r.city}` : ""}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
