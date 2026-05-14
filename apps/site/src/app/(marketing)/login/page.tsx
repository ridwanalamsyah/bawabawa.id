import { Suspense } from "react";
import { LoginForm } from "./login-form";
import { GoogleSignInButton } from "@/components/auth/google-signin-button";

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
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

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
          {reason === "pending" && (
            <div className="mb-4 rounded-xl border border-[hsl(var(--amber-500)/0.4)] bg-[hsl(var(--amber-500)/0.08)] p-3 text-sm text-[hsl(var(--amber-700))]">
              Akun kamu sudah terdaftar dan menunggu persetujuan admin. Kami akan kontak via email.
            </div>
          )}

          <Suspense>
            <GoogleSignInButton next={next} clientId={googleClientId} />
          </Suspense>

          <details className="mt-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-3">
            <summary className="cursor-pointer text-sm font-medium text-[hsl(var(--muted-foreground))]">
              Punya kredensial email/password lama?
            </summary>
            <div className="mt-3">
              <Suspense>
                <LoginForm next={next} />
              </Suspense>
              <p className="mt-3 text-xs text-[hsl(var(--muted-foreground))]">
                Login email/password hanya tersedia di mode demo. Production gunakan Google Sign-In.
              </p>
            </div>
          </details>
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
