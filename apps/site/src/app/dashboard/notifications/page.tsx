import { PageHeader } from "@/components/dashboard/page-header";
import { GlassCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, ShoppingBag, Plane, Receipt, Sparkles } from "lucide-react";

const NOTIFS = [
  { icon: Plane, type: "Tracking", title: "BWB-AX42K1 sudah berangkat dari Bandung", at: "5 menit lalu", read: false },
  { icon: ShoppingBag, type: "Tracking", title: "Personal shopper Rani sedang belanja di Pasar Baru", at: "12 menit lalu", read: false },
  { icon: Receipt, type: "Pembayaran", title: "Invoice INV-2025-0042 sudah dibayar — escrow akan dirilis setelah barang diterima", at: "1 jam lalu", read: true },
  { icon: Sparkles, type: "Promo", title: "Diskon 20% fee jasa titip untuk request pertama trip BDG-SMD-244", at: "1 hari lalu", read: true },
  { icon: Plane, type: "Trip", title: "Trip BDG-SMD-242 hampir fullbooked. Sisa 2 kg slot.", at: "1 hari lalu", read: true },
];

export default function NotificationsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Notifikasi"
        title="Pusat notifikasi"
        description="Update realtime tentang pesanan, trip, dan info penting lainnya."
      />
      <div className="space-y-3">
        {NOTIFS.map((n, i) => (
          <GlassCard key={i} className="p-5 flex items-start gap-4">
            <div className="h-10 w-10 rounded-2xl bg-[hsl(var(--sage-100))] dark:bg-[hsl(var(--sage-700)/0.4)] grid place-items-center text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-200))]">
              <n.icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="neutral">{n.type}</Badge>
                {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--emerald-500))]" />}
              </div>
              <p className="mt-1 text-sm font-medium">{n.title}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">{n.at}</p>
            </div>
            <Bell className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          </GlassCard>
        ))}
      </div>
    </>
  );
}
