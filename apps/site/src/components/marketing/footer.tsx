import Link from "next/link";
import { Mail, MapPin, MessageCircle, Plane, Truck } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { getSiteContact } from "@/lib/site-contact";

function Instagram(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function TikTok(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  );
}

function YouTube(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2.5 17a24.1 24.1 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.6 49.6 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.1 24.1 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.6 49.6 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <path d="m10 15 5-3-5-3z" />
    </svg>
  );
}

const SOCIAL_ICON = { instagram: Instagram, tiktok: TikTok, youtube: YouTube } as const;
const SOCIAL_LABEL = { instagram: "Instagram", tiktok: "TikTok", youtube: "YouTube" } as const;

const LINKS = [
  { label: "Katalog Viral Bandung", href: "/katalog" },
  { label: "Titip Barang", href: "/request" },
  { label: "Jadwal & Jalur Kirim", href: "/open-trip" },
  { label: "Lacak & Pembayaran", href: "/lacak" },
  { label: "Reseller & B2B", href: "/reseller" },
  { label: "Artikel & Kuliner Bandung", href: "/blog" },
  { label: "Tentang Kami", href: "/tentang" },
  { label: "Kontak & Hub", href: "/kontak" },
];

const iconBtn =
  "lift rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--surface))] h-10 w-10 inline-flex items-center justify-center hover:bg-[hsl(var(--surface-2))]";

export async function Footer() {
  const c = await getSiteContact();
  return (
    <footer className="border-t border-[hsl(var(--border))] bg-[hsl(var(--surface))] mt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-8 lg:grid-cols-12 pb-10 border-b border-[hsl(var(--border))]">
          <div className="lg:col-span-5">
            <Logo />
            <p className="mt-3 text-sm text-[hsl(var(--muted-foreground))] max-w-md leading-relaxed">
              Personal shopper &amp; jasa titip resmi berpusat di <strong>Kota Bandung</strong>.
              Kami antrekan langsung kuliner &amp; barang viral Bandung (Roti Macan, Tjilaki 9, Roti Merak, Rochi, Studio Bolen, Makjay, In Parfume) dengan pembayaran mudah via Transfer Bank / QRIS &amp; konfirmasi WhatsApp.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <a href={`https://wa.me/${c.whatsapp}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className={iconBtn}>
                <MessageCircle className="h-4 w-4" />
              </a>
              {c.socials.map(({ key, url }) => {
                const Icon = SOCIAL_ICON[key];
                return (
                  <a key={key} href={url} target="_blank" rel="noopener noreferrer" aria-label={SOCIAL_LABEL[key]} className={iconBtn}>
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
              <a href={`mailto:${c.email}`} aria-label="Email" className={iconBtn}>
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="lg:col-span-7 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--bg))] p-4">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[hsl(var(--sage-700))]">
                <MapPin className="h-3.5 w-3.5" /> Jalur 1 · Bandung Instant
              </div>
              <p className="mt-1.5 text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
                Kota Bandung, Cimahi, Lembang, Kab. Bandung, Jatinangor, Antar Hotel &amp; Stasiun KCIC Whoosh (Sampai Hari Ini).
              </p>
            </div>
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--bg))] p-4">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#B85048]">
                <Truck className="h-3.5 w-3.5" /> Jalur 2 · Travel Jabar
              </div>
              <p className="mt-1.5 text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
                Jakarta, Bekasi, Depok, Bogor, Tangerang, Garut, Tasik, Sumedang, Purwakarta, Subang, Karawang, Cirebon via Cititrans/DayTrans/Arnes.
              </p>
            </div>
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--bg))] p-4">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[hsl(var(--sage-700))]">
                <Plane className="h-3.5 w-3.5" /> Jalur 3 · Hub Samarinda
              </div>
              <p className="mt-1.5 text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
                Kloter Udara Bandung → Pickup Point Hub Bawabawa Samarinda (Dikelola Partner Samarinda) &amp; kurir ke Balikpapan/Tenggarong.
              </p>
            </div>
          </div>
        </div>

        <nav aria-label="Footer" className="mt-6">
          <ul className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-6 flex flex-col gap-3 border-t border-[hsl(var(--border))] pt-6 text-xs text-[hsl(var(--muted-foreground))] md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} Bawabawa.id · Pusat Belanja Bandung &amp; Hub Distribusi Samarinda
            {c.supportHours ? ` · ${c.supportHours}` : ""}
          </p>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-[hsl(var(--foreground))]">Syarat &amp; Ketentuan</Link>
            <Link href="/refund" className="hover:text-[hsl(var(--foreground))]">Jaminan &amp; Refund</Link>
            <Link href="/privacy" className="hover:text-[hsl(var(--foreground))]">Privasi</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
