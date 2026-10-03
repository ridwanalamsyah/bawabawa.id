"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Link2 } from "lucide-react";
import { track } from "@/lib/analytics";

/**
 * The fastest way in: paste a product link and land on /request with the
 * item already filled. Anything that isn't a URL is sent as the item name.
 */
export function LinkPaste() {
  const router = useRouter();
  const [value, setValue] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = value.trim();
    track("request_start", { from: "hero_paste" });
    if (!v) return router.push("/request");
    const isUrl = /^https?:\/\//i.test(v);
    router.push(`/request?${isUrl ? "link" : "name"}=${encodeURIComponent(v)}`);
  }

  return (
    <form onSubmit={submit} className="relative flex items-center gap-2 rounded-2xl border-2 border-[hsl(var(--sage-700))] bg-[hsl(var(--surface))] p-1.5 pl-4 shadow-[0_10px_30px_-12px_hsl(var(--sage-700)/0.45)]">
      <Link2 className="h-5 w-5 shrink-0 text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))]" aria-hidden />
      <label htmlFor="hero-link" className="sr-only">
        Link atau nama barang
      </label>
      <input
        id="hero-link"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        inputMode="url"
        autoComplete="off"
        placeholder="Tempel link Shopee/Tokopedia/IG, atau ketik nama barang"
        className="min-w-0 flex-1 bg-transparent py-2.5 text-[15px] outline-none placeholder:text-[hsl(var(--muted-foreground))]"
      />
      <button
        type="submit"
        className="nudge inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[hsl(var(--sage-700))] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[hsl(var(--sage-800))]"
      >
        Titip <ArrowRight className="h-4 w-4" aria-hidden />
      </button>
    </form>
  );
}
