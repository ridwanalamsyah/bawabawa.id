"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { GlassCard } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";
import { errorMessage } from "@/lib/order-requests";

type Kind = "reseller" | "b2b" | "affiliate";

const KIND_LABEL: Record<Kind, string> = {
  reseller: "Reseller",
  b2b: "B2B / kulakan",
  affiliate: "Afiliasi",
};

export function PartnerForm({ initialKind }: { initialKind: Kind }) {
  const [kind, setKind] = useState<Kind>(initialKind);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    businessName: "",
    city: "Samarinda",
    categories: "",
    monthlyVolumeKg: "",
    message: "",
    website: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.name.trim().length < 2) return setError("Isi nama kamu.");
    if (form.phone.replace(/\D/g, "").length < 9) return setError("Nomor WhatsApp belum valid.");
    setSubmitting(true);
    try {
      const volume = Number(form.monthlyVolumeKg);
      const res = await fetch("/api/partner-inquiries", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind,
          name: form.name.trim(),
          phone: form.phone.trim(),
          businessName: form.businessName.trim() || undefined,
          city: form.city.trim() || undefined,
          categories: form.categories.trim() || undefined,
          monthlyVolumeKg: Number.isFinite(volume) && volume > 0 ? Math.round(volume) : undefined,
          message: form.message.trim() || undefined,
          website: form.website || undefined,
        }),
      });
      if (!res.ok) {
        setError(errorMessage(await res.json().catch(() => null), "Gagal mengirim. Coba lagi sebentar."));
        return;
      }
      track("partner_submit", { kind });
      setDone(true);
    } catch {
      setError("Gagal terhubung. Periksa koneksi lalu coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <GlassCard className="p-6 self-start">
        <CheckCircle2 className="h-6 w-6 text-[hsl(var(--sage-700))]" aria-hidden />
        <h2 className="mt-3 text-xl">Terima kasih, {form.name.split(" ")[0]}</h2>
        <p className="mt-2 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
          Pendaftaran {KIND_LABEL[kind].toLowerCase()} sudah kami terima. Tim kami akan menghubungi {form.phone} lewat
          WhatsApp dalam 1×24 jam kerja.
        </p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6 self-start">
      <form onSubmit={submit} noValidate className="space-y-4">
        <fieldset>
          <legend className="text-sm font-medium">Daftar sebagai</legend>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {(Object.keys(KIND_LABEL) as Kind[]).map((k) => (
              <label
                key={k}
                className={cn(
                  "cursor-pointer rounded-md border px-2 py-2 text-center text-sm",
                  kind === k
                    ? "border-[hsl(var(--sage-700))] bg-[hsl(var(--sage-100))] dark:bg-[hsl(var(--sage-700)/0.25)] ring-2 ring-[hsl(var(--sage-700))]/30 font-semibold"
                    : "border-[hsl(var(--border))]"
                )}
              >
                <input
                  type="radio"
                  name="kind"
                  value={k}
                  checked={kind === k}
                  onChange={() => setKind(k)}
                  className="sr-only"
                />
                {KIND_LABEL[k]}
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <Label htmlFor="p-name">Nama</Label>
          <Input id="p-name" value={form.name} onChange={set("name")} autoComplete="name" required />
        </div>
        <div>
          <Label htmlFor="p-phone">No. WhatsApp</Label>
          <Input
            id="p-phone"
            value={form.phone}
            onChange={set("phone")}
            inputMode="tel"
            autoComplete="tel"
            placeholder="08xx"
            required
          />
        </div>
        {kind !== "affiliate" && (
          <div>
            <Label htmlFor="p-business">Nama toko / usaha</Label>
            <Input id="p-business" value={form.businessName} onChange={set("businessName")} />
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="p-city">Kota</Label>
            <Input id="p-city" value={form.city} onChange={set("city")} />
          </div>
          {kind !== "affiliate" && (
            <div>
              <Label htmlFor="p-volume">Perkiraan kg / bulan</Label>
              <Input id="p-volume" value={form.monthlyVolumeKg} onChange={set("monthlyVolumeKg")} inputMode="numeric" />
            </div>
          )}
        </div>
        <div>
          <Label htmlFor="p-categories">{kind === "affiliate" ? "Channel (IG / TikTok / komunitas)" : "Barang yang dicari"}</Label>
          <Input id="p-categories" value={form.categories} onChange={set("categories")} />
        </div>
        <div>
          <Label htmlFor="p-message">Catatan (opsional)</Label>
          <Textarea id="p-message" value={form.message} onChange={set("message")} rows={3} />
        </div>
        {/* Honeypot: hidden from people, filled by bots. */}
        <div className="hidden" aria-hidden>
          <label>
            Website
            <input tabIndex={-1} autoComplete="off" value={form.website} onChange={set("website")} />
          </label>
        </div>

        {error && (
          <p role="alert" className="text-sm text-[hsl(var(--rose-700))]">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Mengirim…" : "Kirim pendaftaran"}
        </Button>
      </form>
    </GlassCard>
  );
}
