import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";

/**
 * Read-only view of the permission matrix enforced by the API
 * (apps/api/src/common/security/permissions.ts). Keep the two in sync.
 * A user's access is decided by their division, set on /admin/users.
 */
const PERMS: Array<{ key: string; label: string }> = [
  { key: "orders:read", label: "Lihat pesanan" },
  { key: "orders:create", label: "Buat order manual" },
  { key: "orders:update", label: "Proses pesanan (penawaran, status)" },
  { key: "orders:approve", label: "Approval" },
  { key: "finance:manage_finance", label: "Keuangan" },
  { key: "inventory:manage", label: "Stok & katalog" },
  { key: "crm:manage", label: "Customer & leads" },
  { key: "comms:send", label: "Kirim WA / email" },
  { key: "cms:manage", label: "Konten situs" },
  { key: "reports:export", label: "Unduh laporan" },
  { key: "users:manage_users", label: "Kelola tim & HR" },
];

const ALL = PERMS.map((p) => p.key);
const DIVISIONS: Array<{ division: string; perms: string[] }> = [
  { division: "admin / owner", perms: ALL },
  { division: "finance", perms: ["orders:read", "orders:approve", "finance:manage_finance", "reports:export"] },
  { division: "operations", perms: ["orders:read", "orders:create", "orders:update", "inventory:manage", "comms:send"] },
  { division: "koordinator", perms: ["orders:read", "orders:create", "orders:update", "orders:approve", "inventory:manage", "comms:send"] },
  { division: "gudang", perms: ["orders:read", "orders:update", "inventory:manage"] },
  { division: "sales", perms: ["orders:read", "orders:create", "crm:manage", "comms:send"] },
  { division: "support", perms: ["orders:read", "crm:manage", "comms:send"] },
  { division: "marketing / cms", perms: ["cms:manage"] },
];

export default function RolesPage() {
  return (
    <>
      <PageHeader
        title="Hak akses tim"
        description="Akses ditentukan dari divisi akun. Ubah divisi seseorang di halaman Tim & Admin. Divisi yang tidak dikenal hanya bisa melihat pesanan."
      />
      <Card className="p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">Matriks hak akses per divisi</caption>
          <thead className="bg-[hsl(var(--surface-2))] text-xs text-[hsl(var(--muted-foreground))]">
            <tr>
              <th scope="col" className="text-left font-medium px-4 py-3">Akses</th>
              {DIVISIONS.map((d) => (
                <th key={d.division} scope="col" className="font-medium px-3 py-3 whitespace-nowrap">{d.division}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMS.map((p) => (
              <tr key={p.key} className="border-t border-[hsl(var(--border))]">
                <th scope="row" className="text-left font-normal px-4 py-2.5">{p.label}</th>
                {DIVISIONS.map((d) => (
                  <td key={d.division} className="text-center px-3 py-2.5">
                    {d.perms.includes(p.key) ? (
                      <Check className="inline h-4 w-4 text-[hsl(var(--emerald-600))]" aria-label="Ya" />
                    ) : (
                      <span className="text-[hsl(var(--muted-foreground))]" aria-label="Tidak">—</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <p className="mt-4 text-sm">
        <Link href="/admin/users" className="underline">Kelola tim & divisi →</Link>
      </p>
    </>
  );
}
