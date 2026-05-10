import { LifeBuoy } from "lucide-react";
import { Sidebar, type SidebarGroup } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const groups: SidebarGroup[] = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard", label: "Beranda", icon: "dashboard" },
      { href: "/dashboard/orders", label: "Pesanan", icon: "package", badge: "3" },
      { href: "/dashboard/tracking", label: "Live Tracking", icon: "truck" },
    ],
  },
  {
    label: "Aktivitas",
    items: [
      { href: "/dashboard/invoice", label: "Invoice", icon: "receipt" },
      { href: "/dashboard/wishlist", label: "Wishlist", icon: "heart" },
      { href: "/dashboard/chat", label: "Live Chat Admin", icon: "chat", badge: "1" },
      { href: "/dashboard/notifications", label: "Notifikasi", icon: "bell" },
    ],
  },
  {
    label: "Akun",
    items: [
      { href: "/dashboard/addresses", label: "Alamat tersimpan", icon: "pin" },
      { href: "/dashboard/settings", label: "Pengaturan", icon: "settings" },
    ],
  },
];

export default function UserDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh">
      <Sidebar
        groups={groups}
        footer={
          <Link
            href="#"
            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--surface)/0.6)] hover:text-[hsl(var(--foreground))]"
          >
            <LifeBuoy className="h-4 w-4" />
            Pusat Bantuan
          </Link>
        }
      />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar
          title="Dashboard"
          subtitle="Selamat datang kembali, Aulia ✨"
          user={{ name: "Aulia Putri", role: "Customer · Samarinda" }}
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
