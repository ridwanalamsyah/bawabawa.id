"use client";

/**
 * Google Sign-In button backed by the Google Identity Services library
 * (https://developers.google.com/identity/gsi/web/reference/js-reference).
 *
 * Strategy:
 * 1. Load the GIS script once on mount.
 * 2. Render Google's official rounded button (matches GIS UX guidelines).
 * 3. On credential callback, POST the idToken to `/api/auth/google` and
 *    let the route handler set the session cookie + return user info.
 * 4. Navigate to `next` (preserves `?next=` for deep links).
 */

import * as React from "react";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: GoogleInitConfig) => void;
          renderButton: (element: HTMLElement, options: GoogleButtonOptions) => void;
          prompt: () => void;
        };
      };
    };
  }
}

type GoogleInitConfig = {
  client_id: string;
  callback: (response: { credential?: string }) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
};

type GoogleButtonOptions = {
  type?: "standard" | "icon";
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "small" | "medium" | "large";
  shape?: "rectangular" | "pill" | "circle" | "square";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  logo_alignment?: "left" | "center";
  width?: number;
};

const ADMIN_ROLES = new Set([
  "owner",
  "admin",
  "operations",
  "finance",
  "support",
]);

export function GoogleSignInButton({ next, clientId }: { next: string; clientId: string }) {
  const router = useRouter();
  const buttonRef = React.useRef<HTMLDivElement | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [ready, setReady] = React.useState(false);

  const handleCredential = React.useCallback(
    async (response: { credential?: string }) => {
      const credential = response?.credential;
      if (!credential) {
        setError("Google tidak mengirim kredensial. Coba ulang.");
        return;
      }
      setBusy(true);
      setError(null);
      try {
        const res = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ credential }),
        });
        const json = (await res.json().catch(() => null)) as
          | { error?: string; user?: { role?: string } }
          | null;
        if (!res.ok || !json?.user) {
          setError(json?.error ?? "Sign-in gagal. Coba lagi atau hubungi admin.");
          setBusy(false);
          return;
        }
        const role = json.user.role ?? "customer";
        const fallback = ADMIN_ROLES.has(role) ? "/admin" : "/dashboard";
        const target = next === "/dashboard" && ADMIN_ROLES.has(role) ? "/admin" : next || fallback;
        router.replace(target);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal terhubung ke server.");
        setBusy(false);
      }
    },
    [next, router],
  );

  React.useEffect(() => {
    if (!clientId) return;

    let cancelled = false;

    function render() {
      if (cancelled || !buttonRef.current || !window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredential,
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      buttonRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(buttonRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        shape: "pill",
        text: "signin_with",
        logo_alignment: "left",
        width: 320,
      });
      setReady(true);
    }

    if (window.google?.accounts?.id) {
      render();
      return () => {
        cancelled = true;
      };
    }

    const SCRIPT_ID = "google-identity-services";
    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    script.addEventListener("load", render, { once: true });
    return () => {
      cancelled = true;
      script?.removeEventListener("load", render);
    };
  }, [clientId, handleCredential]);

  if (!clientId) {
    return (
      <div className="rounded-xl border border-[hsl(var(--amber-500)/0.4)] bg-[hsl(var(--amber-500)/0.08)] p-3 text-sm text-[hsl(var(--amber-700))]">
        Google sign-in belum dikonfigurasi. Hubungi admin untuk mengatur Client ID.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div ref={buttonRef} className="flex min-h-11 items-center justify-center" aria-busy={busy} />
      {!ready && (
        <p className="text-xs text-[hsl(var(--muted-foreground))]">Memuat Google Sign-In…</p>
      )}
      {busy && (
        <p className="text-xs text-[hsl(var(--muted-foreground))]">Memverifikasi akun Google…</p>
      )}
      {error && (
        <p role="alert" className="text-sm text-[hsl(var(--rose-700))]">
          {error}
        </p>
      )}
    </div>
  );
}
