import Link from "next/link";
import { Sidebar, MobileNav, type SidebarGroup, type SidebarItem } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/customer-bff";
import { isAdminRole } from "@/lib/auth-edge";

// Main menu holds only what the team uses every day, in plain words.
// Back-office modules (stock, HR, invoices, …) stay reachable under the
// folded "Lainnya" group.
const PRIMARY: SidebarItem[] = [
  { href: "/admin", label: "Beranda", icon: "home" },
  { href: "/admin/orders", label: "Pesanan", icon: "package" },
  { href: "/admin/catalog", label: "Katalog", icon: "bag" },
  { href: "/admin/trips", label: "Open Trip", icon: "plane" },
];

const groups: SidebarGroup[] = [
  { items: PRIMARY },
  {
    label: "Promosi & konten",
    items: [
      { href: "/admin/vouchers", label: "Promo & banner", icon: "megaphone" },
      { href: "/admin/reviews", label: "Ulasan", icon: "star" },
      { href: "/admin/cms/blog", label: "Artikel", icon: "pen" },
      { href: "/admin/partners", label: "Reseller & B2B", icon: "heart" },
    ],
  },
  {
    label: "Pengaturan",
    items: [
      { href: "/admin/settings", label: "Kontak & tampilan", icon: "settings" },
      { href: "/admin/users", label: "Tim admin", icon: "users" },
    ],
  },
  {
    label: "Lainnya",
    collapsible: true,
    items: [
      { href: "/admin/customers", label: "Pelanggan", icon: "users" },
      { href: "/admin/payments", label: "Pembayaran", icon: "card" },
      { href: "/admin/invoices", label: "Invoice", icon: "receipt" },
      { href: "/admin/pos", label: "Order manual", icon: "package" },
      { href: "/admin/approvals", label: "Persetujuan", icon: "shield" },
      { href: "/admin/inventory", label: "Stok barang", icon: "package" },
      { href: "/admin/procurement", label: "Pembelian stok", icon: "card" },
      { href: "/admin/leads", label: "Calon pelanggan", icon: "users" },
      { href: "/admin/whatsapp", label: "Riwayat WhatsApp", icon: "chat" },
      { href: "/admin/emails", label: "Riwayat email", icon: "bell" },
      { href: "/admin/bagi-hasil", label: "Bagi hasil", icon: "wallet" },
      { href: "/admin/hr", label: "Pegawai & absensi", icon: "users" },
      { href: "/admin/reports", label: "Laporan", icon: "chart" },
      { href: "/admin/support", label: "Bantuan pelanggan", icon: "support" },
      { href: "/admin/roles", label: "Hak akses", icon: "shield" },
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
        <Topbar
          title="Admin Bawabawa"
          subtitle="Kelola pesanan, katalog, dan promo"
        />
        <main id="main" tabIndex={-1} className="px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-6 flex-1">
          {children}
        </main>
        <MobileNav groups={groups} primary={PRIMARY} />
      </div>
    </div>
  );
}
