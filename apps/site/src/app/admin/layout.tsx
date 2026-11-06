import Link from "next/link";
import { Sidebar, MobileNav, type SidebarGroup, type SidebarItem } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/customer-bff";
import { isAdminRole } from "@/lib/auth-edge";

const PRIMARY_FULL: SidebarItem[] = [
  { href: "/admin", label: "Ringkasan", icon: "home", hint: "Pantauan 3 jalur & kas" },
  { href: "/admin/orders", label: "Pesanan & Belanja", icon: "package", hint: "Daftar belanja & label PDF" },
  { href: "/admin/hub-samarinda", label: "Hub Samarinda", icon: "pin", badge: "Partner 3", hint: "QC kloter, stok & POS SMD" },
  { href: "/admin/bagi-hasil", label: "Bagi Hasil (3P)", icon: "wallet", hint: "Split 3 partner & slip PDF" },
];

const GROUPS_FULL: SidebarGroup[] = [
  {
    label: "Operasional Utama",
    items: [
      ...PRIMARY_FULL,
      { href: "/admin/trips", label: "Jadwal & Kloter", icon: "plane", hint: "Kloter Samarinda & Travel Jabar" },
    ],
  },
  {
    label: "Katalog & Konten (CMS)",
    items: [
      { href: "/admin/catalog", label: "Katalog Bandung", icon: "bag", hint: "20+ produk viral Bandung" },
      { href: "/admin/vouchers", label: "Voucher & Promo", icon: "megaphone", hint: "Kode BAWASMD & diskon" },
      { href: "/admin/reviews", label: "Ulasan Pembeli", icon: "star", hint: "Moderasi testimoni" },
      { href: "/admin/cms/blog", label: "Artikel & Blog", icon: "pen", hint: "Artikel kuliner Bandung" },
    ],
  },
  {
    label: "Pelanggan & Sistem",
    items: [
      { href: "/admin/customers", label: "Database Pelanggan", icon: "heart", hint: "CRM & export Excel/CSV" },
      { href: "/admin/settings", label: "Rekening, QRIS & Web", icon: "settings", hint: "BCA/Mandiri, QRIS, 3 jalur" },
      { href: "/admin/users", label: "Tim & Role (RBAC)", icon: "users", hint: "Owner, Pacar & Hub Samarinda" },
    ],
  },
];

const PRIMARY_HUB_SAMARINDA: SidebarItem[] = [
  { href: "/admin/hub-samarinda", label: "Hub Samarinda", icon: "pin", badge: "Utama" },
  { href: "/admin/orders", label: "Pesanan SMD", icon: "package" },
  { href: "/admin/trips", label: "Jadwal Kloter", icon: "plane" },
  { href: "/admin/bagi-hasil", label: "Komisi Saya", icon: "wallet" },
];

const GROUPS_HUB_SAMARINDA: SidebarGroup[] = [
  {
    label: "Menu Partner Hub Samarinda",
    items: [
      { href: "/admin/hub-samarinda", label: "Hub Samarinda (QC, Stok & POS)", icon: "pin", badge: "Partner 3" },
      { href: "/admin/orders", label: "Daftar Pesanan & Label", icon: "package" },
      { href: "/admin/trips", label: "Jadwal Kloter Masuk", icon: "plane" },
      { href: "/admin/vouchers", label: "Kode Referral (BAWASMD)", icon: "megaphone" },
      { href: "/admin/bagi-hasil", label: "Rekap Komisi Samarinda", icon: "wallet" },
      { href: "/admin", label: "Ringkasan Bisnis", icon: "home" },
    ],
  },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await readSession();
  if (!session || !isAdminRole(session.role)) {
    redirect("/login?next=/admin&reason=forbidden");
  }

  const isHubSamarindaOnly = session.role === "hub_samarinda";
  const groups = isHubSamarindaOnly ? GROUPS_HUB_SAMARINDA : GROUPS_FULL;
  const primary = isHubSamarindaOnly ? PRIMARY_HUB_SAMARINDA : PRIMARY_FULL;

  const roleBadge =
    session.role === "owner"
      ? "Partner 1 · Owner Bandung"
      : session.role === "operations"
      ? "Partner 2 · Co-Owner & Belanja Bandung"
      : session.role === "hub_samarinda"
      ? "Partner 3 · Hub & Distribusi Samarinda"
      : `Role: ${session.role}`;

  return (
    <div className="flex min-h-svh">
      <Sidebar
        groups={groups}
        brandHref="/admin"
        footer={
          <div className="space-y-2">
            <div className="rounded-xl bg-[#FCF3E4] border border-[#E6DAC3] px-3 py-2 text-[11px]">
              <span className="font-bold text-[#24201A] block">Akses Aktif (RBAC):</span>
              <span className="text-[hsl(var(--sage-700))] font-semibold">{roleBadge}</span>
            </div>
            <Button asChild variant="ghost" size="sm" className="w-full justify-start">
              <Link href="/" target="_blank">
                Lihat Live Website ↗
              </Link>
            </Button>
          </div>
        }
      />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar title={`Panel Admin · ${roleBadge}`} />
        <main id="main" tabIndex={-1} className="px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-6 flex-1">
          {children}
        </main>
        <MobileNav groups={groups} primary={primary} />
      </div>
    </div>
  );
}
