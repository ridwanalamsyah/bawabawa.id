import type { Metadata } from "next";
import { Handshake, Coins, BarChart3, Share2 } from "lucide-react";
import { WA_NUMBER } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Afiliasi & Reseller — Bawabawa.id",
  description:
    "Program reseller dan afiliasi Bawabawa.id. Bagikan link referral, dapat komisi dari setiap order. Cocok untuk content creator, personal shopper, atau komunitas.",
  alternates: { canonical: "/afiliasi" }
};

// Program afiliasi (sebelumnya halaman "Karier" yang kosong).
// Halaman ini sengaja low-commitment: customer baru bisa daftar dengan
// langkah minimum — beri kode referral, share, customer order pakai kode,
// reseller dapat komisi. Detail tarif ditampilkan tetapi tarif final
// ditentukan admin per kasus karena baru soft launch.

export default function AfiliasiPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
      <p className="text-sm font-medium text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))] font-semibold">
        Afiliasi &amp; Reseller
      </p>
      <h1 className="mt-3 text-4xl sm:text-5xl font-semibold tracking-tight">
        Jadi mitra Bawabawa, dapet komisi dari setiap order
      </h1>
      <p className="mt-4 text-lg text-[hsl(var(--muted-foreground))] leading-relaxed">
        Buat kamu yang punya audiens / komunitas di Samarinda dan sekitarnya:
        bagiin link referral Bawabawa, customer mu order pakai link itu, kamu
        dapat komisi. Tidak perlu stocking barang, tidak perlu modal.
      </p>

      <section className="mt-10 grid sm:grid-cols-2 gap-4">
        <Step
          icon={<Handshake className="h-5 w-5" />}
          title="1. Daftar via WhatsApp"
          body="Kontak admin Bawabawa lewat WA dengan info nama, kota, dan channel kamu (IG / TikTok / komunitas)."
        />
        <Step
          icon={<Share2 className="h-5 w-5" />}
          title="2. Dapat kode referral unik"
          body="Admin generate kode (mis. 'BAWA-MIRA'). Share kode atau link referral di postingan / story / DM."
        />
        <Step
          icon={<Coins className="h-5 w-5" />}
          title="3. Komisi otomatis tercatat"
          body="Pembeli menulis kode kamu saat memesan; admin mencatatnya di pesanan. Komisi ditentukan per kategori barang."
        />
        <Step
          icon={<BarChart3 className="h-5 w-5" />}
          title="4. Pencairan bulanan"
          body="Rekap komisi dikirim admin lewat WhatsApp setiap awal bulan, lalu ditransfer (minimum Rp100.000)."
        />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold tracking-tight">Yang sering ditanyakan</h2>
        <div className="mt-4 space-y-4">
          <Faq
            q="Berapa komisinya?"
            a="Komisi disepakati per kategori — biasanya 3-8% dari nilai order. Detail rate-card akan diinfokan saat onboarding."
          />
          <Faq
            q="Bisa untuk customer di luar Samarinda?"
            a="Bisa, asal rute pengirimannya masuk ke koridor Bawabawa (saat ini Bandung → Samarinda, dengan ekspansi rute lain berikutnya)."
          />
          <Faq
            q="Apakah ada target minimum?"
            a="Tidak ada minimum order. Kalau dalam 6 bulan tidak ada referral aktif, status afiliasi otomatis di-pause (bisa diaktifkan ulang)."
          />
          <Faq
            q="Bagaimana cara tracking order yang pakai kode saya?"
            a="Admin mencatat setiap pesanan yang menyebut kode kamu dan mengirim rekap bulanan berisi kode pesanan, nilai, dan status komisi. Dashboard afiliasi mandiri belum tersedia."
          />
        </div>
      </section>

      <section className="mt-12 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-6 sm:p-8 text-center">
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Status program: <strong>soft launch — limited slot</strong>. Kami
          terima 20 partner pertama untuk fase awal supaya kualitas onboarding
          terjaga.
        </p>
        <div className="mt-4">
          <a
            href={`https://wa.me/${WA_NUMBER}?text=Halo+Bawabawa%2C+saya+mau+daftar+jadi+afiliasi`}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center justify-center rounded-full bg-[hsl(var(--sage-700))] px-6 py-3 text-sm font-semibold text-white hover:bg-[hsl(var(--sage-800))] transition-colors"
          >
            Daftar via WhatsApp
          </a>
        </div>
      </section>
    </article>
  );
}

function Step({
  icon,
  title,
  body
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-5">
      <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[hsl(var(--sage-700))]/10 text-[hsl(var(--sage-700))] dark:bg-[hsl(var(--sage-300))]/15 dark:text-[hsl(var(--sage-300))]">
        {icon}
      </div>
      <h3 className="mt-3 text-base font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">{body}</p>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-5">
      <p className="font-semibold">{q}</p>
      <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">{a}</p>
    </div>
  );
}
