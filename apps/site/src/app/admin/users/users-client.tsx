"use client";

/**
 * Admin user management table. Talks to `/api/admin/users` (BFF) which
 * forwards to the ERP `/api/v1/admin/users*` endpoints with the signed-in
 * admin's bearer token.
 */

import * as React from "react";
import { errorMessage } from "@/lib/order-requests";
import { Loader2, CheckCircle2, ShieldOff, Mail, UserPlus, RotateCcw } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type AdminUser = {
  id: string;
  email: string;
  fullName: string;
  division: string;
  status: "pending" | "active" | "suspended" | string;
  isActive: boolean;
  oauthProvider: string | null;
  pictureUrl: string | null;
  createdAt: string;
  approvedAt: string | null;
  approvedBy: string | null;
};

type StatusFilter = "pending" | "active" | "suspended" | "all";

const FILTER_LABELS: Record<StatusFilter, string> = {
  pending: "Menunggu",
  active: "Aktif",
  suspended: "Dihentikan",
  all: "Semua",
};

const DIVISION_LABEL: Record<string, string> = {
  owner: "Pemilik",
  admin: "Admin",
  operations: "Operasional",
  finance: "Keuangan",
  support: "Layanan pembeli",
  shopper: "Pembelanja",
  sales: "Penjualan",
  gudang: "Gudang",
};

const DIVISIONS = ["owner", "admin", "operations", "finance", "support", "shopper", "sales", "gudang"];

export function UsersAdminClient() {
  const [filter, setFilter] = React.useState<StatusFilter>("pending");
  const [users, setUsers] = React.useState<AdminUser[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [showInvite, setShowInvite] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users?status=${filter}`);
      const json = (await res.json().catch(() => null)) as { data?: AdminUser[]; error?: string } | null;
      if (!res.ok || !json?.data) {
        setError(errorMessage(json, "Daftar tim belum bisa dimuat. Coba muat ulang."));
        setUsers([]);
        return;
      }
      setUsers(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal terhubung ke server.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  React.useEffect(() => {
    // The lint rule flags setState-in-effect because most of the time it
    // signals a missing memoization. Here it's the standard pattern for
    // "fetch on mount and on filter change" — load() unavoidably calls
    // setLoading/setUsers/etc to drive the table.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function act(userId: string, action: "approve" | "suspend" | "reactivate", payload?: Record<string, unknown>) {
    setBusyId(userId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}/${action}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload ?? {}),
      });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setError(errorMessage(json, "Perubahan belum tersimpan. Coba lagi."));
        return;
      }
      await load();
    } finally {
      setBusyId(null);
    }
  }

  const counts = React.useMemo(() => {
    if (!users) return { pending: 0, active: 0, suspended: 0 };
    return users.reduce(
      (acc, u) => {
        if (u.status === "pending") acc.pending += 1;
        else if (u.status === "active") acc.active += 1;
        else if (u.status === "suspended") acc.suspended += 1;
        return acc;
      },
      { pending: 0, active: 0, suspended: 0 },
    );
  }, [users]);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(Object.keys(FILTER_LABELS) as StatusFilter[]).map((key) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-full border px-3 py-1.5 text-sm transition ${
              filter === key
                ? "border-[hsl(var(--sage-700))] bg-[hsl(var(--sage-700))] text-white"
                : "border-[hsl(var(--border))] bg-[hsl(var(--surface))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface-2))]"
            }`}
          >
            {FILTER_LABELS[key]}
            {filter === "all" && key !== "all" && users && (
              <span className="ml-1 opacity-60">{counts[key as keyof typeof counts]}</span>
            )}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => void load()} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
            Muat ulang
          </Button>
          <Button size="sm" variant="primary" onClick={() => setShowInvite((v) => !v)}>
            <UserPlus className="h-4 w-4" />
            Tambah orang
          </Button>
        </div>
      </div>

      {showInvite && (
        <InviteForm
          onSubmit={async (payload) => {
            const res = await fetch("/api/admin/users/invite", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify(payload),
            });
            const json = (await res.json().catch(() => null)) as { error?: string } | null;
            if (!res.ok) {
              return errorMessage(json, "Undangan belum terkirim. Coba lagi.");
            }
            setShowInvite(false);
            await load();
            return null;
          }}
          onCancel={() => setShowInvite(false)}
        />
      )}

      {error && (
        <div className="mb-4 rounded-xl border border-[hsl(var(--rose-500)/0.4)] bg-[hsl(var(--rose-500)/0.08)] p-3 text-sm text-[hsl(var(--rose-700))]">
          {error}
        </div>
      )}

      {users === null ? (
        <Card className="p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
          <Loader2 className="mx-auto mb-2 h-4 w-4 animate-spin" />
          Memuat…
        </Card>
      ) : users.length === 0 ? (
        <Card className="p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
          {filter === "pending" ? "Tidak ada yang menunggu persetujuan." : "Belum ada orang di daftar ini."}
        </Card>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {users.map((u) => {
            const busy = busyId === u.id;
            const spinner = busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null;
            return (
              <li key={u.id}>
                <Card className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar name={u.fullName || u.email} size={40} src={u.pictureUrl ?? undefined} />
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 font-medium">
                        {u.fullName || u.email} <StatusBadge status={u.status} />
                      </p>
                      <p className="truncate text-sm text-[hsl(var(--muted-foreground))]">{u.email}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        {DIVISION_LABEL[u.division] ?? u.division} · sejak{" "}
                        {new Date(u.createdAt).toLocaleDateString("id-ID", { year: "numeric", month: "short", day: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {u.status === "pending" && (
                      <Button size="sm" variant="primary" disabled={busy} onClick={() => void act(u.id, "approve")}>
                        {spinner ?? <CheckCircle2 className="h-3.5 w-3.5" />} Izinkan masuk
                      </Button>
                    )}
                    {u.status === "active" && (
                      <Button size="sm" variant="outline" disabled={busy} onClick={() => void act(u.id, "suspend")}>
                        {spinner ?? <ShieldOff className="h-3.5 w-3.5" />} Hentikan akses
                      </Button>
                    )}
                    {u.status === "suspended" && (
                      <Button size="sm" variant="outline" disabled={busy} onClick={() => void act(u.id, "reactivate")}>
                        {spinner ?? <CheckCircle2 className="h-3.5 w-3.5" />} Aktifkan lagi
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" asChild>
                      <a href={`mailto:${u.email}`}>
                        <Mail className="h-3.5 w-3.5" /> Kirim email
                      </a>
                    </Button>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-4 text-xs text-[hsl(var(--muted-foreground))]">
        Tim masuk pakai akun Google. Untuk menambah orang, tekan &ldquo;Tambah orang&rdquo; dan isi email Gmail-nya. Orang yang mencoba masuk sendiri akan muncul di &ldquo;Menunggu&rdquo; dan perlu kamu izinkan.
      </p>
    </>
  );
}

function InviteForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (payload: { email: string; fullName: string; division: string }) => Promise<string | null>;
  onCancel: () => void;
}) {
  const [email, setEmail] = React.useState("");
  const [fullName, setFullName] = React.useState("");
  const [division, setDivision] = React.useState("admin");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const err = await onSubmit({ email, fullName, division });
    if (err) setError(err);
    setBusy(false);
  }

  return (
    <Card className="mb-4 p-4">
      <form className="grid grid-cols-1 gap-3 sm:grid-cols-4" onSubmit={submit}>
        <label className="flex flex-col gap-1 text-xs">
          <span className="font-medium">Email Gmail</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@gmail.com"
            className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--sage-500)/0.3)]"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="font-medium">Nama lengkap</span>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Salsa Aprilia"
            className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--sage-500)/0.3)]"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="font-medium">Tugas</span>
          <select
            value={division}
            onChange={(e) => setDivision(e.target.value)}
            className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--sage-500)/0.3)]"
          >
            {DIVISIONS.map((d) => (
              <option key={d} value={d}>
                {DIVISION_LABEL[d] ?? d}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end gap-2">
          <Button type="submit" variant="primary" disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            Tambahkan
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Batal
          </Button>
        </div>
        {error && (
          <p className="col-span-full text-sm text-[hsl(var(--rose-700))]">{error}</p>
        )}
      </form>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "active") {
    return <Badge className="bg-[hsl(var(--emerald-500)/0.15)] text-[hsl(var(--emerald-700))]">Aktif</Badge>;
  }
  if (status === "pending") {
    return <Badge className="bg-[hsl(var(--amber-500)/0.15)] text-[hsl(var(--amber-700))]">Menunggu</Badge>;
  }
  if (status === "suspended") {
    return <Badge className="bg-[hsl(var(--rose-500)/0.15)] text-[hsl(var(--rose-700))]">Dihentikan</Badge>;
  }
  return <Badge>{status}</Badge>;
}
