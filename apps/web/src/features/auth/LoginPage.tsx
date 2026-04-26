import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { api } from "../../shared/api/client";
import { useAppDispatch } from "../../app/hooks";
import { setSession } from "./auth.slice";
import { useBrand } from "../cms/CmsContext";
import { ThemeToggle } from "../../shared/ui/primitives/ThemeToggle";
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
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<LoginInput>();

  async function onSubmit(input: LoginInput) {
    setApiError(null);
    try {
      const response = await api.post("/auth/login", input);
      const payload = response.data.data as LoginResponse;

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
    } catch (e) {
      const error = e as { response?: { data?: { error?: { message?: string }; message?: string } }; message?: string };
      const msg =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        error?.message ||
        "Login gagal. Periksa email & password.";
      setApiError(String(msg));
      toast.error(String(msg));
    }
  }

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

          <button type="button" className="login-demo-hint" onClick={fillDemo}>
            <span className="login-demo-icon" aria-hidden="true">⚡</span>
            <span>
              Isi otomatis akun demo &nbsp;
              <code>admin@erp.com</code>
            </span>
            <span className="login-demo-arrow" aria-hidden="true">→</span>
          </button>

          <form onSubmit={handleSubmit(onSubmit)} className="login-form" noValidate>
            {apiError && (
              <div className="login-alert" role="alert">
                <span aria-hidden="true">⚠</span>
                <span>{apiError}</span>
              </div>
            )}

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

          <p className="login-note">
            {brand.name} · {brand.tagline}
          </p>
        </div>
      </motion.section>
    </main>
  );
}
