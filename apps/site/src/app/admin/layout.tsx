import Link from "next/link";
import { Sidebar, MobileNav, type SidebarGroup, type SidebarItem } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/customer-bff";
import { isAdminRole } from "@/lib/auth-edge";

// Only what the team uses to run the jastip, in plain words. Older
// back-office pages still exist by URL but are left out of the menu.
const PRIMARY: SidebarItem[] = [
  { href: "/admin", label: "Beranda", icon: "home" },
  { href: "/admin/orders", label: "Pesanan", icon: "package" },
  { href: "/admin/catalog", label: "Katalog", icon: "bag" },
  { href: "/admin/trips", label: "Open Trip", icon: "plane" },
];

const groups: SidebarGroup[] = [
  { items: PRIMARY },
  {
    label: "Jualan",
    items: [
      { href: "/admin/vouchers", label: "Promo", icon: "megaphone", hint: "Kode diskon & banner" },
      { href: "/admin/reviews", label: "Ulasan", icon: "star", hint: "Tayangkan ulasan pembeli" },
      { href: "/admin/cms/blog", label: "Artikel", icon: "pen", hint: "Tulis tips & info" },
      { href: "/admin/partners", label: "Reseller", icon: "heart", hint: "Pendaftar reseller & B2B" },
    ],
  },
  {
    label: "Pengaturan",
    items: [
      { href: "/admin/settings", label: "Tampilan situs", icon: "settings", hint: "Kontak, teks beranda, FAQ" },
      { href: "/admin/users", label: "Tim admin", icon: "users", hint: "Siapa yang boleh masuk" },
    ],
  },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Defense in depth: proxy.ts already gates /admin, but a proxy bypass
  // (see CVE class fixed in Next 16.3) must still not render staff pages.
  const session = await readSession();
  if (!session || !isAdminRole(session.role)) {
    redirect("/login?next=/admin&reason=forbidden");
  }
  return (
    <div className="flex min-h-svh">
      <Sidebar
        groups={groups}
        brandHref="/admin"
        footer={
          <Button asChild variant="ghost" size="sm" className="w-full justify-start">
            <Link href="/" target="_blank">
              Lihat situs ↗
            </Link>
          </Button>
        }
      />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar title="Admin Bawabawa" />
        <main id="main" tabIndex={-1} className="px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-6 flex-1">
          {children}
        </main>
        <MobileNav groups={groups} primary={PRIMARY} />
      </div>
    </div>
  );
}
