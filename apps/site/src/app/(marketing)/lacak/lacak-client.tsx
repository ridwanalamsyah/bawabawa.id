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

      <p className="text-sm text-[hsl(var(--muted-foreground))]">
        Link hilang?{" "}
        <a href={waLink("Halo Bawabawa, saya kehilangan link tracking pesanan saya.")} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline">
          <MessageCircle className="h-4 w-4" aria-hidden /> Minta lewat WhatsApp
        </a>{" "}
        atau <Link href="/login" className="underline">masuk</Link> untuk melihat semua pesananmu.
      </p>
    </div>
  );
}
