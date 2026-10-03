import Link from "next/link";
import { ArrowRight, Settings, FileText, Megaphone, Plane, Star, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { GlassCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Shortcut = {
  href: string;
  label: string;
  description: string;
  icon: React.ReactNode;
};

const SHORTCUTS: Shortcut[] = [
  {
    href: "/admin/settings",
    label: "Kontak & sosial media",
    description: "Email, WhatsApp, alamat, jam operasional, dan link Instagram/TikTok yang tampil di footer & halaman Kontak.",
    icon: <Settings className="h-5 w-5" />,
  },
  {
    href: "/admin/cms/blog",
    label: "Artikel blog",
    description: "Buat dan terbitkan artikel SEO. Otomatis tampil di /blog.",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    href: "/admin/vouchers",
    label: "Banner promosi",
    description: "Strip promo di atas beranda diambil dari voucher. Buat voucher, lalu pilih “Tampilkan di banner”.",
    icon: <Megaphone className="h-5 w-5" />,
  },
  {
    href: "/admin/reviews",
    label: "Ulasan customer",
    description: "Setujui ulasan dari halaman lacak supaya tampil di beranda.",
    icon: <Star className="h-5 w-5" />,
  },
  {
    href: "/admin/settings",
    label: "Animasi situs",
    description: "Nyalakan/matikan animasi dan efek latar di situs publik (bagian Animasi).",
    icon: <Sparkles className="h-5 w-5" />,
  },
  {
    href: "/admin/trips",
    label: "Open Trip",
    description: "Buat jadwal trip Bandung → Samarinda yang tampil di /open-trip.",
    icon: <Plane className="h-5 w-5" />,
  },
];

export default function CMSPage() {
  return (
    <>
      <PageHeader
        eyebrow="CMS"
        title="Konten & pengaturan"
        description="Yang bisa kamu ubah sendiri tanpa developer: artikel, promo, jadwal trip, ulasan, kontak, dan animasi."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {SHORTCUTS.map((s) => (
          <GlassCard key={s.href} className="p-5 flex items-start gap-4">
            <div className="h-10 w-10 rounded-2xl bg-[hsl(var(--sage-100))] dark:bg-[hsl(var(--sage-700)/0.4)] grid place-items-center text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-200))]">
              {s.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold">{s.label}</p>
              <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                {s.description}
              </p>
              <Button asChild variant="ghost" size="sm" className="mt-3 -ml-2">
                <Link href={s.href}>
                  Buka <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </GlassCard>
        ))}
      </div>
    </>
  );
}
