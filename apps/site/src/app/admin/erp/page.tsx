import { PageHeader } from "@/components/dashboard/page-header";
import { Card, GlassCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Cable, Webhook, Lock, Database, Repeat } from "lucide-react";
import { erpSyncEvents } from "@/lib/mock/analytics";

export default function ERPPage() {
  return (
    <>
      <PageHeader
        eyebrow="ERP Integration"
        title="Sinkronisasi sistem internal"
        description="Status realtime webhook, REST API token, retry queue, dan audit trail."
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <GlassCard className="p-5">
          <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
            <Activity className="h-4 w-4 text-[hsl(var(--emerald-500))]" /> Status koneksi
          </div>
          <p className="mt-2 text-2xl font-semibold">Online</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Last heartbeat 12s lalu</p>
        </GlassCard>
        <GlassCard className="p-5">
          <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
            <Webhook className="h-4 w-4 text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))]" /> Webhook delivered (24j)
          </div>
          <p className="mt-2 text-2xl font-semibold">14.872</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">99.94% success rate</p>
        </GlassCard>
        <GlassCard className="p-5">
          <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
            <Repeat className="h-4 w-4 text-[hsl(var(--warning))]" /> Retry queue
          </div>
          <p className="mt-2 text-2xl font-semibold">3</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">2 customer.upsert · 1 invoice.posted</p>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <Card className="lg:col-span-7 p-0 overflow-hidden">
          <div className="p-5 border-b border-[hsl(var(--border))] flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))]">
                Audit trail
              </p>
              <h3 className="mt-1 font-semibold">Log webhook & sinkronisasi</h3>
            </div>
            <Badge variant="success"><Activity className="h-3 w-3" /> Streaming</Badge>
          </div>
          <ul className="divide-y divide-[hsl(var(--border))]">
            {erpSyncEvents.map((e) => (
              <li key={e.id} className="p-3 flex items-center gap-3 text-sm">
                <span className="font-mono text-xs text-[hsl(var(--muted-foreground))] w-16 shrink-0">{e.at}</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-[hsl(var(--sage-100))] dark:bg-[hsl(var(--sage-700)/0.4)] text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-200))]">
                  {e.type}
                </span>
                <span className="font-mono text-xs text-[hsl(var(--muted-foreground))] truncate flex-1">{e.entity}</span>
                <Badge variant={e.status === "ok" ? "success" : "warning"}>{e.status === "ok" ? "synced" : "retrying"}</Badge>
              </li>
            ))}
          </ul>
        </Card>

        <div className="lg:col-span-5 space-y-4">
          <GlassCard className="p-6">
            <div className="flex items-center gap-2 mb-2 text-xs text-[hsl(var(--muted-foreground))]">
              <Cable className="h-4 w-4" /> Endpoint API
            </div>
            <code className="font-mono text-xs px-2 py-1 rounded bg-[hsl(var(--surface-2))] block">https://api.bawabawa.id/v1</code>
            <ul className="mt-3 text-xs text-[hsl(var(--muted-foreground))] space-y-1">
              <li>• POST /orders</li>
              <li>• GET /orders/:id</li>
              <li>• POST /trips</li>
              <li>• POST /webhooks/erp (incoming)</li>
              <li>• GET /events/stream (SSE realtime)</li>
            </ul>
          </GlassCard>
          <GlassCard className="p-6">
            <div className="flex items-center gap-2 mb-2 text-xs text-[hsl(var(--muted-foreground))]">
              <Lock className="h-4 w-4" /> Authentication
            </div>
            <p className="text-sm">JWT bearer token dengan TTL 60 menit, refresh otomatis.</p>
            <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">HMAC SHA-256 untuk verifikasi webhook (header <code className="font-mono">X-Bawabawa-Signature</code>).</p>
          </GlassCard>
          <GlassCard className="p-6">
            <div className="flex items-center gap-2 mb-2 text-xs text-[hsl(var(--muted-foreground))]">
              <Database className="h-4 w-4" /> Background jobs
            </div>
            <p className="text-sm">Redis queue · BullMQ scheduler · retry exponential backoff.</p>
            <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">Workers: erp-sync · invoice-pdf · push-notification · payment-reconcile.</p>
          </GlassCard>
        </div>
      </div>
    </>
  );
}
