import { Sparkles } from "lucide-react";
import Link from "next/link";
import { Sidebar, type SidebarGroup } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { Button } from "@/components/ui/button";

const groups: SidebarGroup[] = [
  {
    label: "Operations",
    items: [
      { href: "/admin", label: "Overview", icon: "dashboard" },
      { href: "/admin/orders", label: "Pesanan", icon: "package", badge: "12" },
      { href: "/admin/trips", label: "Open Trip", icon: "plane" },
      { href: "/admin/customers", label: "Customer", icon: "users" },
      { href: "/admin/payments", label: "Pembayaran", icon: "card", badge: "3" },
    ],
  },
  {
    label: "Analytics",
    items: [
      { href: "/admin/reports", label: "Laporan & Analytics", icon: "chart" },
      { href: "/admin/erp", label: "ERP Integration", icon: "cable" },
    ],
  },
  {
    label: "Konten & Tim",
    items: [
      { href: "/admin/cms", label: "CMS", icon: "file" },
      { href: "/admin/support", label: "Customer Support", icon: "support" },
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
          <div className="rounded-xl bg-gradient-to-br from-[hsl(var(--sage-700))] to-[hsl(var(--sage-900))] p-4 text-white">
            <div className="flex items-center gap-2 text-xs font-medium">
              <Sparkles className="h-3.5 w-3.5" /> Admin Console v3.0
            </div>
            <p className="mt-1 text-[11px] opacity-80">
              Tersinkron 2-arah dengan ERP. Last sync: 12 detik lalu.
            </p>
          </div>
        }
      />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar
          title="Admin Console"
          subtitle="Realtime ops · Bandung HQ"
          user={{ name: "Indra Permana", role: "Owner" }}
          notifications={5}
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
