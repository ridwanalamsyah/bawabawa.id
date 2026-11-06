"use client";

import * as React from "react";
import { Download, MessageCircle, Users } from "lucide-react";
import { Card, GlassCard } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { downloadExcelCsv } from "@/lib/admin-exports";

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
          if (!cancelled) setError(payload.error ?? "Terjadi kesalahan. Coba lagi.");
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

  const handleExportCustomersCsv = () => {
    const list = customers ?? [];
    downloadExcelCsv(
      "Database_Pelanggan_Bawabawa.csv",
      ["ID Pelanggan", "Nama Lengkap", "Nomor WhatsApp", "Cabang / Jalur"],
      list.map((c) => [c.id, c.name, c.phone ?? "-", c.branchId ?? "Bandung / Jabar / Samarinda"])
    );
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))]">
          Gunakan data ini untuk broadcast jadwal Open PO Roti Macan / Tjilaki 9 atau info kloter Samarinda.
        </p>
        <Button type="button" variant="primary" size="sm" onClick={handleExportCustomersCsv}>
          <Download className="h-4 w-4" /> Download Excel/CSV Database Pelanggan
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <GlassCard className="p-5">
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Total Pelanggan Terdaftar</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">
            {customers === null ? "—" : total.toLocaleString("id-ID")}
          </p>
        </GlassCard>
        <GlassCard className="p-5">
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Cakupan Wilayah</p>
          <p className="mt-1 text-base font-bold text-[#24201A]">
            🛵 Bandung · 🚐 Jabar/JKT · ✈️ Samarinda
          </p>
          <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-0.5">
            Otomatis tersimpan setiap ada pesanan masuk.
          </p>
        </GlassCard>
        <GlassCard className="p-5">
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Sumber Data</p>
          <p className="mt-1 text-sm font-medium">
            Form Jastip Web + POS Partner Hub Samarinda + WhatsApp.
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
          <h3 className="mt-4 text-lg font-semibold tracking-tight">Belum ada customer tercatat</h3>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))] max-w-md mx-auto">
            Customer baru akan otomatis muncul saat pesanan pertama mereka tercatat di sistem.
          </p>
        </Card>
      )}

      {customers !== null && customers.length > 0 && (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-[hsl(var(--muted-foreground))] bg-[hsl(var(--surface-2))]">
                <tr>
                  <Th>Nama Pelanggan</Th>
                  <Th>WhatsApp</Th>
                  <Th>Wilayah / Branch</Th>
                  <Th>Aksi WA</Th>
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
                          <p className="font-bold text-[#24201A]">{c.name}</p>
                          <p className="text-xs text-[hsl(var(--muted-foreground))] font-mono">
                            {c.id.slice(0, 8)}…
                          </p>
                        </div>
                      </div>
                    </Td>
                    <Td className="font-mono text-xs">{c.phone ?? "—"}</Td>
                    <Td className="text-xs text-[hsl(var(--muted-foreground))]">
                      {c.branchId ?? "Bandung / Jabar / Samarinda"}
                    </Td>
                    <Td>
                      {c.phone && (
                        <a
                          href={`https://wa.me/${c.phone.replace(/\D/g, "").replace(/^0/, "62")}?text=${encodeURIComponent(`Halo Kak ${c.name}, ada jadwal kloter kuliner viral Bandung terbaru di Bawabawa.id!`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-2.5 py-1 text-xs font-semibold hover:bg-[#F5DFAD]"
                        >
                          <MessageCircle className="h-3.5 w-3.5 text-[hsl(var(--sage-700))]" /> Chat WA
                        </a>
                      )}
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

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-left font-medium">{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3.5 align-middle ${className}`}>{children}</td>;
}
