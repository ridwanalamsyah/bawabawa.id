import type { Metadata } from "next";
import { TrackingClient } from "./tracking-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Lacak pesanan",
  description: "Pantau status pesanan jastip Bawabawa.id tanpa perlu login.",
  robots: { index: false, follow: false },
};

export default async function TrackPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
      <p className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))] font-semibold">
        Lacak Pesanan
      </p>
      <h1 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight">
        Status pesananmu
      </h1>
      <p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">
        Token tracking <span className="font-mono">{token}</span>. Bookmark
        halaman ini supaya bisa dipantau kapan saja tanpa login.
      </p>

      <TrackingClient token={token} />
    </div>
  );
}
