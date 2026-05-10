import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata = {
  title: "Masuk · Bawabawa.id",
  description: "Masuk ke dashboard customer atau admin Bawabawa.id.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; reason?: string }>;
}) {
  const params = await searchParams;
  const next = sanitizeNext(params.next);
  const reason = params.reason;

  return (
    <main className="relative flex min-h-svh items-center justify-center px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-br from-[hsl(var(--sage-50))] via-transparent to-[hsl(var(--cream-100))]"
      />
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-8 shadow-[0_24px_64px_-24px_hsl(var(--sage-700)/0.18)] backdrop-blur">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight">Masuk ke Bawabawa.id</h1>
            <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
              Customer akan diarahkan ke dashboard, staff & admin akan diarahkan ke konsol internal.
            </p>
          </div>
          {reason === "forbidden" && (
            <div className="mb-4 rounded-xl border border-[hsl(var(--rose-500)/0.4)] bg-[hsl(var(--rose-500)/0.08)] p-3 text-sm text-[hsl(var(--rose-700))]">
              Akun ini tidak punya akses ke halaman tersebut. Silakan masuk ulang dengan akun staff/admin.
            </div>
          )}
          <Suspense>
            <LoginForm next={next} />
          </Suspense>
          <p className="mt-6 text-xs text-[hsl(var(--muted-foreground))]">
            Demo akun: <code className="font-mono">aulia.putri@example.com</code> /{" "}
            <code className="font-mono">password</code> (customer) ·{" "}
            <code className="font-mono">indra@bawabawa.id</code> /{" "}
            <code className="font-mono">password</code> (owner).
          </p>
        </div>
      </div>
    </main>
  );
}

// Only allow internal absolute paths starting with `/` to avoid open-redirect.
function sanitizeNext(raw: string | undefined): string {
  if (!raw) return "/dashboard";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/dashboard";
  return raw;
}
