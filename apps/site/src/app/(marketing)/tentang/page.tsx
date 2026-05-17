import type { Metadata } from "next";
import Link from "next/link";
import { Heart, MapPin, Truck, Sprout } from "lucide-react";

export const metadata: Metadata = {
  title: "Tentang Bawabawa.id",
  description:
    "Bawabawa.id adalah jasa titip Bandung → Samarinda. Halaman tentang menceritakan latar belakang, nilai, dan status soft launch kami.",
  alternates: { canonical: "/tentang" }
};

// Halaman tentang yang JUJUR: kami soft launch, belum berbadan hukum,
// belum 12.000 customer. Tujuan halaman ini menggantikan press-kit
// dengan informasi yang lebih relevan untuk customer pertama.

export default function TentangPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
      <p className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))] font-semibold">
        Tentang
      </p>
      <h1 className="mt-3 text-4xl sm:text-5xl font-semibold tracking-tight">
        Bawabawa.id — jastip Bandung ke Samarinda
      </h1>
      <p className="mt-4 text-lg text-[hsl(var(--muted-foreground))] leading-relaxed">
        Kami menghubungkan warga Samarinda dengan brand &amp; toko favorit di
        Bandung lewat layanan jasa titip yang transparan, terjadwal, dan punya
        dashboard tracking yang jelas.
      </p>

      <section className="mt-12 space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Kenapa Bawabawa?</h2>
        <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">
          Kami tinggal di Bandung dan punya pengalaman langsung soal logistik antar
          kota. Banyak teman Samarinda yang minta dititipkan barang — sepatu,
          skincare, fashion, makanan — tapi jastip yang ada seringkali ga jelas
          tracking-nya, tarifnya kondisional, dan komunikasinya cuma lewat DM.
          Kami bikin Bawabawa sebagai versi yang lebih rapi: harga jelas, ada
          dashboard, dan setiap order masuk satu sistem.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold tracking-tight">Status: soft launch</h2>
        <p className="mt-3 text-[hsl(var(--muted-foreground))] leading-relaxed">
          Saat ini Bawabawa.id sedang dalam fase <strong>soft launch</strong>:
        </p>
        <ul className="mt-4 space-y-2 list-disc list-inside text-[hsl(var(--muted-foreground))]">
          <li>
            Kami <strong>belum berbadan hukum</strong>. Pendaftaran PT/CV sedang
            disiapkan.
          </li>
          <li>
            Customer pertama akan kami layani secara personal — admin merespons
            langsung lewat DM Instagram / WhatsApp dan mencatat pesanan ke
            dashboard internal.
          </li>
          <li>
            Pembayaran melalui Midtrans (registered di OJK) sebagai payment
            gateway. Bawabawa sendiri belum punya lisensi finansial.
          </li>
          <li>
            Volume awal kecil — slot Open Trip terbatas. Kami sengaja jaga
            kualitas dulu sebelum scaling.
          </li>
        </ul>
      </section>

      <section className="mt-10 grid sm:grid-cols-2 gap-4">
        <ValueCard
          icon={<MapPin className="h-5 w-5" />}
          title="Lokal & terpersonal"
          body="Founder dan tim ada di Bandung dan Samarinda — kami kenal lapangan, bukan reseller dari kota lain."
        />
        <ValueCard
          icon={<Truck className="h-5 w-5" />}
          title="Logistik transparan"
          body="Setiap order punya nomor, tracking, dan POD. Tidak ada 'paket nyangkut tanpa kabar'."
        />
        <ValueCard
          icon={<Heart className="h-5 w-5" />}
          title="Komunikasi sopan"
          body="Admin balas dalam jam kerja, tidak ghosting. Kami sadar customer pertama investasi kepercayaan ke kami."
        />
        <ValueCard
          icon={<Sprout className="h-5 w-5" />}
          title="Bertumbuh perlahan"
          body="Kami tidak terburu menambah armada / scaling. Fokus dulu di repeat customer yang puas."
        />
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold tracking-tight">Kontak</h2>
        <ul className="mt-3 space-y-2 text-[hsl(var(--muted-foreground))]">
          <li>
            Email umum:{" "}
            <a href="mailto:hello@bawabawa.id" className="text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))]">
              hello@bawabawa.id
            </a>
          </li>
          <li>
            Press / kolaborasi:{" "}
            <a href="mailto:press@bawabawa.id" className="text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))]">
              press@bawabawa.id
            </a>
          </li>
          <li>
            Mau jadi reseller / afiliasi? Lihat{" "}
            <Link href="/afiliasi" className="text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))]">
              halaman Afiliasi
            </Link>
            .
          </li>
        </ul>
      </section>
    </article>
  );
}

function ValueCard({
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
