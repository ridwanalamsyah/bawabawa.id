"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    q: "Berapa lama estimasi pengiriman dari Bandung ke Samarinda?",
    a: "Standar 3–4 hari kerja sejak barang diterima personal shopper. Estimasi spesifik akan ditampilkan saat kamu memilih slot Open Trip pada form request.",
  },
  {
    q: "Bagaimana kalau harga barang berubah saat shopper belanja?",
    a: "Kamu akan dapat notifikasi realtime di dashboard untuk approve/reject perbedaan harga. Tidak ada biaya tersembunyi — semua transparan.",
  },
  {
    q: "Apakah Bawabawa hanya melayani rute Bandung → Samarinda?",
    a: "Saat ini fokus utama kami adalah rute Bandung → Samarinda untuk memberi pengalaman premium yang konsisten. Rute baru akan dibuka bertahap.",
  },
  {
    q: "Apa yang tidak boleh dititipkan?",
    a: "Barang ilegal, mudah meledak/terbakar, hewan hidup, makanan basah dengan masa simpan singkat, dan obat-obatan terkontrol. Detail di S&K.",
  },
  {
    q: "Bagaimana sistem pembayarannya?",
    a: "QRIS, transfer bank, dan e-wallet. Pembayaran masuk ke escrow Bawabawa dan dirilis ke shopper setelah barang diterima customer.",
  },
  {
    q: "Apakah ada garansi barang aman?",
    a: "Ya. Setiap titipan otomatis dijamin sampai Rp 5jt. Untuk barang bernilai lebih, tersedia opsi asuransi tambahan saat checkout.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))] text-center">
          FAQ
        </p>
        <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-center">
          Pertanyaan yang sering ditanyakan
        </h2>
        <div className="mt-10 rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--surface)/0.7)] backdrop-blur divide-y divide-[hsl(var(--border))]">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <button
                key={i}
                onClick={() => setOpen(isOpen ? null : i)}
                className="w-full text-left px-6 py-5 flex items-start gap-4"
              >
                <div className="flex-1">
                  <p className="font-medium">{f.q}</p>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <p className="mt-3 text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
                          {f.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <span
                  className={cn(
                    "h-8 w-8 inline-flex shrink-0 items-center justify-center rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--surface))] transition-transform",
                    isOpen && "rotate-45 bg-[hsl(var(--sage-700))] text-[hsl(var(--primary-foreground))] border-transparent"
                  )}
                >
                  <Plus className="h-4 w-4" />
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
