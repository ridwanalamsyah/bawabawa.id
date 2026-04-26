import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { api } from "../../shared/api/client";
import { useAppDispatch } from "../../app/hooks";
import { setSession } from "./auth.slice";
import { brand } from "../../design-system/brand";
import { ThemeToggle } from "../../shared/ui/primitives/ThemeToggle";
import "./LoginPage.css";
import type { LoginResponse } from "@erp/shared";

type LoginInput = { email: string; password: string };

export function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
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
      <div style={{ position: "absolute", top: 24, right: 24, zIndex: 5 }}>
        <ThemeToggle />
      </div>

      <div className="login-bg-orb login-bg-orb--1" />
      <div className="login-bg-orb login-bg-orb--2" />
      <div className="login-bg-orb login-bg-orb--3" />

      <motion.section
        className="login-card"
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
      >
        <div className="login-logo">
          <span className="login-monogram">{brand.monogram}</span>
        </div>

        <h1 className="login-headline">{brand.name}</h1>
        <p className="login-subtitle">Enterprise Resource Planning</p>

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
                {...register("email", { required: "Email wajib diisi" })}
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
                placeholder="Min. 8 karakter"
                autoComplete="current-password"
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
            {isSubmitting ? <span className="login-spinner" aria-hidden="true" /> : "Masuk ke Dashboard"}
          </button>
        </form>

        <p className="login-note">{brand.name} · Sistem Manajemen Bisnis Terpadu</p>
      </motion.section>
    </main>
  );
}
