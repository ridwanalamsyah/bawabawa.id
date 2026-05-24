"use client";

import * as React from "react";
import { Users } from "lucide-react";
import { Card, GlassCard } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";

type Customer = {
  id: string;
  name: string;
  phone: string | null;
  branchId: string | null;
};

type ErrorPayload = { error?: string };

export function CustomersClient() {
  const [customers, setCustomers] = React.useState<Customer[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/admin/customers", { cache: "no-store" });
        if (!res.ok) {
          const payload = (await res.json().catch(() => ({}))) as ErrorPayload;
          if (!cancelled) setError(payload.error ?? `HTTP ${res.status}`);
          return;
        }
        const data = (await res.json()) as Customer[];
        if (!cancelled) setCustomers(data);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Gagal memuat daftar customer");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const total = customers?.length ?? 0;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <GlassCard className="p-5">
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Total customer</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {customers === null ? "—" : total.toLocaleString("id-ID")}
          </p>
        </GlassCard>
        <GlassCard className="p-5">
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Customer aktif</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {customers === null ? "—" : total.toLocaleString("id-ID")}
          </p>
          <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
            Akan ter-split berdasar status begitu segmentasi diaktifkan.
          </p>
        </GlassCard>
        <GlassCard className="p-5">
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Sumber data</p>
          <p className="mt-1 text-sm font-medium">
            Pesanan web + input manual dari Instagram/WhatsApp.
          </p>
        </GlassCard>
      </div>

      {error && (
        <Card className="p-6 border-[hsl(var(--destructive)/0.4)] bg-[hsl(var(--destructive)/0.05)]">
          <p className="text-sm font-medium">Gagal memuat customer</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{error}</p>
        </Card>
      )}

      {customers !== null && customers.length === 0 && !error && (
        <Card className="p-10 text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-[hsl(var(--surface-2))] grid place-items-center text-[hsl(var(--muted-foreground))]">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-lg font-semibold tracking-tight">Belum ada customer</h3>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))] max-w-md mx-auto">
            Customer baru akan otomatis muncul saat pesanan pertama mereka tercatat,
            atau saat admin menambahkan order manual dari /admin/orders.
          </p>
        </Card>
      )}

      {customers !== null && customers.length > 0 && (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-[hsl(var(--muted-foreground))] bg-[hsl(var(--surface-2))]">
                <tr>
                  <Th>Customer</Th>
                  <Th>Telepon</Th>
                  <Th>Branch</Th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr
                    key={c.id}
                    className="border-t border-[hsl(var(--border))] hover:bg-[hsl(var(--surface-2))]"
                  >
                    <Td>
                      <div className="flex items-center gap-3">
                        <Avatar name={c.name} size={32} />
                        <div>
                          <p className="font-medium">{c.name}</p>
                          <p className="text-xs text-[hsl(var(--muted-foreground))] font-mono">
                            {c.id.slice(0, 8)}…
                          </p>
                        </div>
                      </div>
                    </Td>
                    <Td>{c.phone ?? "—"}</Td>
                    <Td className="text-xs text-[hsl(var(--muted-foreground))] font-mono">
                      {c.branchId ?? "—"}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {customers === null && !error && (
        <Card className="p-10 text-center text-sm text-[hsl(var(--muted-foreground))]">
          Memuat daftar customer…
        </Card>
      )}
    </>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={"text-left font-medium px-5 py-3 " + (className ?? "")}>{children}</th>
  );
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={"px-5 py-3 " + (className ?? "")}>{children}</td>;
}
