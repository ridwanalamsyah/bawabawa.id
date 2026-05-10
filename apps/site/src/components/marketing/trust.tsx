"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Lock, Headphones, Wallet, BadgeCheck, RefreshCcw } from "lucide-react";

const ITEMS = [
  { icon: ShieldCheck, title: "Garansi barang aman", desc: "Setiap titipan dijamin hingga Rp 5.000.000" },
  { icon: Lock, title: "Pembayaran escrow", desc: "Dana baru dirilis setelah barang diterima" },
  { icon: BadgeCheck, title: "Personal shopper terverifikasi", desc: "Identitas & alamat tervalidasi" },
  { icon: Headphones, title: "Live chat 24/7", desc: "Tim support dari kantor Bandung" },
  { icon: Wallet, title: "Tarif transparan", desc: "Tanpa biaya tersembunyi" },
  { icon: RefreshCcw, title: "Refund jika gagal", desc: "100% dana kembali jika request batal" },
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
