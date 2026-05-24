import { Sparkles } from "lucide-react";
import Link from "next/link";
import { Sidebar, type SidebarGroup } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { Button } from "@/components/ui/button";

// Sidebar removed: "ERP Integration" entry (system-language leak) and the
// hardcoded badge counts on Pesanan/Pembayaran (those were faking activity
// before the admin loads the actual list).
const groups: SidebarGroup[] = [
  {
    label: "Operasional",
    items: [
      { href: "/admin", label: "Overview", icon: "dashboard" },
      { href: "/admin/orders", label: "Pesanan", icon: "package" },
      { href: "/admin/trips", label: "Open Trip", icon: "plane" },
      { href: "/admin/customers", label: "Customer", icon: "users" },
      { href: "/admin/payments", label: "Pembayaran", icon: "card" },
      { href: "/admin/invoices", label: "Invoice", icon: "receipt" },
      { href: "/admin/pos", label: "POS / Order Manual", icon: "package" },
      { href: "/admin/approvals", label: "Approvals", icon: "shield" },
    ],
  },
  {
    label: "Inventory & Logistik",
    items: [
      { href: "/admin/inventory", label: "Stok produk", icon: "package" },
      { href: "/admin/procurement", label: "Purchase Order", icon: "card" },
      { href: "/admin/imports", label: "Import CSV", icon: "file" },
    ],
  },
  {
    label: "CRM & Marketing",
    items: [
      { href: "/admin/leads", label: "Leads", icon: "users" },
      { href: "/admin/vouchers", label: "Voucher & Promo", icon: "receipt" },
      { href: "/admin/whatsapp", label: "WhatsApp Outbox", icon: "chat" },
      { href: "/admin/emails", label: "Email Outbox", icon: "bell" },
    ],
  },
  {
    label: "Keuangan & HR",
    items: [
      { href: "/admin/bagi-hasil", label: "Bagi Hasil", icon: "wallet" },
      { href: "/admin/hr", label: "Pegawai & Absensi", icon: "users" },
      { href: "/admin/reports", label: "Laporan & Analytics", icon: "chart" },
    ],
  },
  {
    label: "Konten & Tim",
    items: [
      { href: "/admin/cms", label: "CMS", icon: "file" },
      { href: "/admin/support", label: "Customer Support", icon: "support" },
      { href: "/admin/users", label: "Tim & Admin", icon: "users" },
      { href: "/admin/roles", label: "Role & Permission", icon: "shield" },
      { href: "/admin/settings", label: "Pengaturan", icon: "settings" },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh">
      <Sidebar
        groups={groups}
        brandHref="/admin"
        footer={
          <div className="rounded-xl bg-linear-to-br from-[hsl(var(--sage-700))] to-[hsl(var(--sage-900))] p-4 text-white">
            <div className="flex items-center gap-2 text-xs font-medium">
              <Sparkles className="h-3.5 w-3.5" /> Admin Bawabawa
            </div>
            <p className="mt-1 text-[11px] opacity-80">
              Kelola pesanan, customer, dan konten dari satu tempat.
            </p>
          </div>
        }
      />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar
          title="Admin Console"
          subtitle="Bawabawa Bandung"
        />
        <div className="px-4 sm:px-6 lg:px-8 py-6 flex-1">
          <div className="lg:hidden mb-4 flex items-center gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/">← Kembali ke beranda</Link>
            </Button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
