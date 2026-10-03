"use client";

import * as React from "react";
import { Save, Loader2, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { Card, GlassCard } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/**
 * Everything staff can change on the public site without a developer:
 * contact, social links, homepage text, FAQ and animation. Each card saves
 * one CMS setting through PUT /api/admin/settings/:key.
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
  type?: "text" | "url" | "email" | "tel";
  placeholder?: string;
  hint?: string;
};

type Section = {
  settingKey: string;
  title: string;
  description: string;
  fields: SectionField[];
};

const SECTIONS: Section[] = [
  {
    settingKey: "contact",
    title: "Kontak",
    description: "Tampil di footer dan halaman Kontak.",
    fields: [
      { key: "phone", label: "Nomor WhatsApp", type: "tel", placeholder: "0812 3456 7890" },
      { key: "email", label: "Email", type: "email", placeholder: "halo@bawabawa.id" },
      { key: "address", label: "Alamat", placeholder: "Bandung, Jawa Barat" },
      { key: "supportHours", label: "Jam buka", placeholder: "Senin–Sabtu, 09.00–18.00 WIB" },
    ],
  },
  {
    settingKey: "social",
    title: "Sosial media",
    description: "Tempel link profil. Ikon hanya muncul di footer kalau link-nya diisi.",
    fields: [
      { key: "instagram", label: "Instagram", type: "url", placeholder: "https://instagram.com/bawabawa.id" },
      { key: "tiktok", label: "TikTok", type: "url", placeholder: "https://tiktok.com/@bawabawa.id" },
      { key: "youtube", label: "YouTube", type: "url", placeholder: "https://youtube.com/@bawabawa" },
    ],
  },
];

async function saveSetting(key: string, value: unknown): Promise<SettingRow> {
  const res = await fetch(`/api/admin/settings/${encodeURIComponent(key)}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ value }),
  });
  if (!res.ok) {
    const payload = (await res.json().catch(() => ({}))) as { error?: unknown };
    const msg = typeof payload.error === "string" ? payload.error : (payload.error as { message?: string } | undefined)?.message;
    throw new Error(msg ?? "Gagal menyimpan. Coba lagi.");
  }
  return (await res.json()) as SettingRow;
}

function asRecord(v: SettingValue): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

function SaveBar({ saving, status }: { saving: boolean; status: { kind: "ok" | "error"; message: string } | null }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs">
        {status?.kind === "ok" && <span className="text-[hsl(var(--emerald-600))]">{status.message}</span>}
        {status?.kind === "error" && <span className="text-[hsl(var(--destructive))]">{status.message}</span>}
      </span>
      <Button type="submit" variant="primary" disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Simpan
      </Button>
    </div>
  );
}

function useSaver(key: string, onSaved: (v: SettingValue) => void) {
  const [saving, setSaving] = React.useState(false);
  const [status, setStatus] = React.useState<{ kind: "ok" | "error"; message: string } | null>(null);
  const save = async (value: unknown) => {
    setSaving(true);
    setStatus(null);
    try {
      const updated = await saveSetting(key, value);
      onSaved(updated.value);
      setStatus({ kind: "ok", message: "Tersimpan. Situs berubah dalam ±1 menit." });
    } catch (e) {
      setStatus({ kind: "error", message: e instanceof Error ? e.message : "Gagal menyimpan" });
    } finally {
      setSaving(false);
    }
  };
  return { saving, status, save };
}

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
          if (!cancelled) setError("Pengaturan belum bisa dimuat. Coba muat ulang halaman.");
          return;
        }
        const rows = (await res.json()) as SettingRow[];
        const next: Record<string, SettingValue> = {};
        for (const r of rows) {
          const k = r.key ?? r.setting_key;
          if (k) next[k] = r.value;
        }
        if (!cancelled) setSettings(next);
      } catch {
        if (!cancelled) setError("Gagal terhubung. Periksa koneksi lalu muat ulang.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const saved = (key: string) => (v: SettingValue) => setSettings((prev) => ({ ...prev, [key]: v }));

  if (loading) {
    return (
      <Card className="p-10 text-center text-sm text-[hsl(var(--muted-foreground))]">
        <Loader2 className="mx-auto h-5 w-5 animate-spin" />
        <p className="mt-2">Memuat…</p>
      </Card>
    );
  }
  if (error) {
    return <Card className="p-6 text-sm">{error}</Card>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {SECTIONS.map((section) => (
        <SectionForm key={section.settingKey} section={section} initialValue={settings[section.settingKey] ?? {}} onSaved={saved(section.settingKey)} />
      ))}
      <HomepageForm initialValue={settings.homepage ?? {}} onSaved={saved("homepage")} />
      <MotionForm initialValue={settings.site_motion ?? {}} onSaved={saved("site_motion")} />
      <div className="lg:col-span-2">
        <FaqForm initialValue={settings.faq ?? {}} onSaved={saved("faq")} />
      </div>
    </div>
  );
}

function SectionForm({ section, initialValue, onSaved }: { section: Section; initialValue: SettingValue; onSaved: (value: SettingValue) => void }) {
  const base = asRecord(initialValue);
  const [values, setValues] = React.useState<Record<string, string>>(() =>
    Object.fromEntries(section.fields.map((f) => [f.key, typeof base[f.key] === "string" ? (base[f.key] as string) : ""])),
  );
  const { saving, status, save } = useSaver(section.settingKey, onSaved);

  return (
    <GlassCard className="p-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const merged: Record<string, unknown> = { ...base };
          for (const f of section.fields) merged[f.key] = values[f.key]?.trim() || null;
          void save(merged);
        }}
        className="space-y-4"
      >
        <div>
          <h3 className="font-semibold">{section.title}</h3>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">{section.description}</p>
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
                onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
        <SaveBar saving={saving} status={status} />
      </form>
    </GlassCard>
  );
}

function HomepageForm({ initialValue, onSaved }: { initialValue: SettingValue; onSaved: (value: SettingValue) => void }) {
  const base = asRecord(initialValue);
  const [words, setWords] = React.useState(() => (Array.isArray(base.heroWords) ? (base.heroWords as string[]).join("\n") : ""));
  const [subtitle, setSubtitle] = React.useState(() => (typeof base.heroSubtitle === "string" ? base.heroSubtitle : ""));
  const { saving, status, save } = useSaver("homepage", onSaved);
  const list = words.split("\n").map((w) => w.trim()).filter(Boolean).slice(0, 5);

  return (
    <GlassCard className="p-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save({ ...base, heroWords: list, heroSubtitle: subtitle.trim() || null });
        }}
        className="space-y-4"
      >
        <div>
          <h3 className="font-semibold">Teks beranda</h3>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Judul besar di atas: &ldquo;Titip … dari Bandung, sampai Samarinda.&rdquo;</p>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="hp-words">Kata yang bergantian (satu per baris, 2–5 kata)</Label>
          <Textarea id="hp-words" rows={5} value={words} onChange={(e) => setWords(e.target.value)} placeholder={"sepatu lokal\nskincare\noleh-oleh"} />
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            {list.length >= 2 ? `Pratinjau: Titip ${list[0]} dari Bandung…` : "Kosongkan untuk memakai kata bawaan."}
          </p>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="hp-sub">Kalimat di bawah judul</Label>
          <Input id="hp-sub" maxLength={140} value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Kami cek harga di toko, kamu bayar setelah setuju." />
        </div>
        <SaveBar saving={saving} status={status} />
      </form>
    </GlassCard>
  );
}

type Faq = { q: string; a: string };

function FaqForm({ initialValue, onSaved }: { initialValue: SettingValue; onSaved: (value: SettingValue) => void }) {
  const base = asRecord(initialValue);
  const [items, setItems] = React.useState<Faq[]>(() =>
    Array.isArray(base.items) ? (base.items as Faq[]).map((i) => ({ q: i.q ?? "", a: i.a ?? "" })) : [],
  );
  const { saving, status, save } = useSaver("faq", onSaved);
  const update = (i: number, patch: Partial<Faq>) => setItems((prev) => prev.map((it, j) => (j === i ? { ...it, ...patch } : it)));
  const move = (i: number, dir: -1 | 1) =>
    setItems((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  return (
    <GlassCard className="p-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save({ items: items.filter((i) => i.q.trim() && i.a.trim()).map((i) => ({ q: i.q.trim(), a: i.a.trim() })) });
        }}
        className="space-y-4"
      >
        <div>
          <h3 className="font-semibold">Tanya-jawab (FAQ)</h3>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            Tampil di bagian &ldquo;Pertanyaan umum&rdquo; beranda. Kalau kosong, situs memakai daftar bawaan.
          </p>
        </div>
        {items.length === 0 && <p className="text-sm text-[hsl(var(--muted-foreground))]">Belum ada pertanyaan khusus.</p>}
        <ol className="space-y-3">
          {items.map((it, i) => (
            <li key={i} className="rounded-xl border border-[hsl(var(--border))] p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">#{i + 1}</span>
                <div className="ml-auto flex gap-1">
                  <Button type="button" size="sm" variant="ghost" aria-label="Naikkan" onClick={() => move(i, -1)}>
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button type="button" size="sm" variant="ghost" aria-label="Turunkan" onClick={() => move(i, 1)}>
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button type="button" size="sm" variant="ghost" aria-label="Hapus" onClick={() => setItems((prev) => prev.filter((_, j) => j !== i))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Input aria-label={`Pertanyaan ${i + 1}`} placeholder="Pertanyaan" value={it.q} onChange={(e) => update(i, { q: e.target.value })} />
              <Textarea aria-label={`Jawaban ${i + 1}`} placeholder="Jawaban" rows={3} value={it.a} onChange={(e) => update(i, { a: e.target.value })} />
            </li>
          ))}
        </ol>
        <Button type="button" variant="outline" onClick={() => setItems((prev) => [...prev, { q: "", a: "" }])}>
          <Plus className="h-4 w-4" /> Tambah pertanyaan
        </Button>
        <SaveBar saving={saving} status={status} />
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
        throw new Error(payload.error ?? "Terjadi kesalahan. Coba lagi.");
      }
      const updated = (await res.json()) as SettingRow;
      onSaved(updated.value);
      setStatus({ kind: "ok", message: "Tersimpan. Situs berubah dalam ±1 menit." });
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
          Gerakan di situs. Berlaku untuk semua pengunjung.
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
