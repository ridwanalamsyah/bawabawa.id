"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Lock, Headphones, Wallet, BadgeCheck, RefreshCcw } from "lucide-react";

// Only promises the operation actually keeps (see /terms and /refund).
const ITEMS = [
  { icon: Wallet, title: "Bayar setelah setuju", desc: "Harga final dikirim dulu, baru kamu bayar" },
  { icon: BadgeCheck, title: "Batas harga darimu", desc: "Lebih mahal dari batas? Kami tanya dulu" },
  { icon: RefreshCcw, title: "Refund kalau habis", desc: "Barang tidak tersedia = dana kembali" },
  { icon: Headphones, title: "Update via WhatsApp", desc: "Setiap perubahan status dikabari" },
  { icon: ShieldCheck, title: "Tarif terbuka", desc: "Jasa 8% (min Rp20rb) + ongkir sesuai berat" },
  { icon: Lock, title: "Data aman", desc: "Nomor & alamat hanya untuk pengiriman" },
];

export function TrustGrid() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {ITEMS.map((it, i) => (
            <motion.div
              key={it.title}
              initial={{ y: 18, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface)/0.6)] backdrop-blur-md p-4 hover:bg-[hsl(var(--surface))] transition-colors"
            >
              <div className="h-9 w-9 rounded-xl bg-[hsl(var(--sage-100))] dark:bg-[hsl(var(--sage-700)/0.4)] grid place-items-center text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-200))]">
                <it.icon className="h-4.5 w-4.5" />
              </div>
              <p className="mt-3 text-sm font-semibold leading-tight">{it.title}</p>
              <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))] leading-snug">{it.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
