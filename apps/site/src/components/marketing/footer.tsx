import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Mail, MessageCircle } from "lucide-react";

function Instagram(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

export function Footer() {
  const sections = [
    {
      title: "Layanan",
      links: [
        { label: "Titip Sekarang", href: "/request" },
        { label: "Open Trip", href: "/open-trip" },
        { label: "Dashboard", href: "/dashboard" },
        { label: "Tarif & Estimasi", href: "/request" },
      ],
    },
    {
      title: "Kategori",
      links: [
        { label: "Jastip Sepatu", href: "/jastip-sepatu" },
        { label: "Jastip Skincare", href: "/jastip-skincare" },
        { label: "Jastip Fashion", href: "/jastip-fashion" },
        { label: "Jastip Makanan", href: "/jastip-makanan" },
        { label: "Jastip Elektronik", href: "/jastip-elektronik" },
      ],
    },
    {
      title: "Perusahaan",
      links: [
        { label: "Press Kit", href: "/press-kit" },
        { label: "Blog", href: "/blog" },
        { label: "Karier", href: "#" },
        { label: "Hubungi Kami", href: "mailto:hello@bawabawa.id" },
      ],
    },
  ];

  return (
    <footer className="relative border-t border-[hsl(var(--border))] mt-24">
      <div className="absolute inset-0 dot-grid opacity-40 pointer-events-none" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-10">
          <div className="col-span-2">
            <Logo />
            <p className="mt-4 max-w-sm text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
              Bawabawa.id adalah jasa titip lokal modern dari Bandung ke Samarinda.
              Cepat, aman, terpercaya — didukung oleh personal shopper terverifikasi
              dan ekosistem digital terintegrasi.
            </p>
            <div className="mt-5 flex items-center gap-2">
              <a href="#" aria-label="Instagram" className="rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--surface))] h-9 w-9 inline-flex items-center justify-center hover:bg-[hsl(var(--surface-2))]">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="#" aria-label="WhatsApp" className="rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--surface))] h-9 w-9 inline-flex items-center justify-center hover:bg-[hsl(var(--surface-2))]">
                <MessageCircle className="h-4 w-4" />
              </a>
              <a href="#" aria-label="Email" className="rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--surface))] h-9 w-9 inline-flex items-center justify-center hover:bg-[hsl(var(--surface-2))]">
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>
          {sections.map((s) => (
            <div key={s.title}>
              <p className="text-sm font-semibold mb-3">{s.title}</p>
              <ul className="flex flex-col gap-2">
                {s.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-6 border-t border-[hsl(var(--border))]">
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            © {new Date().getFullYear()} Bawabawa.id — Made with love in Bandung 🌿 untuk Samarinda.
          </p>
          <div className="flex items-center gap-4 text-xs text-[hsl(var(--muted-foreground))]">
            <Link href="/privacy" className="hover:text-[hsl(var(--foreground))]">Privacy</Link>
            <Link href="/privacy#7-keamanan-data" className="hover:text-[hsl(var(--foreground))]">Terms</Link>
            <Link href="/privacy#cookie" className="hover:text-[hsl(var(--foreground))]">Cookie</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
