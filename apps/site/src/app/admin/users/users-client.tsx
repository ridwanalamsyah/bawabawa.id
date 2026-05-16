"use client";

/**
 * Admin user management table. Talks to `/api/admin/users` (BFF) which
 * forwards to the ERP `/api/v1/admin/users*` endpoints with the signed-in
 * admin's bearer token.
 */

import * as React from "react";
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
  pending: "Menunggu approve",
  active: "Aktif",
  suspended: "Suspended",
  all: "Semua",
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
        setError(json?.error ?? `Gagal memuat daftar (${res.status})`);
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
        setError(json?.error ?? `Gagal ${action} (${res.status})`);
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
            Refresh
          </Button>
          <Button size="sm" variant="primary" onClick={() => setShowInvite((v) => !v)}>
            <UserPlus className="h-4 w-4" />
            Invite admin
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
              return json?.error ?? `Gagal invite (${res.status})`;
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

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[hsl(var(--surface-2))] text-xs text-[hsl(var(--muted-foreground))]">
              <tr>
                <Th>Akun</Th>
                <Th>Email</Th>
                <Th>Divisi</Th>
                <Th>Status</Th>
                <Th>Dibuat</Th>
                <Th className="text-right">Aksi</Th>
              </tr>
            </thead>
            <tbody>
              {users === null ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[hsl(var(--muted-foreground))]">
                    <Loader2 className="mx-auto mb-2 h-4 w-4 animate-spin" />
                    Memuat…
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[hsl(var(--muted-foreground))]">
                    {filter === "pending"
                      ? "Tidak ada user yang menunggu approval."
                      : "Belum ada user di kategori ini."}
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-t border-[hsl(var(--border))]">
                    <Td>
                      <div className="flex items-center gap-3">
                        <Avatar name={u.fullName || u.email} size={32} src={u.pictureUrl ?? undefined} />
                        <div>
                          <p className="font-medium">{u.fullName || u.email}</p>
                          <p className="text-xs text-[hsl(var(--muted-foreground))] font-mono">{u.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </Td>
                    <Td className="font-mono text-xs">{u.email}</Td>
                    <Td>{u.division}</Td>
                    <Td>
                      <StatusBadge status={u.status} />
                    </Td>
                    <Td className="text-xs text-[hsl(var(--muted-foreground))]">
                      {new Date(u.createdAt).toLocaleDateString("id-ID", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </Td>
                    <Td className="text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        {u.status === "pending" && (
                          <Button
                            size="sm"
                            variant="primary"
                            disabled={busyId === u.id}
                            onClick={() => void act(u.id, "approve")}
                          >
                            {busyId === u.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            )}
                            Approve
                          </Button>
                        )}
                        {u.status === "active" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busyId === u.id}
                            onClick={() => void act(u.id, "suspend")}
                          >
                            {busyId === u.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <ShieldOff className="h-3.5 w-3.5" />
                            )}
                            Suspend
                          </Button>
                        )}
                        {u.status === "suspended" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busyId === u.id}
                            onClick={() => void act(u.id, "reactivate")}
                          >
                            {busyId === u.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            )}
                            Aktifkan ulang
                          </Button>
                        )}
                        <a
                          href={`mailto:${u.email}`}
                          className="inline-flex items-center gap-1 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-2 py-1 text-xs text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--surface-2))]"
                          title="Email"
                        >
                          <Mail className="h-3 w-3" /> Email
                        </a>
                      </div>
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="mt-4 text-xs text-[hsl(var(--muted-foreground))]">
        Sign-in pakai Google. Admin pertama (Owner) di-seed manual di DB. Admin baru: invite via tombol di atas (atau biarkan pendaftar sign-in dulu lewat Google, lalu di-approve di sini).
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
          <span className="font-medium">Divisi</span>
          <select
            value={division}
            onChange={(e) => setDivision(e.target.value)}
            className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--sage-500)/0.3)]"
          >
            {DIVISIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end gap-2">
          <Button type="submit" variant="primary" disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            Kirim invite
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
    return <Badge className="bg-[hsl(var(--rose-500)/0.15)] text-[hsl(var(--rose-700))]">Suspended</Badge>;
  }
  return <Badge>{status}</Badge>;
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-4 py-2 text-left font-medium ${className}`}>{children}</th>
  );
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}
