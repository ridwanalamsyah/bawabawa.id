import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { api } from "../../shared/api/client";
import { useAppDispatch } from "../../app/hooks";
import { setSession } from "./auth.slice";
import { brand } from "../../design-system/brand";
import { useState } from "react";
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
      navigate("/", { replace: true });
    } catch (e: any) {
      const msg =
        e?.response?.data?.error?.message ||
        e?.response?.data?.message ||
        e?.message ||
        "Login gagal. Periksa email & password.";
      setApiError(String(msg));
    }
  }

  function fillDemo() {
    setValue("email", "admin@erp.com");
    setValue("password", "admin123");
  }

  return (
    <main className="login-page">
      {/* Background decorations */}
      <div className="login-bg-orb login-bg-orb--1" />
      <div className="login-bg-orb login-bg-orb--2" />
      <div className="login-bg-orb login-bg-orb--3" />

      <section className="login-card">
        {/* Logo / Monogram */}
        <div className="login-logo">
          <span className="login-monogram">BW</span>
        </div>

        <h1 className="login-headline">{brand.name}</h1>
        <p className="login-subtitle">Enterprise Resource Planning</p>

        {/* Demo credential hint */}
        <button type="button" className="login-demo-hint" onClick={fillDemo}>
          <span className="login-demo-icon">⚡</span>
          <span>
            Isi otomatis akun demo &nbsp;
            <code>admin@erp.com</code>
          </span>
          <span className="login-demo-arrow">→</span>
        </button>

        <form onSubmit={handleSubmit(onSubmit)} className="login-form">
          {apiError && (
            <div className="login-alert">
              <span>⚠</span>
              <span>{apiError}</span>
            </div>
          )}

          <div className="login-field">
            <label className="login-label" htmlFor="login-email">Email</label>
            <div className="login-input-wrap">
              <span className="login-input-icon">✉</span>
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
            <label className="login-label" htmlFor="login-password">Password</label>
            <div className="login-input-wrap">
              <span className="login-input-icon">🔒</span>
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
                onClick={() => setShowPassword(s => !s)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>
            {errors.password && <p className="login-error">{errors.password.message}</p>}
          </div>

          <button className="login-submit" type="submit" disabled={isSubmitting} id="btn-login">
            {isSubmitting ? (
              <span className="login-spinner" />
            ) : (
              "Masuk ke Dashboard"
            )}
          </button>
        </form>

        <p className="login-note">
          {brand.name} · Sistem Manajemen Bisnis Terpadu
        </p>
      </section>
    </main>
  );
}
