import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { api } from "../../shared/api/client";
import { useAppDispatch } from "../../app/hooks";
import { setSession } from "./auth.slice";
import { useBrand } from "../cms/CmsContext";
import { ThemeToggle } from "../../shared/ui/primitives/ThemeToggle";
import { useAuthConfig } from "./useGoogleSignIn";
import "./LoginPage.css";
import type { LoginResponse } from "@erp/shared";

type RegisterInput = {
  fullName: string;
  email: string;
  password: string;
  passwordConfirm: string;
};

export function RegisterPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const brand = useBrand();
  const [apiError, setApiError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { config: authConfig } = useAuthConfig();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<RegisterInput>();

  const allowEmailLogin = authConfig?.allowEmailLogin ?? true;
  const password = watch("password");

  async function onSubmit(input: RegisterInput) {
    setApiError(null);
    try {
      const response = await api.post("/auth/register", {
        email: input.email,
        password: input.password,
        fullName: input.fullName
      });
      const payload = response.data?.data as LoginResponse;
      dispatch(
        setSession({
          accessToken: payload.accessToken,
          refreshToken: payload.refreshToken,
          user: payload.user,
          permissions: payload.user.permissions ?? []
        })
      );
      toast.success(`Selamat bergabung, ${payload.user.fullName ?? payload.user.email}`);
      navigate("/", { replace: true });
    } catch (e) {
      const error = e as {
        response?: { data?: { error?: { message?: string }; message?: string } };
        message?: string;
      };
      const msg =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        error?.message ||
        "Pendaftaran gagal. Coba lagi.";
      setApiError(String(msg));
      toast.error(String(msg));
    }
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
        <aside className="login-aside" aria-label={`Tentang ${brand.name}`}>
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
              <h2 className="login-aside-title">
                Mulai perjalanan
                <br />
                bisnis Anda di sini.
              </h2>
            </div>
          </header>

          <p className="login-aside-lead">
            Daftarkan akun untuk mulai mengelola pesanan, pelanggan, dan operasional bisnis dalam satu platform.
          </p>

          <p className="login-aside-foot">
            © {new Date().getFullYear()} {brand.name}. Mendaftar gratis dan cepat.
          </p>
        </aside>

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
              <h1 className="login-headline">Buat akun baru</h1>
              <p className="login-subtitle">Cukup beberapa detail untuk mulai.</p>
            </div>
          </div>

          {apiError && (
            <div className="login-alert" role="alert">
              <span aria-hidden="true">⚠</span>
              <span>{apiError}</span>
            </div>
          )}

          {!allowEmailLogin ? (
            <div className="login-alert" role="alert">
              <span aria-hidden="true">ℹ</span>
              <span>
                Pendaftaran via email belum aktif. Silakan masuk dengan akun Google di halaman{" "}
                <Link to="/login" className="login-register-link">login</Link>.
              </span>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="login-form" noValidate>
              <div className="login-field">
                <label className="login-label" htmlFor="reg-name">
                  Nama Lengkap
                </label>
                <div className="login-input-wrap">
                  <span className="login-input-icon" aria-hidden="true">👤</span>
                  <input
                    id="reg-name"
                    className="login-input"
                    type="text"
                    placeholder="Nama lengkap Anda"
                    autoComplete="name"
                    aria-invalid={errors.fullName ? "true" : "false"}
                    {...register("fullName", {
                      required: "Nama wajib diisi",
                      minLength: { value: 2, message: "Minimal 2 karakter" }
                    })}
                  />
                </div>
                {errors.fullName && <p className="login-error">{errors.fullName.message}</p>}
              </div>

              <div className="login-field">
                <label className="login-label" htmlFor="reg-email">
                  Email
                </label>
                <div className="login-input-wrap">
                  <span className="login-input-icon" aria-hidden="true">✉</span>
                  <input
                    id="reg-email"
                    className="login-input"
                    type="email"
                    placeholder="anda@domain.com"
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
                <label className="login-label" htmlFor="reg-password">
                  Kata Sandi
                </label>
                <div className="login-input-wrap">
                  <span className="login-input-icon" aria-hidden="true">🔒</span>
                  <input
                    id="reg-password"
                    className="login-input"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 6 karakter"
                    autoComplete="new-password"
                    aria-invalid={errors.password ? "true" : "false"}
                    {...register("password", {
                      required: "Kata sandi wajib diisi",
                      minLength: { value: 6, message: "Minimal 6 karakter" }
                    })}
                  />
                  <button
                    type="button"
                    className="login-eye"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                  >
                    {showPassword ? "🙈" : "👁"}
                  </button>
                </div>
                {errors.password && <p className="login-error">{errors.password.message}</p>}
              </div>

              <div className="login-field">
                <label className="login-label" htmlFor="reg-password2">
                  Konfirmasi Kata Sandi
                </label>
                <div className="login-input-wrap">
                  <span className="login-input-icon" aria-hidden="true">🔒</span>
                  <input
                    id="reg-password2"
                    className="login-input"
                    type={showPassword ? "text" : "password"}
                    placeholder="Ulangi kata sandi"
                    autoComplete="new-password"
                    aria-invalid={errors.passwordConfirm ? "true" : "false"}
                    {...register("passwordConfirm", {
                      required: "Konfirmasi wajib diisi",
                      validate: (value) => value === password || "Kata sandi tidak cocok"
                    })}
                  />
                </div>
                {errors.passwordConfirm && (
                  <p className="login-error">{errors.passwordConfirm.message}</p>
                )}
              </div>

              <button className="login-submit" type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span className="login-spinner" aria-hidden="true" />
                    <span>Mendaftarkan…</span>
                  </>
                ) : (
                  <span>Daftar</span>
                )}
              </button>
            </form>
          )}

          <p className="login-register">
            Sudah punya akun?{" "}
            <Link to="/login" className="login-register-link">
              Masuk di sini
            </Link>
          </p>

          <p className="login-note">
            {brand.name} · {brand.tagline}
          </p>
        </div>
      </motion.section>
    </main>
  );
}
