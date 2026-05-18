"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { jsonLd, faqPageSchema } from "@/lib/seo/schema";

export const FAQS = [
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
    a: "Saat ini fokus utama kami adalah rute Bandung → Samarinda untuk memberi pengalaman premium yang konsisten. Rute baru (Balikpapan, Banjarmasin, dll) akan dibuka bertahap.",
  },
  {
    q: "Apa yang tidak boleh dititipkan?",
    a: "Barang ilegal, mudah meledak/terbakar, hewan hidup, makanan basah dengan masa simpan singkat, dan obat-obatan terkontrol. Detail lengkap di Syarat & Ketentuan.",
  },
  {
    q: "Bagaimana sistem pembayarannya?",
    a: "Kami menerima QRIS, transfer Virtual Account (BCA, Mandiri, BNI, BRI), e-wallet (GoPay, OVO, ShopeePay, DANA), dan kartu kredit. Pembayaran diproses oleh DOKU — gateway resmi yang terdaftar di OJK — sehingga dana customer tidak pernah masuk rekening pribadi.",
  },
  {
    q: "Apakah ada garansi barang aman?",
    a: "Ya. Setiap titipan otomatis dijamin sampai Rp 5.000.000. Untuk barang bernilai lebih, tersedia opsi asuransi tambahan (premium 2% dari nilai barang) saat checkout.",
  },
  {
    q: "Bagaimana kalau saya batalkan request?",
    a: "Pembatalan sebelum shopper mulai belanja: refund 100%. Setelah shopper belanja: dipotong biaya jasa shopper (Rp 25.000) + selisih harga jika sudah dibeli. Refund masuk ke metode pembayaran asli dalam 1–3 hari kerja.",
  },
  {
    q: "Bagaimana cara tracking pesanan saya?",
    a: "Login ke dashboard untuk lihat 9-step tracking realtime: Request diterima → Shopper assigned → Belanja → Packing → Berangkat Bandung → Transit → Tiba Samarinda → Kurir lokal → Diterima. Update otomatis via email & WhatsApp.",
  },
  {
    q: "Apakah saya bisa request foto barang sebelum dibayar?",
    a: "Bisa! Shopper akan foto barang di toko dan kirim ke chat sebelum bayar. Kamu approve dulu di dashboard, baru shopper bayar. Fitur ini tersedia di paket Premium.",
  },
  {
    q: "Berapa biaya jasa minimum?",
    a: "Minimum Rp 50.000 per request (sudah termasuk jasa shopper + ongkir Bandung → Samarinda untuk barang ≤2 kg). Di atas itu dihitung Rp 30.000/kg + 8% nilai barang sebagai jasa shopper.",
  },
  {
    q: "Apakah personal shopper terpercaya?",
    a: "Semua shopper Bawabawa wajib KYC: foto KTP, alamat tervalidasi, rekening bank atas nama sendiri, dan minimal 3 referensi. Rating shopper ditampilkan publik dan ada sistem suspend otomatis kalau rating drop di bawah 4.5/5.",
  },
  {
    q: "Bisa titip barang dari toko mana saja?",
    a: "Bisa dari semua toko fisik di Bandung (Pasar Baru, Trans Studio Mall, Paris Van Java, dll) dan toko online (Shopee, Tokopedia, Bukalapak, BliBli, Lazada). Kalau toko-nya online, tinggal share link-nya saat request.",
  },
  {
    q: "Bagaimana kalau barang rusak / hilang?",
    a: "Klaim garansi via dashboard atau live chat. Tim kami investigasi 1–2 hari kerja. Kalau valid: 100% refund + ongkir kalau barang hilang, atau penggantian senilai kerusakan kalau rusak. Foto bukti dari kurir & shopper jadi dokumentasi.",
  },
  {
    q: "Apakah ada program loyalty atau referral?",
    a: "Ya. Setiap order kamu dapat 1 point per Rp 10.000. Point bisa ditukar voucher di checkout. Referral: ajak teman pakai kode kamu → mereka dapat diskon 10%, kamu dapat Rp 25.000 saat mereka selesai transaksi pertama.",
  },
  {
    q: "Apakah aman secara hukum & pajak?",
    a: "Bawabawa terdaftar sebagai PT (PT Bawabawa Indonesia), berbadan hukum, dan menyetorkan PPN sesuai aturan DJP. Invoice resmi tersedia di dashboard. Sesuai UU PDP, data customer disimpan terenkripsi dan tidak dijual ke pihak ketiga.",
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
