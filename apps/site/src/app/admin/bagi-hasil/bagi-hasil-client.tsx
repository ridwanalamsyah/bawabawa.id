"use client";

import * as React from "react";
import { GlassCard } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Plus } from "lucide-react";

type Rule = {
  role: string;
  label?: string;
  percentage: number;
  description?: string;
};

type Settings = {
  rules: Rule[];
  reservePercentage: number;
};

const DEFAULT_RULES: Rule[] = [
  { role: "shopper", label: "Personal Shopper", percentage: 8 },
  { role: "admin", label: "Admin operasional", percentage: 2 },
  { role: "kurir", label: "Kurir / kargo handler", percentage: 5 },
];

export function BagiHasilClient() {
  const [rules, setRules] = React.useState<Rule[]>([]);
  const [reservePercentage, setReservePercentage] = React.useState<number>(0);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/admin/bagi-hasil", { cache: "no-store" });
        if (!res.ok) {
          if (!cancelled) setError(`Gagal memuat (${res.status})`);
          return;
        }
        const data = (await res.json()) as Settings;
        if (cancelled) return;
        setRules(data.rules?.length ? data.rules : DEFAULT_RULES);
        setReservePercentage(Number(data.reservePercentage) || 0);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Gagal terhubung ke server");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function updateRule(i: number, patch: Partial<Rule>) {
    setRules((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function removeRule(i: number) {
    setRules((prev) => prev.filter((_, idx) => idx !== i));
  }

  function addRule() {
    setRules((prev) => [...prev, { role: "", label: "", percentage: 0 }]);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/bagi-hasil", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          rules: rules.map((r) => ({
            ...r,
            percentage: Number(r.percentage) || 0,
          })),
          reservePercentage: Number(reservePercentage) || 0,
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(j?.error ?? `Gagal menyimpan (${res.status})`);
        return;
      }
      setMessage("Tersimpan.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal terhubung ke server");
    } finally {
      setSaving(false);
    }
  }

  const totalPercentage =
    rules.reduce((s, r) => s + (Number(r.percentage) || 0), 0) +
    (Number(reservePercentage) || 0);

  return (
    <div className="space-y-4">
      <GlassCard className="p-6">
        <h2 className="font-semibold">Aturan bagi hasil per peran</h2>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Tetapkan persentase dari margin yang dibagikan ke tiap peran. Total
          tidak harus 100% — selisihnya jadi laba operasional.
        </p>

        {loading ? (
          <p className="mt-4 text-sm text-[hsl(var(--muted-foreground))]">Memuat…</p>
        ) : (
          <div className="mt-5 space-y-3">
            {rules.map((r, i) => (
              <div
                key={`rule-${i}`}
                className="grid gap-3 sm:grid-cols-12 items-end rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-3"
              >
                <div className="sm:col-span-3">
                  <Label htmlFor={`role-${i}`}>Peran (kode)</Label>
                  <Input
                    id={`role-${i}`}
                    placeholder="shopper"
                    value={r.role}
                    onChange={(e) => updateRule(i, { role: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-4">
                  <Label htmlFor={`label-${i}`}>Label</Label>
                  <Input
                    id={`label-${i}`}
                    placeholder="Personal Shopper"
                    value={r.label ?? ""}
                    onChange={(e) => updateRule(i, { label: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-3">
                  <Label htmlFor={`pct-${i}`}>%</Label>
                  <Input
                    id={`pct-${i}`}
                    type="number"
                    inputMode="decimal"
                    step="0.5"
                    min="0"
                    max="100"
                    value={String(r.percentage)}
                    onChange={(e) =>
                      updateRule(i, { percentage: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="sm:col-span-2 flex sm:justify-end">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => removeRule(i)}
                  >
                    <Trash2 className="h-4 w-4" /> Hapus
                  </Button>
                </div>
              </div>
            ))}

            <div>
              <Button type="button" size="sm" variant="outline" onClick={addRule}>
                <Plus className="h-4 w-4" /> Tambah peran
              </Button>
            </div>
          </div>
        )}
      </GlassCard>

      <GlassCard className="p-6">
        <h2 className="font-semibold">Cadangan operasional</h2>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Persentase margin yang disisihkan untuk biaya operasional / cadangan
          klaim kerusakan paket.
        </p>
        <div className="mt-5 max-w-xs">
          <Label htmlFor="reserve">% cadangan</Label>
          <Input
            id="reserve"
            type="number"
            inputMode="decimal"
            step="0.5"
            min="0"
            max="100"
            value={String(reservePercentage)}
            onChange={(e) => setReservePercentage(Number(e.target.value))}
          />
        </div>

        <p className="mt-4 text-xs text-[hsl(var(--muted-foreground))]">
          Total alokasi sekarang: <strong>{totalPercentage.toFixed(1)}%</strong>{" "}
          (sisanya {Math.max(0, 100 - totalPercentage).toFixed(1)}% jadi laba).
        </p>

        <div className="mt-5 flex items-center gap-3">
          <Button onClick={handleSave} variant="primary" disabled={saving || loading}>
            {saving ? "Menyimpan…" : "Simpan perubahan"}
          </Button>
          {message && (
            <span className="text-sm text-[hsl(var(--emerald-600))]">{message}</span>
          )}
          {error && (
            <span className="text-sm text-[hsl(var(--rose-700))]">{error}</span>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
