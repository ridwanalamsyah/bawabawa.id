import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MessageCircle, Clock, MapPin, Search, RotateCcw, Route } from "lucide-react";
import { getSiteContact } from "@/lib/site-contact";
import { delay } from "@/lib/motion";

export const metadata: Metadata = {
  title: "Hubungi Kami",
  description: "Hubungi tim Bawabawa.id lewat WhatsApp atau email untuk pertanyaan titipan Bandung → Samarinda.",
  alternates: { canonical: "/kontak" },
};

const HELP = [
  {
    icon: Search,
    q: "Pesanan belum sampai?",
    a: (
      <>
        Buka link tracking dari WhatsApp, atau{" "}
        <Link href="/lacak" className="underline underline-offset-2">Lacak Pesanan</Link>. Lewat 7 hari dalam
        pengiriman? Chat kami dengan kode pesananmu.
      </>
    ),
    tone: "bg-[hsl(var(--sky-100))] text-[hsl(var(--sky-600))]",
  },
  {
    icon: RotateCcw,
    q: "Mau batal atau refund?",
    a: (
      <>
        Sebelum barang dibelikan, tekan &ldquo;Batalkan&rdquo; di halaman tracking. Detail di{" "}
        <Link href="/refund" className="underline underline-offset-2">Kebijakan Refund</Link>.
      </>
    ),
    tone: "bg-[hsl(var(--coral-100))] text-[hsl(var(--coral-600))]",
  },
  {
    icon: Route,
    q: "Bisa dari kota lain?",
    a: <>Saat ini rute Bandung → Samarinda. Rute baru akan kami umumkan di Instagram.</>,
    tone: "bg-[hsl(var(--amber-100))] text-[hsl(var(--amber-600))]",
  },
];

export default async function KontakPage() {
  const c = await getSiteContact();
  return (
    <article className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <h1 className="animate-rise text-4xl sm:text-5xl">Hubungi kami</h1>
      <p style={delay(80)} className="animate-rise mt-3 text-lg text-[hsl(var(--muted-foreground))]">
        Paling cepat lewat WhatsApp{c.supportHours ? ` · ${c.supportHours}` : ""}.
      </p>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <a
          href={`https://wa.me/${c.whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          data-reveal
          className="lift group flex items-center gap-4 rounded-2xl bg-[hsl(var(--sage-700))] p-6 text-white"
        >
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-white/15">
            <MessageCircle className="h-6 w-6" aria-hidden />
          </span>
          <span>
            <span className="block text-lg font-semibold">Chat WhatsApp</span>
            <span className="block text-sm text-white/80">Pertanyaan pesanan, harga, atau refund</span>
          </span>
        </a>
        <a
          href={`mailto:${c.email}`}
          data-reveal
          style={delay(80)}
          className="lift flex items-center gap-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-6"
        >
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-[hsl(var(--plum-100))] text-[hsl(var(--plum-600))]">
            <Mail className="h-6 w-6" aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block text-lg font-semibold">Email</span>
            <span className="block truncate text-sm text-[hsl(var(--muted-foreground))]">{c.email}</span>
          </span>
        </a>
      </div>

      {(c.supportHours || c.address) && (
        <div data-reveal className="mt-4 flex flex-wrap gap-x-8 gap-y-3 rounded-2xl bg-[hsl(var(--surface-2))] p-5 text-sm">
          {c.supportHours && (
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))]" aria-hidden />
              {c.supportHours}
            </span>
          )}
          {c.address && (
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))]" aria-hidden />
              {c.address}
            </span>
          )}
        </div>
      )}

      <section className="mt-12" aria-labelledby="help-title">
        <h2 id="help-title" data-reveal className="text-2xl">
          Yang sering ditanyakan
        </h2>
        <ul className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {HELP.map(({ icon: Icon, q, a, tone }, i) => (
            <li key={q} data-reveal style={delay(i * 80)} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-5">
              <span className={`grid h-10 w-10 place-items-center rounded-xl ${tone}`}>
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <p className="mt-3 font-semibold">{q}</p>
              <p className="mt-1 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">{a}</p>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
