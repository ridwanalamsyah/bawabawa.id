"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-bold">Halaman ini belum bisa dibuka</h1>
      <p className="text-sm text-[hsl(var(--muted-foreground))]">
        Ada gangguan sebentar. Coba muat ulang; kalau masih muncul, tunggu satu-dua menit lalu coba lagi.
      </p>
      <div className="flex gap-2">
        <Button onClick={() => reset()}>Muat ulang</Button>
        <Button variant="outline" asChild>
          <Link href="/">Ke beranda</Link>
        </Button>
      </div>
    </div>
  );
}
