"use client";

import { GlassCard } from "@/components/ui/card";

export function ImportsClient() {
  return (
    <GlassCard className="p-6 space-y-4">
      <h2 className="font-semibold">Import produk via CSV</h2>
      <p className="text-sm text-[hsl(var(--muted-foreground))]">
        Endpoint ERP untuk import produk tersedia di{" "}
        <code className="rounded bg-[hsl(var(--surface-2))] px-1 py-0.5">
          POST /api/v1/import/products
        </code>{" "}
        (kirim CSV sebagai body) dan commit di{" "}
        <code className="rounded bg-[hsl(var(--surface-2))] px-1 py-0.5">
          POST /api/v1/import/products/:previewId/commit
        </code>
        . Form drag &amp; drop di sini akan dibangun setelah Vercel Blob storage aktif
        agar file CSV tidak perlu dibuffer di memory.
      </p>
      <p className="text-sm text-[hsl(var(--muted-foreground))]">
        Sementara, jalankan import lewat tooling internal (curl/postman) dengan{" "}
        <code className="rounded bg-[hsl(var(--surface-2))] px-1 py-0.5">
          Authorization: Bearer &lt;token admin&gt;
        </code>
        .
      </p>
    </GlassCard>
  );
}
