"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";

const ITEMS = [
  {
    name: "Aulia Putri",
    city: "Samarinda",
    rating: 5,
    text:
      "Beneran kayak punya asisten belanja sendiri di Bandung. Update tiap step ada notifikasi, sampai diantar kurir lokal. Worth it banget.",
  },
  {
    name: "Reza Hidayat",
    city: "Samarinda",
    rating: 5,
    text:
      "Aku request 5 item dari Trans Studio Mall, semua dipacking rapi & ada foto sebelum kirim. Trustworthy, pelayanannya premium tapi harganya wajar.",
  },
  {
    name: "Niken Sari",
    city: "Samarinda",
    rating: 5,
    text:
      "Awalnya skeptis, tapi setelah lihat dashboard tracking-nya — astaga keren banget, mirip apps Traveloka. Makin percaya.",
  },
  {
    name: "Bayu Saputra",
    city: "Samarinda",
    rating: 4,
    text:
      "Sudah 19 kali titip, paling sering snack & sneakers. Belum pernah ada masalah. Personal shopper-nya ramah & responsif.",
  },
];

export function Testimonials() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))]">
            Suara customer
          </p>
          <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight">
            Dipercaya 12.000+ warga Samarinda untuk titipan dari Bandung.
          </h2>
        </div>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {ITEMS.map((it, i) => (
            <motion.div
              key={it.name}
              initial={{ y: 22, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="relative rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--surface)/0.85)] backdrop-blur p-6 h-full"
            >
              <Quote className="h-6 w-6 text-[hsl(var(--sage-400))]" />
              <p className="mt-4 text-sm leading-relaxed text-[hsl(var(--foreground))]">{it.text}</p>
              <div className="mt-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar name={it.name} size={36} />
                  <div>
                    <p className="text-sm font-semibold">{it.name}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{it.city}</p>
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
      </div>
    </section>
  );
}
