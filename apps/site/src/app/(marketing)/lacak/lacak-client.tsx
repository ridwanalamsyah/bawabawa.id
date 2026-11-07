"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, MessageCircle } from "lucide-react";
import { GlassCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { formatDate, formatIDR } from "@/lib/utils";
import { getLocalOrderLinks, getServerLocalOrderLinks, subscribeLocalOrderLinks } from "@/lib/local-orders";
import { waLink } from "@/lib/contact";

/** Accepts either the full tracking URL or just the token part. */
function extractToken(input: string): string | null {
  const trimmed = input.trim();
  const match = trimmed.match(/track\/([A-Za-z0-9_-]{20,64})/) ?? trimmed.match(/^([A-Za-z0-9_-]{20,64})$/);
  return match ? match[1] : null;
}

export function LacakClient() {
  const router = useRouter();
  const links = useSyncExternalStore(subscribeLocalOrderLinks, getLocalOrderLinks, getServerLocalOrderLinks);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="mt-8 space-y-4">
      <GlassCard className="p-5 sm:p-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const token = extractToken(value);
            if (!token) {
              setError("Tempel link tracking lengkap dari pesan WhatsApp kami.");
              return;
            }
            router.push(`/track/${token}`);
          }}
          className="grid gap-2"
        >
          <Label htmlFor="track-link">Link tracking</Label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              id="track-link"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError(null);
              }}
              placeholder="https://bawabawa.id/track/…"
              aria-invalid={!!error}
              aria-describedby={error ? "track-link-err" : undefined}
            />
            <Button type="submit" variant="primary">
              Buka <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          </div>
          {error && (
            <p id="track-link-err" role="alert" className="text-xs text-[hsl(var(--danger))]">
              {error}
            </p>
          )}
        </form>
      </GlassCard>

      {links.length > 0 && (
        <GlassCard className="p-5 sm:p-6">
          <h2 className="font-semibold">Pesanan dari perangkat ini</h2>
          <ul className="mt-3 divide-y divide-[hsl(var(--border))]">
            {links.map((l) => (
              <li key={l.token}>
                <Link href={`/track/${l.token}`} className="flex items-center gap-3 py-3 hover:underline">
                  <span className="font-mono">{l.code}</span>
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">{formatDate(l.createdAt)}</span>
                  <span className="ml-auto tabular-nums text-sm">{formatIDR(l.estimateTotal)}</span>
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </GlassCard>
      )}

      <ResendLink />
    </div>
  );
}

/** Lost the link? Phone + order code → we send it again by WhatsApp. */
function ResendLink() {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (phone.replace(/\D/g, "").length < 9) return setError("Isi nomor WhatsApp yang dipakai saat memesan.");
    if (code.trim().length < 4) return setError("Isi kode pesanan, contoh BWB-ABC123.");
    setState("sending");
    try {
      const res = await fetch("/api/order-requests/resend-link", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), code: code.trim() }),
      });
      setState(res.ok ? "sent" : "error");
      if (!res.ok) setError("Belum bisa mengirim. Coba lagi beberapa menit lagi.");
    } catch {
      setState("error");
      setError("Gagal terhubung. Periksa koneksi lalu coba lagi.");
    }
  }

  return (
    <GlassCard className="p-5 sm:p-6">
      <h2 className="font-semibold">Link hilang?</h2>
      {state === "sent" ? (
        <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
          Kalau nomor dan kode pesanannya cocok, link tracking sudah kami kirim ke WhatsApp {phone}. Belum masuk dalam
          beberapa menit?{" "}
          <a href={waLink(`Halo Bawabawa, saya minta link tracking pesanan ${code.trim()}.`)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline">
            <MessageCircle className="h-4 w-4" aria-hidden /> Chat kami
          </a>
        </p>
      ) : (
        <form onSubmit={submit} className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div className="grid gap-1.5">
            <Label htmlFor="rl-phone">Nomor WhatsApp</Label>
            <Input id="rl-phone" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="0812…" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="rl-code">Kode pesanan</Label>
            <Input id="rl-code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="BWB-ABC123" />
          </div>
          <Button type="submit" variant="outline" disabled={state === "sending"}>
            {state === "sending" ? "Mengirim…" : "Kirim ke WhatsApp"}
          </Button>
          {error && (
            <p role="alert" className="sm:col-span-3 text-xs text-[hsl(var(--danger))]">
              {error}
            </p>
          )}
        </form>
      )}
    </GlassCard>
  );
}
