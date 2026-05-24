"use client";

import * as React from "react";
import {
  Plus,
  Loader2,
  Trash2,
  Eye,
  EyeOff,
  Save,
  Plane,
} from "lucide-react";
import { Card, GlassCard } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Trip = {
  id: string;
  code: string;
  origin: string;
  destination: string;
  departAt: string;
  arriveEstimateAt: string | null;
  capacityKg: number;
  bookedKg: number;
  baseFee: number;
  perKgFee: number;
  status: "open" | "in_transit" | "fullbooked" | "closed";
  popularCategories: string[];
  notes: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

type FormState = {
  code: string;
  origin: string;
  destination: string;
  departAt: string;
  arriveEstimateAt: string;
  capacityKg: string;
  bookedKg: string;
  baseFee: string;
  perKgFee: string;
  status: Trip["status"];
  popularCategories: string;
  notes: string;
  isPublished: boolean;
};

const emptyForm: FormState = {
  code: "",
  origin: "Bandung",
  destination: "Samarinda",
  departAt: "",
  arriveEstimateAt: "",
  capacityKg: "200",
  bookedKg: "0",
  baseFee: "0",
  perKgFee: "0",
  status: "open",
  popularCategories: "",
  notes: "",
  isPublished: false,
};

function toIsoLocal(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function isoToInput(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function TripsClient() {
  const [trips, setTrips] = React.useState<Trip[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [showForm, setShowForm] = React.useState(false);

  const reload = React.useCallback(async () => {
    try {
      const res = await fetch("/api/admin/trips", { cache: "no-store" });
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { error?: string };
        setError(payload.error ?? `HTTP ${res.status}`);
        return;
      }
      const data = (await res.json()) as Trip[];
      setTrips(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat trip");
    }
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/admin/trips", { cache: "no-store" });
        if (cancelled) return;
        if (!res.ok) {
          const payload = (await res.json().catch(() => ({}))) as { error?: string };
          setError(payload.error ?? `HTTP ${res.status}`);
          return;
        }
        const data = (await res.json()) as Trip[];
        if (cancelled) return;
        setTrips(data);
        setError(null);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Gagal memuat trip");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <Card className="p-6 border-[hsl(var(--destructive)/0.4)] bg-[hsl(var(--destructive)/0.05)]">
        <p className="text-sm font-medium">Gagal memuat daftar trip</p>
        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{error}</p>
      </Card>
    );
  }

  if (trips === null) {
    return (
      <Card className="p-10 text-center text-sm text-[hsl(var(--muted-foreground))]">
        <Loader2 className="mx-auto h-5 w-5 animate-spin" />
        <p className="mt-2">Memuat trip…</p>
      </Card>
    );
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2 justify-between">
        <div className="flex flex-wrap gap-4 text-sm">
          <Stat label="Total trip" value={trips.length.toString()} />
          <Stat
            label="Published"
            value={trips.filter((t) => t.isPublished && t.status !== "closed").length.toString()}
          />
          <Stat label="Closed" value={trips.filter((t) => t.status === "closed").length.toString()} />
        </div>
        <Button onClick={() => setShowForm((v) => !v)} variant="primary">
          <Plus className="h-4 w-4" /> {showForm ? "Tutup form" : "Trip baru"}
        </Button>
      </div>

      {showForm && (
        <TripForm
          onCancel={() => setShowForm(false)}
          onCreated={async () => {
            setShowForm(false);
            await reload();
          }}
        />
      )}

      {trips.length === 0 ? (
        <Card className="p-10 text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-[hsl(var(--surface-2))] grid place-items-center text-[hsl(var(--muted-foreground))]">
            <Plane className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-lg font-semibold tracking-tight">Belum ada trip</h3>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))] max-w-md mx-auto">
            Buat trip pertama lewat tombol di atas. Trip baru tampil di /open-trip
            hanya setelah kamu mengaktifkan toggle Publish.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {trips.map((t) => (
            <TripRow key={t.id} trip={t} onChanged={reload} />
          ))}
        </div>
      )}
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[hsl(var(--surface-2))] px-3 py-2">
      <p className="text-[11px] text-[hsl(var(--muted-foreground))]">{label}</p>
      <p className="text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function TripForm({
  onCancel,
  onCreated,
}: {
  onCancel: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = React.useState<FormState>(emptyForm);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const departAtIso = toIsoLocal(form.departAt);
    if (!departAtIso) {
      setError("Tanggal berangkat harus diisi");
      return;
    }
    setSaving(true);
    try {
      const body = {
        code: form.code.trim(),
        origin: form.origin.trim(),
        destination: form.destination.trim(),
        departAt: departAtIso,
        arriveEstimateAt: toIsoLocal(form.arriveEstimateAt),
        capacityKg: Math.max(0, Number(form.capacityKg) || 0),
        bookedKg: Math.max(0, Number(form.bookedKg) || 0),
        baseFee: Math.max(0, Number(form.baseFee) || 0),
        perKgFee: Math.max(0, Number(form.perKgFee) || 0),
        status: form.status,
        popularCategories: form.popularCategories
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0)
          .slice(0, 8),
        notes: form.notes.trim() === "" ? null : form.notes.trim(),
        isPublished: form.isPublished,
      };
      const res = await fetch("/api/admin/trips", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? `HTTP ${res.status}`);
      }
      onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  return (
    <GlassCard className="p-6 mb-4">
      <form onSubmit={submit} className="space-y-4">
        <h3 className="font-semibold">Trip baru</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field label="Kode trip" hint="Huruf besar/angka/-, mis. BDG-SMD-244">
            <Input
              required
              value={form.code}
              onChange={(e) => set("code", e.target.value.toUpperCase())}
              placeholder="BDG-SMD-244"
            />
          </Field>
          <Field label="Asal">
            <Input
              required
              value={form.origin}
              onChange={(e) => set("origin", e.target.value)}
            />
          </Field>
          <Field label="Tujuan">
            <Input
              required
              value={form.destination}
              onChange={(e) => set("destination", e.target.value)}
            />
          </Field>
          <Field label="Berangkat">
            <Input
              required
              type="datetime-local"
              value={form.departAt}
              onChange={(e) => set("departAt", e.target.value)}
            />
          </Field>
          <Field label="Estimasi tiba">
            <Input
              type="datetime-local"
              value={form.arriveEstimateAt}
              onChange={(e) => set("arriveEstimateAt", e.target.value)}
            />
          </Field>
          <Field label="Status">
            <select
              className="h-11 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-3 text-sm"
              value={form.status}
              onChange={(e) => set("status", e.target.value as Trip["status"])}
            >
              <option value="open">Open (slot tersedia)</option>
              <option value="fullbooked">Fullbooked</option>
              <option value="in_transit">Dalam perjalanan</option>
              <option value="closed">Closed (sembunyi)</option>
            </select>
          </Field>
          <Field label="Kapasitas (kg)">
            <Input
              type="number"
              min="0"
              value={form.capacityKg}
              onChange={(e) => set("capacityKg", e.target.value)}
            />
          </Field>
          <Field label="Sudah terisi (kg)">
            <Input
              type="number"
              min="0"
              value={form.bookedKg}
              onChange={(e) => set("bookedKg", e.target.value)}
            />
          </Field>
          <Field label="Base fee (Rp)" hint="Optional">
            <Input
              type="number"
              min="0"
              value={form.baseFee}
              onChange={(e) => set("baseFee", e.target.value)}
            />
          </Field>
          <Field label="Fee per kg (Rp)" hint="Optional">
            <Input
              type="number"
              min="0"
              value={form.perKgFee}
              onChange={(e) => set("perKgFee", e.target.value)}
            />
          </Field>
          <Field label="Kategori populer" hint="Pisahkan koma, mis: Fashion, Sepatu">
            <Input
              value={form.popularCategories}
              onChange={(e) => set("popularCategories", e.target.value)}
              placeholder="Fashion, Sepatu, Skincare"
            />
          </Field>
          <Field label="Catatan internal" hint="Tidak tampil ke customer">
            <Input
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </Field>
        </div>
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isPublished}
            onChange={(e) => set("isPublished", e.target.checked)}
          />
          Langsung publish ke /open-trip
        </label>
        {error && (
          <p className="text-xs text-[hsl(var(--destructive))]">{error}</p>
        )}
        <div className="flex flex-wrap gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
            Batal
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Simpan
          </Button>
        </div>
      </form>
    </GlassCard>
  );
}

function TripRow({
  trip,
  onChanged,
}: {
  trip: Trip;
  onChanged: () => void | Promise<void>;
}) {
  const [busy, setBusy] = React.useState(false);
  const [editing, setEditing] = React.useState(false);

  async function patch(body: Partial<Trip>) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/trips/${trip.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? `HTTP ${res.status}`);
      }
      await onChanged();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Gagal menyimpan");
    } finally {
      setBusy(false);
    }
  }

  async function destroy() {
    if (!window.confirm(`Hapus trip ${trip.code}? Tindakan ini tidak bisa di-undo.`)) {
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/trips/${trip.id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        const payload = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? `HTTP ${res.status}`);
      }
      await onChanged();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Gagal menghapus");
    } finally {
      setBusy(false);
    }
  }

  return (
    <GlassCard className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-mono text-[hsl(var(--muted-foreground))]">
            {trip.code}
          </p>
          <h4 className="mt-0.5 font-semibold truncate">
            {trip.origin} → {trip.destination}
          </h4>
          <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
            Berangkat{" "}
            {new Date(trip.departAt).toLocaleString("id-ID", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {trip.isPublished ? (
            <Badge variant="success">Published</Badge>
          ) : (
            <Badge variant="warning">Draft</Badge>
          )}
          <Badge variant="neutral">{trip.status}</Badge>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[hsl(var(--muted-foreground))]">
        <span>
          Kapasitas:{" "}
          <span className="text-[hsl(var(--foreground))] font-medium">
            {trip.bookedKg}/{trip.capacityKg} kg
          </span>
        </span>
        <span>
          Fee/kg:{" "}
          <span className="text-[hsl(var(--foreground))] font-medium tabular-nums">
            Rp {trip.perKgFee.toLocaleString("id-ID")}
          </span>
        </span>
      </div>

      {trip.popularCategories.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {trip.popularCategories.map((c) => (
            <Badge key={c} variant="neutral">
              {c}
            </Badge>
          ))}
        </div>
      )}

      {editing && (
        <InlineEdit
          trip={trip}
          busy={busy}
          onCancel={() => setEditing(false)}
          onSubmit={async (changes) => {
            await patch(changes);
            setEditing(false);
          }}
        />
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => void patch({ isPublished: !trip.isPublished })}
        >
          {trip.isPublished ? (
            <>
              <EyeOff className="h-3.5 w-3.5" /> Unpublish
            </>
          ) : (
            <>
              <Eye className="h-3.5 w-3.5" /> Publish
            </>
          )}
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => setEditing((v) => !v)}
        >
          {editing ? "Tutup edit" : "Edit"}
        </Button>
        <Button size="sm" variant="ghost" disabled={busy} onClick={() => void destroy()}>
          <Trash2 className="h-3.5 w-3.5" /> Hapus
        </Button>
      </div>
    </GlassCard>
  );
}

function InlineEdit({
  trip,
  busy,
  onCancel,
  onSubmit,
}: {
  trip: Trip;
  busy: boolean;
  onCancel: () => void;
  onSubmit: (changes: Partial<Trip>) => void | Promise<void>;
}) {
  const [departAt, setDepartAt] = React.useState(isoToInput(trip.departAt));
  const [arriveEstimateAt, setArriveEstimateAt] = React.useState(
    isoToInput(trip.arriveEstimateAt),
  );
  const [capacityKg, setCapacityKg] = React.useState(String(trip.capacityKg));
  const [bookedKg, setBookedKg] = React.useState(String(trip.bookedKg));
  const [status, setStatus] = React.useState<Trip["status"]>(trip.status);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const next: Partial<Trip> = {
          status,
          capacityKg: Math.max(0, Number(capacityKg) || 0),
          bookedKg: Math.max(0, Number(bookedKg) || 0),
        };
        const dIso = toIsoLocal(departAt);
        if (dIso) next.departAt = dIso;
        next.arriveEstimateAt = toIsoLocal(arriveEstimateAt);
        void onSubmit(next);
      }}
      className="mt-4 rounded-2xl border border-[hsl(var(--border))] p-4 space-y-3"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Berangkat">
          <Input
            type="datetime-local"
            value={departAt}
            onChange={(e) => setDepartAt(e.target.value)}
          />
        </Field>
        <Field label="Estimasi tiba">
          <Input
            type="datetime-local"
            value={arriveEstimateAt}
            onChange={(e) => setArriveEstimateAt(e.target.value)}
          />
        </Field>
        <Field label="Kapasitas (kg)">
          <Input
            type="number"
            min="0"
            value={capacityKg}
            onChange={(e) => setCapacityKg(e.target.value)}
          />
        </Field>
        <Field label="Terisi (kg)">
          <Input
            type="number"
            min="0"
            value={bookedKg}
            onChange={(e) => setBookedKg(e.target.value)}
          />
        </Field>
        <Field label="Status">
          <select
            className="h-11 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-3 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value as Trip["status"])}
          >
            <option value="open">Open</option>
            <option value="fullbooked">Fullbooked</option>
            <option value="in_transit">Dalam perjalanan</option>
            <option value="closed">Closed</option>
          </select>
        </Field>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" size="sm" variant="outline" onClick={onCancel} disabled={busy}>
          Batal
        </Button>
        <Button type="submit" size="sm" variant="primary" disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Simpan
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      {children}
      {hint && (
        <p className="text-[11px] text-[hsl(var(--muted-foreground))]">{hint}</p>
      )}
    </div>
  );
}
