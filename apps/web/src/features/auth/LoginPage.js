import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { api } from "../../shared/api/client";
import { useAppDispatch } from "../../app/hooks";
import { setSession } from "./auth.slice";
import { brand } from "../../design-system/brand";
import { useState } from "react";
import "./LoginPage.css";
export function LoginPage() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const [apiError, setApiError] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm();
    async function onSubmit(input) {
        setApiError(null);
        try {
            const response = await api.post("/auth/login", input);
            const payload = response.data.data;
            dispatch(setSession({
                accessToken: payload.accessToken,
                refreshToken: payload.refreshToken,
                user: payload.user,
                permissions: payload.user.permissions ?? []
            }));
            navigate("/", { replace: true });
        }
        catch (e) {
            const msg = e?.response?.data?.error?.message ||
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
    return _jsxs("main", {
        className: "login-page", children: [
            _jsx("div", { className: "login-bg-orb login-bg-orb--1" }),
            _jsx("div", { className: "login-bg-orb login-bg-orb--2" }),
            _jsx("div", { className: "login-bg-orb login-bg-orb--3" }),
            _jsxs("section", {
                className: "login-card", children: [
                    _jsx("div", { className: "login-logo", children: _jsx("span", { className: "login-monogram", children: "BW" }) }),
                    _jsx("h1", { className: "login-headline", children: brand.name }),
                    _jsx("p", { className: "login-subtitle", children: "Enterprise Resource Planning" }),
                    _jsxs("button", {
                        type: "button", className: "login-demo-hint", onClick: fillDemo, children: [
                            _jsx("span", { className: "login-demo-icon", children: "\u26A1" }),
                            _jsxs("span", { children: ["Isi otomatis akun demo\u00A0 ", _jsx("code", { children: "admin@erp.com" })] }),
                            _jsx("span", { className: "login-demo-arrow", children: "\u2192" })
                        ]
                    }),
                    _jsxs("form", {
                        onSubmit: handleSubmit(onSubmit), className: "login-form", children: [
                            apiError && _jsxs("div", {
                                className: "login-alert", children: [
                                    _jsx("span", { children: "\u26A0" }),
                                    _jsx("span", { children: apiError })
                                ]
                            }),
                            _jsxs("div", {
                                className: "login-field", children: [
                                    _jsx("label", { className: "login-label", htmlFor: "login-email", children: "Email" }),
                                    _jsxs("div", {
                                        className: "login-input-wrap", children: [
                                            _jsx("span", { className: "login-input-icon", children: "\u2709" }),
                                            _jsx("input", {
                                                id: "login-email",
                                                className: "login-input",
                                                type: "email",
                                                placeholder: "you@domain.com",
                                                autoComplete: "email",
                                                ...register("email", { required: "Email wajib diisi" })
                                            })
                                        ]
                                    }),
                                    errors.email && _jsx("p", { className: "login-error", children: errors.email.message })
                                ]
                            }),
                            _jsxs("div", {
                                className: "login-field", children: [
                                    _jsx("label", { className: "login-label", htmlFor: "login-password", children: "Password" }),
                                    _jsxs("div", {
                                        className: "login-input-wrap", children: [
                                            _jsx("span", { className: "login-input-icon", children: "\uD83D\uDD12" }),
                                            _jsx("input", {
                                                id: "login-password",
                                                className: "login-input",
                                                type: showPassword ? "text" : "password",
                                                placeholder: "Min. 6 karakter",
                                                autoComplete: "current-password",
                                                ...register("password", {
                                                    required: "Password wajib diisi",
                                                    minLength: { value: 6, message: "Minimal 6 karakter" }
                                                })
                                            }),
                                            _jsx("button", {
                                                type: "button",
                                                className: "login-eye",
                                                onClick: () => setShowPassword(s => !s),
                                                "aria-label": "Toggle password visibility",
                                                children: showPassword ? "\uD83D\uDE48" : "\uD83D\uDC41"
                                            })
                                        ]
                                    }),
                                    errors.password && _jsx("p", { className: "login-error", children: errors.password.message })
                                ]
                            }),
                            _jsx("button", {
                                className: "login-submit",
                                type: "submit",
                                disabled: isSubmitting,
                                id: "btn-login",
                                children: isSubmitting ? _jsx("span", { className: "login-spinner" }) : "Masuk ke Dashboard"
                            })
                        ]
                    }),
                    _jsx("p", { className: "login-note", children: `${brand.name} · Sistem Manajemen Bisnis Terpadu` })
                ]
            })
        ]
    });
}
