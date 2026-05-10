"use client";

import { motion } from "framer-motion";
import { ClipboardList, ShoppingBag, PackageCheck, Truck, Home } from "lucide-react";

const STEPS = [
  {
    icon: ClipboardList,
    title: "Buat request",
    desc: "Upload link Shopee/Tokopedia, foto barang, atau ketik manual. Pilih kategori & catatan tambahan.",
  },
  {
    icon: ShoppingBag,
    title: "Personal shopper belanja",
    desc: "Shopper terverifikasi membelikan barang langsung di toko favoritmu di Bandung.",
  },
  {
    icon: PackageCheck,
    title: "Packing aman",
    desc: "Barang dipacking rapi & difoto. Kamu lihat semua dari dashboard secara realtime.",
  },
  {
    icon: Truck,
    title: "Kirim Bandung → Samarinda",
    desc: "Berangkat sesuai jadwal Open Trip. Tracking live, transit, hingga kurir lokal.",
  },
  {
    icon: Home,
    title: "Diterima di rumah",
    desc: "Kurir lokal Samarinda mengantar door-to-door. Konfirmasi & rating shopper.",
  },
];

export function HowItWorks() {
  return (
    <section className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))]">
            Cara kerja
          </p>
          <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight">
            Lima langkah sederhana, dari Pasar Baru sampai depan pintumu di Samarinda.
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ y: 24, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              className="relative"
            >
              <div className="rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--surface)/0.7)] backdrop-blur-md p-6 h-full hover:bg-[hsl(var(--surface))] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-[hsl(var(--sage-100))] dark:bg-[hsl(var(--sage-700)/0.4)] grid place-items-center text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-200))]">
                    <s.icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">
                    Step 0{i + 1}
                  </span>
                </div>
                <p className="mt-4 font-semibold">{s.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
                  {s.desc}
                </p>
              </div>
              {i < STEPS.length - 1 && (
                <div className="hidden lg:block absolute top-12 -right-3 z-10">
                  <div className="h-px w-6 bg-gradient-to-r from-[hsl(var(--sage-300))] to-transparent" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
