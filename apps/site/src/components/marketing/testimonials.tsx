"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Star, Quote, MessageSquare } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";

type Testimonial = {
  id: string;
  customer_name: string;
  city: string | null;
  rating: number;
  body: string;
  avatar_url: string | null;
  is_verified: boolean;
};

type Response = { items: Testimonial[]; source: "erp" | "fallback" };

export function Testimonials() {
  const [items, setItems] = useState<Testimonial[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/analytics/testimonials", {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data = (await res.json()) as Response;
        if (!cancelled) setItems(data.items ?? []);
      } catch {
        if (!cancelled) setItems([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const isLoading = items === null;
  const isEmpty = !isLoading && items?.length === 0;

  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))]">
            Suara customer
          </p>
          <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight">
            {isEmpty
              ? "Jasa titip Bandung → Samarinda yang baru meluncur."
              : "Cerita dari customer kami di Samarinda."}
          </h2>
          {isEmpty && (
            <p className="mt-4 text-sm sm:text-base text-[hsl(var(--muted-foreground))] max-w-xl leading-relaxed">
              Bawabawa.id masih di tahap soft launch — kami belum mempublikasikan review.
              Setelah ada customer yang setuju cerita-nya ditampilkan, review akan muncul di sini.
            </p>
          )}
        </div>

        {isEmpty && (
          <div className="mt-10 rounded-3xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--surface)/0.5)] backdrop-blur p-8 sm:p-10 grid place-items-center text-center max-w-2xl mx-auto">
            <div className="h-12 w-12 rounded-2xl bg-[hsl(var(--sage-100))] dark:bg-[hsl(var(--sage-700)/0.4)] grid place-items-center text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-200))]">
              <MessageSquare className="h-6 w-6" />
            </div>
            <p className="mt-4 text-sm font-medium">Belum ada review yang dipublikasikan.</p>
            <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
              Sudah coba jasa kami? Tinggalkan review — kami akan minta izin sebelum mempublikasikan.
            </p>
          </div>
        )}

        {!isEmpty && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(items ?? []).map((it, i) => (
              <motion.div
                key={it.id}
                initial={{ y: 22, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="relative rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--surface)/0.85)] backdrop-blur p-6 h-full"
              >
                <Quote className="h-6 w-6 text-[hsl(var(--sage-400))]" />
                <p className="mt-4 text-sm leading-relaxed text-[hsl(var(--foreground))]">
                  {it.body}
                </p>
                <div className="mt-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={it.customer_name}
                      src={it.avatar_url ?? undefined}
                      size={40}
                    />
                    <div>
                      <p className="text-sm font-semibold flex items-center gap-1.5">
                        {it.customer_name}
                        {it.is_verified && (
                          <span
                            aria-label="Customer terverifikasi"
                            title="Customer terverifikasi"
                            className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[hsl(var(--emerald-600))] text-white text-[8px]"
                          >
                            ✓
                          </span>
                        )}
                      </p>
                      {it.city && (
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">
                          {it.city}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star
                        key={idx}
                        className={`h-3.5 w-3.5 ${idx < it.rating ? "fill-[hsl(var(--warning))] stroke-[hsl(var(--warning))]" : "stroke-[hsl(var(--muted-foreground))]/40"}`}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
