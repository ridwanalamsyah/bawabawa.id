import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Shield } from "lucide-react";
import { adminUsers } from "@/lib/mock/analytics";

const ROLES: { role: string; perms: string[] }[] = [
  { role: "owner", perms: ["Semua akses", "Kelola tim", "Konfigurasi ERP"] },
  { role: "operations", perms: ["Order", "Trip", "Customer", "Support"] },
  { role: "finance", perms: ["Pembayaran", "Invoice", "Reports", "Reconciliation"] },
  { role: "support", perms: ["Tiket support", "Customer profile (read)", "Live chat"] },
  { role: "shopper", perms: ["Order assigned", "Tracking update", "Wallet payout"] },
];

export default function RolesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Role & Permission"
        title="Multi-role admin"
        description="Atur peran tim & granular permission. Setiap aktivitas tercatat di audit log."
        actions={<Button variant="primary"><Plus className="h-4 w-4" /> Undang anggota</Button>}
      />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <Card className="lg:col-span-7 p-0 overflow-hidden">
          <div className="p-5 border-b border-[hsl(var(--border))]"><p className="font-semibold">Anggota tim</p></div>
          <ul className="divide-y divide-[hsl(var(--border))]">
            {adminUsers.map((u) => (
              <li key={u.id} className="p-4 flex items-center gap-3">
                <Avatar name={u.name} size={36} />
                <div className="flex-1">
                  <p className="font-medium">{u.name}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">{u.email}</p>
                </div>
                <Badge variant={u.role === "owner" ? "success" : "neutral"}>{u.role}</Badge>
                <span className="text-xs text-[hsl(var(--muted-foreground))]">
                  {u.lastActive === "online" ? (
                    <span className="text-[hsl(var(--emerald-600))] dark:text-[hsl(var(--emerald-400))] flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--emerald-500))]" /> online
                    </span>
                  ) : (
                    `${u.lastActive} lalu`
                  )}
                </span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="lg:col-span-5 p-0 overflow-hidden">
          <div className="p-5 border-b border-[hsl(var(--border))] flex items-center gap-2">
            <Shield className="h-4 w-4 text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))]" />
            <p className="font-semibold">Permission matrix</p>
          </div>
          <ul className="divide-y divide-[hsl(var(--border))]">
            {ROLES.map((r) => (
              <li key={r.role} className="p-4">
                <p className="text-sm font-semibold capitalize">{r.role}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {r.perms.map((p) => (
                    <Badge key={p} variant="neutral">{p}</Badge>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
