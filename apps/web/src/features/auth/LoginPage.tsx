import { useCallback, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { api } from "../../shared/api/client";
import { useAppDispatch } from "../../app/hooks";
import { setSession } from "./auth.slice";
import { useBrand } from "../cms/CmsContext";
import { ThemeToggle } from "../../shared/ui/primitives/ThemeToggle";
import { useAuthConfig, useGoogleSignInButton } from "./useGoogleSignIn";
import "./LoginPage.css";
import type { LoginResponse } from "@erp/shared";

type LoginInput = { email: string; password: string };

const HIGHLIGHTS: ReadonlyArray<{ title: string; body: string; icon: string }> = [
  {
    icon: "✦",
    title: "Mobile-first",
    body: "Akses penuh dari ponsel — sticky glass nav + hamburger overlay."
  },
  {
    icon: "◆",
    title: "RBAC granular",
    body: "Permission per fitur, halaman 403 elegan, audit log lengkap."
  },
  {
    icon: "❖",
    title: "Zero-hardcode CMS",
    body: "Brand, navigasi, dan halaman editable langsung dari /admin."
  }
];

export function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const brand = useBrand();
  const [apiError, setApiError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const { config: authConfig } = useAuthConfig();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<LoginInput>();

  // `allowEmailLogin` is only true when the backend is in DEMO_MODE outside
  // production. In any production deployment we hide the email/password form
  // entirely so users can't be confused into trying credentials that the
  // backend will reject with EMAIL_LOGIN_DISABLED.
  const allowEmailLogin = authConfig?.allowEmailLogin ?? true;
  const showDemoHint = authConfig?.demoMode === true;
  const googleClientId = authConfig?.googleClientId ?? null;

  function applySession(payload: LoginResponse) {
    dispatch(
      setSession({
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken,
        user: payload.user,
        permissions: payload.user.permissions ?? []
      })
    );
    toast.success(`Selamat datang, ${payload.user.fullName ?? payload.user.email}`);
    navigate("/", { replace: true });
  }

  function reportLoginError(e: unknown, fallback: string) {
    const error = e as {
      response?: { data?: { error?: { message?: string }; message?: string } };
      message?: string;
    };
    const msg =
      error?.response?.data?.error?.message ||
      error?.response?.data?.message ||
      error?.message ||
      fallback;
    setApiError(String(msg));
    toast.error(String(msg));
  }

  async function onSubmit(input: LoginInput) {
    setApiError(null);
    try {
      const response = await api.post("/auth/login", input);
      applySession(response.data.data as LoginResponse);
    } catch (e) {
      reportLoginError(e, "Login gagal. Periksa email & password.");
    }
  }

  const handleGoogleCredential = useCallback(
    async (idToken: string) => {
      setApiError(null);
      setGoogleLoading(true);
      try {
        const response = await api.post("/auth/google", { idToken });
        applySession(response.data.data as LoginResponse);
      } catch (e) {
        reportLoginError(e, "Login Google gagal. Coba lagi.");
      } finally {
        setGoogleLoading(false);
      }
    },
    // applySession + reportLoginError are stable closures over hooks that
    // don't change between renders; intentionally not adding them to the
    // dep array to avoid re-initializing the GIS button on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const handleGoogleError = useCallback((err: unknown) => {
    // eslint-disable-next-line no-console
    console.error("Google sign-in initialization failed:", err);
    setApiError(
      "Tidak dapat memuat Google Sign-In. Periksa koneksi atau Authorized JavaScript origins di Google Cloud Console."
    );
  }, []);

  useGoogleSignInButton({
    clientId: googleClientId,
    containerRef: googleButtonRef,
    onCredential: handleGoogleCredential,
    onError: handleGoogleError
  });

  function fillDemo() {
    setValue("email", "admin@erp.com");
    setValue("password", "admin123");
  }

  return (
    <main className="login-page">
      <div className="login-theme-toggle">
        <ThemeToggle />
      </div>

      <div className="login-bg-orb login-bg-orb--1" />
      <div className="login-bg-orb login-bg-orb--2" />
      <div className="login-bg-orb login-bg-orb--3" />

      <motion.section
        className="login-shell"
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
      >
        {/* ── Left pane: brand + value props (desktop only) ── */}
        <aside className="login-aside" aria-label="Tentang bawabawa.id">
          <header className="login-aside-header">
            <span className="login-brand-mark" aria-hidden="true">
              {brand.logoUrl ? (
                <img src={brand.logoUrl} alt="" className="login-brand-img" />
              ) : (
                <span className="login-monogram">{brand.monogram}</span>
              )}
            </span>
            <div>
              <p className="login-aside-eyebrow">{brand.shortName ?? brand.name}</p>
              <h2 className="login-aside-title">Operasi bisnis<br />terpadu, satu layar.</h2>
            </div>
          </header>

          <p className="login-aside-lead">{brand.tagline}</p>

          <ul className="login-aside-list">
            {HIGHLIGHTS.map((item) => (
              <li key={item.title} className="login-aside-item">
                <span className="login-aside-icon" aria-hidden="true">{item.icon}</span>
                <div>
                  <p className="login-aside-item-title">{item.title}</p>
                  <p className="login-aside-item-body">{item.body}</p>
                </div>
              </li>
            ))}
          </ul>

          <p className="login-aside-foot">
            © {new Date().getFullYear()} {brand.name}. Enterprise-grade, mobile-first.
          </p>
        </aside>

        {/* ── Right pane: form ── */}
        <div className="login-card">
          <div className="login-card-head">
            <span className="login-card-mark" aria-hidden="true">
              {brand.logoUrl ? (
                <img src={brand.logoUrl} alt="" className="login-brand-img" />
              ) : (
                <span className="login-monogram login-monogram--sm">{brand.monogram}</span>
              )}
            </span>
            <div>
              <h1 className="login-headline">Masuk ke dashboard</h1>
              <p className="login-subtitle">Gunakan akun terdaftar untuk melanjutkan.</p>
            </div>
          </div>

          {showDemoHint && allowEmailLogin && (
            <button type="button" className="login-demo-hint" onClick={fillDemo}>
              <span className="login-demo-icon" aria-hidden="true">⚡</span>
              <span>
                Isi otomatis akun demo &nbsp;
                <code>admin@erp.com</code>
              </span>
              <span className="login-demo-arrow" aria-hidden="true">→</span>
            </button>
          )}

          {apiError && (
            <div className="login-alert" role="alert">
              <span aria-hidden="true">⚠</span>
              <span>{apiError}</span>
            </div>
          )}

          {googleClientId && (
            <div className="login-google" aria-busy={googleLoading}>
              <div ref={googleButtonRef} className="login-google-btn" />
              {googleLoading && (
                <p className="login-google-status">
                  <span className="login-spinner login-spinner--dark" aria-hidden="true" />
                  <span>Memverifikasi akun Google…</span>
                </p>
              )}
            </div>
          )}

          {googleClientId && allowEmailLogin && (
            <div className="login-divider" role="separator" aria-label="atau">
              <span>atau</span>
            </div>
          )}

          {!googleClientId && !allowEmailLogin && (
            <div className="login-alert" role="alert">
              <span aria-hidden="true">⚠</span>
              <span>
                Tidak ada metode sign-in yang dikonfigurasi. Set
                <code> GOOGLE_OAUTH_CLIENT_ID </code>
                di environment backend.
              </span>
            </div>
          )}

          {allowEmailLogin && (
            <form onSubmit={handleSubmit(onSubmit)} className="login-form" noValidate>
              <div className="login-field">
                <label className="login-label" htmlFor="login-email">
                  Email
                </label>
                <div className="login-input-wrap">
                  <span className="login-input-icon" aria-hidden="true">✉</span>
                  <input
                    id="login-email"
                    className="login-input"
                    type="email"
                    placeholder="you@domain.com"
                    autoComplete="email"
                    aria-invalid={errors.email ? "true" : "false"}
                    {...register("email", {
                      required: "Email wajib diisi",
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Format email tidak valid"
                      }
                    })}
                  />
                </div>
                {errors.email && <p className="login-error">{errors.email.message}</p>}
              </div>

              <div className="login-field">
                <label className="login-label" htmlFor="login-password">
                  Password
                </label>
                <div className="login-input-wrap">
                  <span className="login-input-icon" aria-hidden="true">🔒</span>
                  <input
                    id="login-password"
                    className="login-input"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 6 karakter"
                    autoComplete="current-password"
                    aria-invalid={errors.password ? "true" : "false"}
                    {...register("password", {
                      required: "Password wajib diisi",
                      minLength: { value: 6, message: "Minimal 6 karakter" }
                    })}
                  />
                  <button
                    type="button"
                    className="login-eye"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  >
                    {showPassword ? "🙈" : "👁"}
                  </button>
                </div>
                {errors.password && <p className="login-error">{errors.password.message}</p>}
              </div>

              <button
                className="login-submit"
                type="submit"
                disabled={isSubmitting}
                id="btn-login"
              >
                {isSubmitting ? (
                  <>
                    <span className="login-spinner" aria-hidden="true" />
                    <span>Memverifikasi…</span>
                  </>
                ) : (
                  <span>Masuk ke Dashboard</span>
                )}
              </button>
            </form>
          )}

          {allowEmailLogin && (
            <p className="login-register">
              Belum punya akun?{" "}
              <Link to="/register" className="login-register-link">
                Daftar di sini
              </Link>
            </p>
          )}

          <p className="login-note">
            {brand.name} · {brand.tagline}
          </p>
        </div>
      </motion.section>
    </main>
  );
}
