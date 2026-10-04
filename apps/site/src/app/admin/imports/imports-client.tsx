"use client";

import Link from "next/link";
import { GlassCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function ImportsClient() {
  return (
    <GlassCard className="p-6 space-y-4">
      <h2 className="font-semibold">Impor banyak produk sekaligus</h2>
      <p className="text-sm text-[hsl(var(--muted-foreground))]">
        Fitur unggah file untuk banyak produk sekaligus belum tersedia. Untuk sekarang, tambahkan produk satu per satu
        dari halaman Katalog.
      </p>
      <Button asChild>
        <Link href="/admin/catalog">Buka Katalog</Link>
      </Button>
    </GlassCard>
  );
}
