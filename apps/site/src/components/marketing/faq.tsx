"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { jsonLd, faqPageSchema } from "@/lib/seo/schema";

// Every answer must match how the business actually operates today (see
// /tentang, /terms, /refund). No claims about guarantees, licences, loyalty
// programmes or payment channels that aren't live.
export const FAQS = [
  {
    q: "Bagaimana cara titip barang?",
    a: "Pilih dari Katalog (harga sudah pasti), atau isi form Titip Barang dengan link/nama barang dan batas harganya. Untuk request, tim kami cek stok & harga asli lalu kirim penawaran final ke WhatsApp — kamu baru bayar setelah setuju.",
  },
  {
    q: "Berapa biayanya?",
    a: "Harga barang + jasa titip 8% dari harga barang (minimal Rp20.000) + ongkir. Ongkir Reguler Rp43.000/kg (dibulatkan ke 0,5 kg); Kargo lewat Open Trip flat Rp200.000 sampai 50 kg — lebih hemat untuk kiriman sekitar 5 kg ke atas. Form kami otomatis memilihkan yang paling hemat.",
  },
  {
    q: "Berapa lama sampai di Samarinda?",
    a: "Reguler 3–4 hari kerja setelah barang dikirim. Kargo mengikuti jadwal Open Trip (sekitar 10 hari kerja); tanggal berangkat terlihat saat kamu memilih trip.",
  },
  {
    q: "Bagaimana kalau harga di toko lebih mahal atau barang habis?",
    a: "Kami tidak membeli di atas batas harga yang kamu isi tanpa persetujuanmu. Kalau barang habis, kami ikuti pilihanmu di form: tanya dulu, ganti varian terdekat, atau batalkan item & refund.",
  },
  {
    q: "Bagaimana cara bayar?",
    a: "Setelah penawaran disetujui (atau langsung setelah checkout katalog), instruksi pembayaran muncul di halaman tracking dan dikirim ke WhatsApp. Kirim bukti bayar lewat tombol yang tersedia; status berubah setelah tim mengonfirmasi.",
  },
  {
    q: "Bagaimana cara melacak pesanan?",
    a: "Setiap pesanan punya link tracking pribadi yang dikirim ke WhatsApp-mu dan bisa dibuka dari perangkat mana pun tanpa login. Kalau kamu login, semua pesanan juga tampil di Dashboard.",
  },
  {
    q: "Bisakah saya membatalkan pesanan?",
    a: "Bisa, langsung dari halaman tracking selama barang belum dibelikan. Setelah itu, hubungi admin lewat WhatsApp. Ketentuan refund lengkap ada di halaman Kebijakan Refund.",
  },
  {
    q: "Apa yang tidak boleh dititipkan?",
    a: "Barang ilegal, mudah meledak/terbakar, hewan hidup, makanan basah dengan masa simpan singkat, dan obat-obatan terkontrol. Detail lengkap di Syarat & Ketentuan.",
  },
  {
    q: "Siapa Bawabawa?",
    a: "Bawabawa adalah layanan jasa titip Bandung → Samarinda yang sedang dalam tahap soft launch dan belum berbadan hukum (pendaftaran sedang diproses). Data kontak & alamatmu hanya dipakai untuk memproses dan mengirim pesanan — lihat Kebijakan Privasi.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="py-20 sm:py-28">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(
          faqPageSchema(FAQS.map((f) => ({ question: f.q, answer: f.a })))
        )}
      />
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))] text-center">
          FAQ
        </p>
        <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-center">
          Pertanyaan yang sering ditanyakan
        </h2>
        <p className="mt-3 text-center text-sm text-[hsl(var(--muted-foreground))]">
          {FAQS.length} pertanyaan paling sering dari customer Bawabawa.
        </p>
        <div className="mt-10 rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--surface)/0.7)] backdrop-blur divide-y divide-[hsl(var(--border))]">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <button
                key={i}
                onClick={() => setOpen(isOpen ? null : i)}
                className="w-full text-left px-6 py-5 flex items-start gap-4 hover:bg-[hsl(var(--surface-2)/0.4)] transition-colors"
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
