"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

const ADMIN_ROLES = new Set([
  "owner",
  "operations",
  "finance",
  "support",
  "admin",
]);

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = (await res.json().catch(() => null)) as
        | { error?: string; user?: { role?: string } }
        | null;
      if (!res.ok || !json) {
        setError(json?.error ?? "Email atau password salah.");
        setLoading(false);
        return;
      }
      const role = json.user?.role ?? "customer";
      const fallback = ADMIN_ROLES.has(role) ? "/admin" : "/dashboard";
      const target = next === "/dashboard" && ADMIN_ROLES.has(role) ? "/admin" : next || fallback;
      router.replace(target);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal terhubung. Coba lagi.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Email</span>
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] px-3 py-2 text-sm focus:border-[hsl(var(--sage-500))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--sage-500)/0.25)]"
          placeholder="kamu@email.com"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Password</span>
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] px-3 py-2 text-sm focus:border-[hsl(var(--sage-500))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--sage-500)/0.25)]"
        />
      </label>
      {error && (
        <div role="alert" className="text-sm text-[hsl(var(--rose-700))]">
          {error}
        </div>
      )}
      <Button type="submit" variant="primary" disabled={loading} className="mt-2 justify-center">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
        {loading ? "Memproses…" : "Masuk"}
      </Button>
    </form>
  );
}
