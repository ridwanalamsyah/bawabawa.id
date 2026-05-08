import { useEffect, useRef, useState, type RefObject } from "react";
import { api } from "../../shared/api/client";

/**
 * Google Identity Services (GIS) integration helpers.
 *
 * Pairs with the backend `POST /api/v1/auth/google` route in
 * `apps/api/src/modules/auth/auth.routes.ts`, which expects a Google ID token
 * (`credential`) issued by GIS and exchanges it for our access + refresh JWT
 * pair. The frontend never sees the OAuth client secret — GIS uses the
 * implicit ID-token flow scoped to `Authorized JavaScript origins` configured
 * in Google Cloud Console.
 */

const GIS_SRC = "https://accounts.google.com/gsi/client";
const GIS_SCRIPT_ID = "google-identity-services";

export type AuthConfig = {
  googleClientId: string | null;
  demoMode: boolean;
  allowEmailLogin: boolean;
};

type GoogleCredentialResponse = {
  credential?: string;
  select_by?: string;
};

type GsiButtonOptions = {
  type?: "standard" | "icon";
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  shape?: "rectangular" | "pill" | "circle" | "square";
  logo_alignment?: "left" | "center";
  width?: number;
  locale?: string;
};

type GsiId = {
  initialize: (config: {
    client_id: string;
    callback: (resp: GoogleCredentialResponse) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
    ux_mode?: "popup" | "redirect";
    use_fedcm_for_prompt?: boolean;
  }) => void;
  renderButton: (parent: HTMLElement, options: GsiButtonOptions) => void;
  disableAutoSelect: () => void;
  prompt: () => void;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: GsiId;
      };
    };
  }
}

function loadGisScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Identity Services unavailable in SSR"));
  }
  if (window.google?.accounts?.id) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.getElementById(GIS_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      if (window.google?.accounts?.id) return resolve();
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Gagal memuat Google Identity Services")),
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.id = GIS_SCRIPT_ID;
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Gagal memuat Google Identity Services"));
    document.head.appendChild(script);
  });
}

/**
 * Fetches `/auth/config` once on mount. Backend returns the public OAuth
 * client ID + flags driving which sign-in surfaces to render. Never returns
 * secrets; safe to call without authentication.
 */
export function useAuthConfig(): { config: AuthConfig | null; loading: boolean; error: string | null } {
  const [config, setConfig] = useState<AuthConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ success: boolean; data: AuthConfig }>("/auth/config")
      .then((res) => {
        if (cancelled) return;
        setConfig(res.data.data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Gagal memuat konfigurasi auth";
        setError(message);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { config, loading, error };
}

type UseGoogleSignInArgs = {
  clientId: string | null | undefined;
  containerRef: RefObject<HTMLDivElement | null>;
  onCredential: (idToken: string) => void;
  onError?: (err: unknown) => void;
  buttonOptions?: GsiButtonOptions;
};

/**
 * Renders Google's official sign-in button inside `containerRef`. Loads the
 * GIS script lazily on first use, initializes once per `clientId`, and emits
 * the resulting ID token via `onCredential` for the caller to exchange with
 * the backend.
 */
export function useGoogleSignInButton({
  clientId,
  containerRef,
  onCredential,
  onError,
  buttonOptions
}: UseGoogleSignInArgs): void {
  const initializedClientId = useRef<string | null>(null);
  const credentialHandler = useRef(onCredential);
  credentialHandler.current = onCredential;

  useEffect(() => {
    if (!clientId) return;
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;

    loadGisScript()
      .then(() => {
        if (cancelled) return;
        const gis = window.google?.accounts?.id;
        if (!gis) {
          throw new Error("Google Identity Services tidak tersedia setelah dimuat");
        }
        if (initializedClientId.current !== clientId) {
          gis.initialize({
            client_id: clientId,
            callback: (resp) => {
              if (resp?.credential) credentialHandler.current(resp.credential);
            },
            auto_select: false,
            cancel_on_tap_outside: true,
            ux_mode: "popup",
            use_fedcm_for_prompt: true
          });
          initializedClientId.current = clientId;
        }
        container.innerHTML = "";
        gis.renderButton(container, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          logo_alignment: "left",
          width: 320,
          locale: "id",
          ...buttonOptions
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        onError?.(err);
      });

    return () => {
      cancelled = true;
    };
  }, [clientId, containerRef, onError, buttonOptions]);
}
