"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CircleCheck, Loader2, MapPin, MessageCircle, RefreshCw, Star, XCircle } from "lucide-react";
import { GlassCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatDateTime, formatIDR } from "@/lib/utils";
import { TIERS } from "@/lib/pricing";
import { waLink } from "@/lib/contact";
import { track } from "@/lib/analytics";
import { delay } from "@/lib/motion";
import {
  ORDER_FLOW,
  ORDER_STEP_LABEL,
  OUT_OF_STOCK_LABEL,
  STATUS_BADGE,
  errorMessage,
  type PublicOrderView,
} from "@/lib/order-requests";

type LoadState =
  | { kind: "loading" }
  | { kind: "error"; message: string; notFound: boolean }
  | { kind: "ready"; order: PublicOrderView };

export function TrackingClient({ token }: { token: string }) {
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [busy, setBusy] = useState<"approve" | "cancel" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/order-requests/${encodeURIComponent(token)}`, { cache: "no-store" });
      const json = (await res.json().catch(() => null)) as { data?: PublicOrderView } | null;
      if (!res.ok || !json?.data) {
        setState({
          kind: "error",
          notFound: res.status === 404 || res.status === 400,
          message: errorMessage(json, "Status pesanan belum bisa dimuat."),
        });
        return;
      }
      setState({ kind: "ready", order: json.data });
    } catch {
      setState({ kind: "error", notFound: false, message: "Koneksi terputus. Coba muat ulang." });
    }
  }, [token]);

  useEffect(() => {
    // Fetch-on-mount + poll; state is set after each request resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    // Status changes are driven by the team; a light poll keeps an open tab
    // current without hammering the API.
    const timer = setInterval(() => void load(), 60_000);
    return () => clearInterval(timer);
  }, [load]);

  const act = async (action: "approve" | "cancel") => {
    if (action === "cancel" && !window.confirm("Batalkan pesanan ini?")) return;
    setBusy(action);
    setActionError(null);
    try {
      const res = await fetch(`/api/order-requests/${encodeURIComponent(token)}/${action}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      });
      const json = (await res.json().catch(() => null)) as { data?: PublicOrderView } | null;
      if (!res.ok || !json?.data) {
        setActionError(errorMessage(json, "Aksi gagal. Coba lagi."));
      } else {
        track(action === "approve" ? "quote_approve" : "order_cancel");
        setState({ kind: "ready", order: json.data });
      }
    } catch {
      setActionError("Koneksi terputus. Coba lagi.");
    } finally {
      setBusy(null);
    }
  };

  if (state.kind === "loading") {
    return (
      <GlassCard className="mt-8 p-10 flex items-center justify-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Memuat status pesanan…
      </GlassCard>
    );
  }

  if (state.kind === "error") {
    return (
      <GlassCard className="mt-8 p-10 text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-[hsl(var(--warning))]" aria-hidden />
        <h2 className="mt-4 text-xl font-semibold tracking-tight">
          {state.notFound ? "Pesanan tidak ditemukan" : "Belum bisa memuat pesanan"}
        </h2>
        <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))] max-w-md mx-auto">
          {state.notFound
            ? "Pastikan link tracking-nya lengkap (ada di pesan WhatsApp dari kami)."
            : state.message}
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
          {!state.notFound && (
            <Button variant="primary" onClick={() => void load()}>
              <RefreshCw className="h-4 w-4" aria-hidden /> Coba lagi
            </Button>
          )}
          <Button asChild variant="outline">
            <a href={waLink("Halo Bawabawa, saya mau cek status pesanan saya.")} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4" aria-hidden /> Tanya via WhatsApp
            </a>
          </Button>
        </div>
      </GlassCard>
    );
  }

  const order = state.order;
  const pricing = order.quote ?? order.estimate;
  const isFinalPrice = !!order.quote;
  const cancelled = order.status === "cancelled";
  const currentIndex = ORDER_FLOW.indexOf(order.status);
  const reachedAt = new Map(order.history.map((h) => [h.status, h.at]));
  const waHelp = waLink(`Halo Bawabawa, saya mau tanya pesanan ${order.code}.`);

  return (
    <div className="mt-8 space-y-4">
      <GlassCard className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-sm text-[hsl(var(--muted-foreground))]">{order.code}</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight">{order.statusLabel}</h2>
            <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
              Diperbarui {formatDateTime(order.updatedAt)}
            </p>
          </div>
          <Badge variant={STATUS_BADGE[order.status]}>{ORDER_STEP_LABEL[order.status]}</Badge>
        </div>

        {order.status === "quoted" && pricing && (
          <div className="mt-5 rounded-2xl border border-[hsl(var(--warning)/0.4)] bg-[hsl(var(--warning)/0.08)] p-4">
            <p className="font-medium">Penawaran harga final: {formatIDR(pricing.total)}</p>
            {order.quoteNote && <p className="mt-1 text-sm">Catatan tim: {order.quoteNote}</p>}
            <div className="mt-3 flex flex-col sm:flex-row gap-2">
              <Button variant="accent" onClick={() => void act("approve")} disabled={!!busy}>
                {busy === "approve" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <CircleCheck className="h-4 w-4" aria-hidden />}
                Setujui & lanjut bayar
              </Button>
              <Button asChild variant="outline">
                <a href={waHelp} target="_blank" rel="noopener noreferrer">
                  Tanya / ubah dulu
                </a>
              </Button>
            </div>
          </div>
        )}

        {order.status === "approved" && (
          <div className="mt-5 rounded-2xl border border-[hsl(var(--sage-500)/0.4)] bg-[hsl(var(--sage-100)/0.6)] dark:bg-[hsl(var(--sage-700)/0.2)] p-4 text-sm">
            <p className="font-medium">Silakan bayar {pricing ? formatIDR(pricing.total) : ""}</p>
            <p className="mt-2 whitespace-pre-line text-[hsl(var(--muted-foreground))]">
              {order.paymentInstructions ??
                "Instruksi pembayaran dikirim tim kami lewat WhatsApp. Belum terima? Klik tombol di bawah."}
            </p>
            <Button asChild variant="primary" className="mt-3">
              <a href={waLink(`Halo Bawabawa, saya sudah bayar pesanan ${order.code}. Berikut bukti transfernya:`)} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4" aria-hidden /> Kirim bukti bayar
              </a>
            </Button>
          </div>
        )}

        {order.deliveryMethod === "pickup" && (
          <p className="mt-4 flex items-start gap-2 text-sm">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>
              Ambil sendiri{order.pickupPoint ? ` di ${order.pickupPoint}` : ""}. Kami kabari lewat WhatsApp saat barang siap diambil.
            </span>
          </p>
        )}
        {order.trackingNumber && (
          <p className="mt-4 text-sm">
            No. resi: <span className="font-mono font-medium">{order.trackingNumber}</span>
          </p>
        )}
        {actionError && (
          <p role="alert" className="mt-3 text-sm text-[hsl(var(--danger))]">
            {actionError}
          </p>
        )}
      </GlassCard>

      <GlassCard className="p-5 sm:p-6">
        <h3 className="font-semibold">Perjalanan pesanan</h3>
        {cancelled ? (
          <p className="mt-3 flex items-center gap-2 text-sm text-[hsl(var(--danger))]">
            <XCircle className="h-4 w-4" aria-hidden /> Pesanan dibatalkan
            {reachedAt.get("cancelled") ? ` · ${formatDateTime(reachedAt.get("cancelled")!)}` : ""}
          </p>
        ) : (
          <ol className="mt-4 space-y-3">
            {ORDER_FLOW.filter((s) => order.source === "request" || s !== "quoted").map((s, i, steps) => {
              const idx = ORDER_FLOW.indexOf(s);
              const done = idx < currentIndex || (idx === currentIndex && s === "delivered");
              const active = idx === currentIndex && s !== "delivered";
              const at = reachedAt.get(s);
              return (
                <li key={s} style={delay(i * 50)} className="animate-rise relative flex items-start gap-3" aria-current={active ? "step" : undefined}>
                  {i < steps.length - 1 && (
                    <span aria-hidden className="absolute left-[9px] top-6 -bottom-3 w-0.5 rounded-full bg-[hsl(var(--border))] overflow-hidden">
                      {done && (
                        <span
                          className="animate-grow-y absolute inset-0 origin-top rounded-full bg-[hsl(var(--emerald-500))]"
                          style={delay(200 + i * 140)}
                        />
                      )}
                    </span>
                  )}
                  <span
                    className={cn(
                      "relative mt-0.5 h-5 w-5 shrink-0 rounded-full border-2",
                      done && "bg-[hsl(var(--emerald-500))] border-[hsl(var(--emerald-500))]",
                      active && "border-[hsl(var(--sage-700))] bg-[hsl(var(--sage-200))]",
                      !done && !active && "border-[hsl(var(--border))]",
                    )}
                    aria-hidden
                  >
                    {active && (
                      <span className="absolute -inset-0.5 rounded-full border-2 border-[hsl(var(--sage-700))] animate-ping opacity-40" />
                    )}
                  </span>
                  <div className="text-sm">
                    <p className={cn(!done && !active && "text-[hsl(var(--muted-foreground))]", active && "font-semibold")}>
                      {ORDER_STEP_LABEL[s]}
                    </p>
                    {at && <p className="text-xs text-[hsl(var(--muted-foreground))]">{formatDateTime(at)}</p>}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </GlassCard>

      <GlassCard className="p-5 sm:p-6 text-sm">
        <h3 className="font-semibold">Rincian</h3>
        <ul className="mt-3 space-y-2">
          {order.items.map((it, i) => (
            <li key={i} className="flex items-start justify-between gap-3">
              <span>
                {it.name}
                {it.variant ? <span className="text-[hsl(var(--muted-foreground))]"> · {it.variant}</span> : null}
                <span className="text-xs text-[hsl(var(--muted-foreground))]"> × {it.qty}</span>
              </span>
              <span className="tabular-nums text-[hsl(var(--muted-foreground))]">
                {it.unitPrice != null ? formatIDR(it.unitPrice * it.qty) : it.maxPrice ? `maks ${formatIDR(it.maxPrice * it.qty)}` : "—"}
              </span>
            </li>
          ))}
        </ul>
        {pricing && (
          <div className="mt-4 space-y-1.5 border-t border-[hsl(var(--border))] pt-3">
            <Row label="Barang" value={formatIDR(pricing.itemsTotal)} />
            <Row label="Jasa titip" value={formatIDR(pricing.jastipFee)} />
            <Row label={`Ongkir ${TIERS[order.tier]?.label ?? ""}`} value={formatIDR(pricing.shippingFee)} />
            {pricing.ppn > 0 && <Row label="PPN (atas jasa & ongkir)" value={formatIDR(pricing.ppn)} />}
            <div className="flex items-center justify-between pt-1 font-semibold">
              <span>{isFinalPrice ? "Total" : "Estimasi maks."}</span>
              <span className="tabular-nums">{formatIDR(pricing.total)}</span>
            </div>
          </div>
        )}
        <p className="mt-4 text-xs text-[hsl(var(--muted-foreground))]">
          Kalau barang habis: {OUT_OF_STOCK_LABEL[order.outOfStockPreference] ?? order.outOfStockPreference}
          {order.trip ? ` · Open Trip ${order.trip.code}` : ""}
          {order.deliveryMethod === "pickup" ? " · Ambil sendiri" : order.city ? ` · Dikirim ke ${order.city}` : ""}
        </p>
      </GlassCard>

      {(order.canReview || order.reviewSubmitted) && (
        <ReviewForm token={token} submitted={!!order.reviewSubmitted} onSubmitted={() => void load()} />
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <Button asChild variant="outline">
          <a href={waHelp} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-4 w-4" aria-hidden /> Tanya admin
          </a>
        </Button>
        {order.canCancel && (
          <Button variant="ghost" onClick={() => void act("cancel")} disabled={!!busy}>
            {busy === "cancel" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <XCircle className="h-4 w-4" aria-hidden />}
            Batalkan pesanan
          </Button>
        )}
        <Button asChild variant="ghost" className="sm:ml-auto">
          <Link href="/request">Titip barang lain</Link>
        </Button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[hsl(var(--muted-foreground))]">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

function ReviewForm({ token, submitted, onSubmitted }: { token: string; submitted: boolean; onSubmitted: () => void }) {
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (submitted) {
    return (
      <GlassCard className="p-5 sm:p-6 text-sm">
        <p className="font-medium">Terima kasih atas ulasanmu!</p>
        <p className="mt-1 text-[hsl(var(--muted-foreground))]">Ulasan akan tampil di situs setelah dicek tim.</p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-5 sm:p-6">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          try {
            const res = await fetch(`/api/order-requests/${encodeURIComponent(token)}/review`, {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ rating, body: body.trim() }),
            });
            const json = await res.json().catch(() => null);
            if (!res.ok) {
              setError(errorMessage(json, "Ulasan belum terkirim. Coba lagi."));
              return;
            }
            track("review_submit", { rating });
            onSubmitted();
          } finally {
            setBusy(false);
          }
        }}
      >
        <h3 className="font-semibold">Bagaimana pengalamanmu?</h3>
        <fieldset className="mt-3">
          <legend className="sr-only">Rating</legend>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <label key={n} className="cursor-pointer">
                <input type="radio" name="rating" value={n} checked={rating === n} onChange={() => setRating(n)} className="sr-only" />
                <Star
                  className={cn("h-7 w-7", n <= rating ? "fill-[hsl(var(--warning))] text-[hsl(var(--warning))]" : "text-[hsl(var(--border))]")}
                  aria-label={`${n} bintang`}
                />
              </label>
            ))}
          </div>
        </fieldset>
        <label htmlFor="review-body" className="mt-4 block text-sm font-medium">
          Ceritakan singkat
        </label>
        <textarea
          id="review-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          minLength={10}
          maxLength={800}
          required
          placeholder="Contoh: barang sesuai pesanan, packing rapi, sampai 2 hari."
          className="mt-1.5 min-h-[88px] w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--surface))] px-4 py-3 text-sm outline-none focus:border-[hsl(var(--ring))]"
        />
        {error && (
          <p role="alert" className="mt-2 text-sm text-[hsl(var(--danger))]">
            {error}
          </p>
        )}
        <Button type="submit" className="mt-3" disabled={busy || body.trim().length < 10}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null} Kirim ulasan
        </Button>
      </form>
    </GlassCard>
  );
}
