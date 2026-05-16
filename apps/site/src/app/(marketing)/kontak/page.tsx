import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MessageCircle, Clock, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "Hubungi Kami",
  description:
    "Pusat bantuan Bawabawa.id. Hubungi tim CS via WhatsApp, email, atau form di bawah. Jam operasional Senin–Sabtu 09.00–21.00 WIB.",
  alternates: { canonical: "/kontak" },
};

const WA_NUMBER = process.env.NEXT_PUBLIC_WA_NUMBER ?? "6281234567890";
const SUPPORT_EMAIL = "support@bawabawa.id";

const CHANNELS: Array<{
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  cta: { label: string; href: string };
}> = [
  {
    icon: MessageCircle,
    title: "WhatsApp",
    description: "Cara tercepat untuk pertanyaan order, refund, atau bantuan teknis. Direspon dalam 15 menit pada jam kerja.",
    cta: { label: "Chat WhatsApp", href: `https://wa.me/${WA_NUMBER}` },
  },
  {
    icon: Mail,
    title: "Email Support",
    description: "Untuk pertanyaan kompleks yang butuh attachment (foto bukti, screenshot). Direspon dalam 1 hari kerja.",
    cta: { label: SUPPORT_EMAIL, href: `mailto:${SUPPORT_EMAIL}` },
  },
];

const FAQ_QUICK: Array<{ q: string; a: React.ReactNode }> = [
  {
    q: "Pesanan saya belum sampai, harus bagaimana?",
    a: (
      <>
        Cek status di <Link href="/dashboard/tracking" className="underline decoration-dotted underline-offset-2">/dashboard/tracking</Link> menggunakan
        nomor resi. Jika status &ldquo;in transit&rdquo; sudah &gt;7 hari, hubungi CS dengan
        kode order.
      </>
    ),
  },
  {
    q: "Bagaimana cara meminta refund?",
    a: (
      <>
        Lihat <Link href="/refund" className="underline decoration-dotted underline-offset-2">Kebijakan Refund</Link>. Pembatalan
        sebelum personal shopper belanja → 100% refund otomatis dari{" "}
        <Link href="/dashboard/orders" className="underline decoration-dotted underline-offset-2">/dashboard/orders</Link>.
      </>
    ),
  },
  {
    q: "Apakah bisa titip dari kota selain Bandung?",
    a: (
      <>
        Saat ini Bawabawa.id melayani rute Bandung → Samarinda. Ekspansi rute akan
        diumumkan di Instagram & blog kami.
      </>
    ),
  },
];

export default function KontakPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
      <p className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))] font-semibold">
        Support
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">Hubungi Kami</h1>
      <p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">
        Tim kami siap bantu Senin–Sabtu, 09.00–21.00 WIB.
      </p>

      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {CHANNELS.map((c) => (
          <div
            key={c.title}
            className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-6"
          >
            <div className="flex items-center gap-3">
              <span className="h-10 w-10 rounded-2xl bg-[hsl(var(--sage-100))] dark:bg-[hsl(var(--sage-700)/0.4)] grid place-items-center text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-200))]">
                <c.icon className="h-5 w-5" />
              </span>
              <h2 className="text-lg font-semibold">{c.title}</h2>
            </div>
            <p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">{c.description}</p>
            <a
              href={c.cta.href}
              target={c.cta.href.startsWith("http") ? "_blank" : undefined}
              rel={c.cta.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))] hover:underline"
            >
              {c.cta.label} →
            </a>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex items-start gap-3">
          <Clock className="h-4 w-4 text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))] mt-1" />
          <div>
            <p className="text-sm font-semibold">Jam operasional</p>
            <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Senin–Sabtu 09.00–21.00 WIB</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <MapPin className="h-4 w-4 text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))] mt-1" />
          <div>
            <p className="text-sm font-semibold">Kantor</p>
            <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Bandung, Jawa Barat</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Mail className="h-4 w-4 text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))] mt-1" />
          <div>
            <p className="text-sm font-semibold">Email umum</p>
            <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">hello@bawabawa.id</p>
          </div>
        </div>
      </div>

      <section className="mt-12">
        <h2 className="text-xl font-semibold tracking-tight">Pertanyaan umum</h2>
        <div className="mt-4 space-y-4">
          {FAQ_QUICK.map((f) => (
            <div key={f.q} className="rounded-2xl border border-[hsl(var(--border))] p-5">
              <p className="text-sm font-semibold">{f.q}</p>
              <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-xs text-[hsl(var(--muted-foreground))]">
          Pertanyaan lain? Lihat <Link href="/#faq" className="underline">FAQ lengkap</Link> atau hubungi WhatsApp di atas.
        </p>
      </section>
    </article>
  );
}
