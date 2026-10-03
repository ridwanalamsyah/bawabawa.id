import Link from "next/link";
import { Mail, MessageCircle } from "lucide-react";
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
  { label: "Katalog", href: "/katalog" },
  { label: "Titip Barang", href: "/request" },
  { label: "Open Trip", href: "/open-trip" },
  { label: "Lacak Pesanan", href: "/lacak" },
  { label: "Reseller & B2B", href: "/reseller" },
  { label: "Blog", href: "/blog" },
  { label: "Tentang", href: "/tentang" },
  { label: "Kontak", href: "/kontak" },
];

const iconBtn =
  "lift rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--surface))] h-10 w-10 inline-flex items-center justify-center hover:bg-[hsl(var(--surface-2))]";

/**
 * Compact footer: brand + contact on one row, one line of the pages people
 * actually use, legal links at the bottom. Contact and social links come
 * from Admin → Pengaturan; a social icon only shows once its URL is set.
 */
export async function Footer() {
  const c = await getSiteContact();
  return (
    <footer className="border-t border-[hsl(var(--border))] mt-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <Logo />
            <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
              Jastip Bandung → Samarinda. Cek harga dulu, bayar setelah setuju.
            </p>
          </div>
          <div className="flex items-center gap-2">
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

        <nav aria-label="Footer" className="mt-8">
          <ul className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-8 flex flex-col gap-3 border-t border-[hsl(var(--border))] pt-6 text-xs text-[hsl(var(--muted-foreground))] md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} Bawabawa.id
            {c.supportHours ? ` · ${c.supportHours}` : ""}
          </p>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-[hsl(var(--foreground))]">Syarat &amp; Ketentuan</Link>
            <Link href="/refund" className="hover:text-[hsl(var(--foreground))]">Refund</Link>
            <Link href="/privacy" className="hover:text-[hsl(var(--foreground))]">Privasi</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
