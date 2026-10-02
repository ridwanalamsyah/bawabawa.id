"use client";

import * as React from "react";
import { Save, Loader2 } from "lucide-react";
import { Card, GlassCard } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/**
 * Editable site settings backed by `site_settings` rows in the CMS module.
 * Each section maps a known setting_key (brand, contact, social, pricing,
 * shipping) to a flat key/value form. Submit calls `PUT /api/admin/settings/:key`
 * which goes through the BFF + ERP `cms:manage` permission gate.
 */

type SettingValue = Record<string, unknown> | unknown[] | null;
type SettingRow = {
  /** The ERP returns `key`; older payloads used `setting_key`. */
  key?: string;
  setting_key?: string;
  value: SettingValue;
  description: string | null;
  updated_at: string;
};

type SectionField = {
  key: string;
  label: string;
  type?: "text" | "number" | "url" | "email";
  placeholder?: string;
};

type Section = {
  settingKey: string;
  title: string;
  description: string;
  fields: SectionField[];
};

const SECTIONS: Section[] = [
  {
    settingKey: "brand",
    title: "Brand",
    description: "Identitas brand yang ditampilkan di seluruh halaman publik.",
    fields: [
      { key: "name", label: "Nama brand" },
      { key: "shortName", label: "Nama pendek" },
      { key: "tagline", label: "Tagline" },
      { key: "monogram", label: "Monogram (2 huruf)" },
      { key: "logoUrl", label: "Logo URL", type: "url" },
      { key: "primaryColor", label: "Warna utama (hex)" },
      { key: "accentColor", label: "Warna aksen (hex)" },
    ],
  },
  {
    settingKey: "contact",
    title: "Kontak",
    description: "Tampil di footer, halaman /kontak, dan halaman tentang.",
    fields: [
      { key: "email", label: "Email", type: "email" },
      { key: "phone", label: "WhatsApp / Telepon" },
      { key: "address", label: "Alamat" },
      { key: "supportHours", label: "Jam operasional" },
    ],
  },
  {
    settingKey: "social",
    title: "Sosial media",
    description: "URL profil sosial — kosongkan kalau belum ada.",
    fields: [
      { key: "instagram", label: "Instagram URL", type: "url" },
      { key: "tiktok", label: "TikTok URL", type: "url" },
      { key: "youtube", label: "YouTube URL", type: "url" },
      { key: "linkedin", label: "LinkedIn URL", type: "url" },
    ],
  },
];

export function SettingsClient() {
  const [settings, setSettings] = React.useState<Record<string, SettingValue>>({});
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/admin/settings", { cache: "no-store" });
        if (!res.ok) {
          const payload = (await res.json().catch(() => ({}))) as { error?: string };
          if (!cancelled) setError(payload.error ?? `HTTP ${res.status}`);
          return;
        }
        const rows = (await res.json()) as SettingRow[];
        const next: Record<string, SettingValue> = {};
        for (const r of rows) {
          const k = r.key ?? r.setting_key;
          if (k) next[k] = r.value;
        }
        if (!cancelled) setSettings(next);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Gagal memuat pengaturan");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <Card className="p-10 text-center text-sm text-[hsl(var(--muted-foreground))]">
        <Loader2 className="mx-auto h-5 w-5 animate-spin" />
        <p className="mt-2">Memuat pengaturan…</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 border-[hsl(var(--destructive)/0.4)] bg-[hsl(var(--destructive)/0.05)]">
        <p className="text-sm font-medium">Gagal memuat pengaturan</p>
        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{error}</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <MotionForm
        initialValue={settings.site_motion ?? {}}
        onSaved={(v) => setSettings((prev) => ({ ...prev, site_motion: v }))}
      />
      {SECTIONS.map((section) => (
        <SectionForm
          key={section.settingKey}
          section={section}
          initialValue={settings[section.settingKey] ?? {}}
          onSaved={(v) =>
            setSettings((prev) => ({ ...prev, [section.settingKey]: v }))
          }
        />
      ))}
    </div>
  );
}

function SectionForm({
  section,
  initialValue,
  onSaved,
}: {
  section: Section;
  initialValue: SettingValue;
  onSaved: (value: SettingValue) => void;
}) {
  const base = (initialValue && typeof initialValue === "object" && !Array.isArray(initialValue)
    ? (initialValue as Record<string, unknown>)
    : {}) as Record<string, unknown>;

  const [values, setValues] = React.useState<Record<string, string>>(() => {
    const out: Record<string, string> = {};
    for (const f of section.fields) {
      const v = base[f.key];
      out[f.key] = typeof v === "string" ? v : v == null ? "" : String(v);
    }
    return out;
  });
  const [saving, setSaving] = React.useState(false);
  const [status, setStatus] = React.useState<
    { kind: "ok" | "error"; message: string } | null
  >(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      const merged: Record<string, unknown> = { ...base };
      for (const f of section.fields) {
        const v = values[f.key]?.trim() ?? "";
        merged[f.key] = v === "" ? null : v;
      }
      const res = await fetch(`/api/admin/settings/${encodeURIComponent(section.settingKey)}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ value: merged }),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? `HTTP ${res.status}`);
      }
      const updated = (await res.json()) as SettingRow;
      onSaved(updated.value);
      setStatus({ kind: "ok", message: "Tersimpan" });
    } catch (e) {
      setStatus({
        kind: "error",
        message: e instanceof Error ? e.message : "Gagal menyimpan",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <GlassCard className="p-6">
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <h3 className="font-semibold">{section.title}</h3>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            {section.description}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {section.fields.map((field) => (
            <div key={field.key} className="grid gap-1.5">
              <Label htmlFor={`${section.settingKey}-${field.key}`}>{field.label}</Label>
              <Input
                id={`${section.settingKey}-${field.key}`}
                type={field.type ?? "text"}
                placeholder={field.placeholder}
                value={values[field.key]}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                }
              />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-[hsl(var(--muted-foreground))]">
            {status?.kind === "ok" && (
              <span className="text-[hsl(var(--emerald-600))]">{status.message}</span>
            )}
            {status?.kind === "error" && (
              <span className="text-[hsl(var(--destructive))]">{status.message}</span>
            )}
          </span>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Simpan
          </Button>
        </div>
      </form>
    </GlassCard>
  );
}

const MOTION_SWITCHES = [
  {
    key: "animations",
    label: "Animasi situs",
    hint: "Semua gerakan di situs publik: teks muncul bertahap, efek scroll, hover, transisi.",
  },
  {
    key: "heroVisual",
    label: "Ilustrasi hero",
    hint: "Rute Bandung → Samarinda dengan pesawat, contoh pesanan, dan estimasi tiba di beranda.",
  },
  {
    key: "ambient",
    label: "Efek latar (orb)",
    hint: "Bulatan warna blur yang bergerak pelan di belakang hero.",
  },
] as const;

/** Admin-only switches for site animation (CMS setting `site_motion`). */
function MotionForm({
  initialValue,
  onSaved,
}: {
  initialValue: SettingValue;
  onSaved: (value: SettingValue) => void;
}) {
  const base = (initialValue && typeof initialValue === "object" && !Array.isArray(initialValue)
    ? (initialValue as Record<string, unknown>)
    : {}) as Record<string, unknown>;
  const [values, setValues] = React.useState<Record<string, boolean>>(() =>
    Object.fromEntries(MOTION_SWITCHES.map((s) => [s.key, base[s.key] !== false])),
  );
  const [saving, setSaving] = React.useState(false);
  const [status, setStatus] = React.useState<{ kind: "ok" | "error"; message: string } | null>(null);

  async function save(next: Record<string, boolean>) {
    setValues(next);
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/admin/settings/site_motion", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ value: next, description: "Animasi situs publik" }),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? `HTTP ${res.status}`);
      }
      const updated = (await res.json()) as SettingRow;
      onSaved(updated.value);
      setStatus({ kind: "ok", message: "Tersimpan — situs diperbarui dalam ±1 menit" });
    } catch (e) {
      setValues(values);
      setStatus({ kind: "error", message: e instanceof Error ? e.message : "Gagal menyimpan" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <GlassCard className="p-6">
      <div>
        <h3 className="font-semibold">Animasi</h3>
        <p className="text-xs text-[hsl(var(--muted-foreground))]">
          Atur gerakan di situs publik. Berlaku untuk semua pengunjung.
        </p>
      </div>
      <ul className="mt-4 divide-y divide-[hsl(var(--border))]">
        {MOTION_SWITCHES.map((sw) => {
          const on = values[sw.key];
          const disabled = saving || (sw.key !== "animations" && !values.animations);
          return (
            <li key={sw.key} className="flex items-start justify-between gap-4 py-3">
              <div>
                <p className="text-sm font-medium">{sw.label}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">{sw.hint}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                aria-label={sw.label}
                disabled={disabled}
                onClick={() => void save({ ...values, [sw.key]: !on })}
                className={
                  "relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 " +
                  (on ? "bg-[hsl(var(--sage-700))]" : "bg-[hsl(var(--border))]")
                }
              >
                <span
                  className={
                    "inline-block h-5 w-5 rounded-full bg-white shadow transition-transform " +
                    (on ? "translate-x-5" : "translate-x-0.5")
                  }
                />
              </button>
            </li>
          );
        })}
      </ul>
      {status && (
        <p
          className={
            "mt-3 text-xs " +
            (status.kind === "ok" ? "text-[hsl(var(--emerald-600))]" : "text-[hsl(var(--destructive))]")
          }
        >
          {status.message}
        </p>
      )}
    </GlassCard>
  );
}
