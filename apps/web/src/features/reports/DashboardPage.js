import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import "./DashboardPage.css";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { clearSession } from "../auth/auth.slice";
import { api } from "../../shared/api/client";
import { useEffect, useState } from "react";
export function DashboardPage() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const refreshToken = useAppSelector((state) => state.auth.refreshToken);
    const [shrink, setShrink] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const modules = [
        { path: "/sales", label: "Sales" },
        { path: "/inventory", label: "Inventory" },
        { path: "/procurement", label: "Procurement" },
        { path: "/finance", label: "Finance" },
        { path: "/crm", label: "CRM" },
        { path: "/hr", label: "HR" },
        { path: "/admin", label: "Admin" }
    ];
    async function logout() {
        try {
            if (refreshToken) {
                await api.post("/auth/logout", { refreshToken });
            }
        }
        catch {
            // Ignore logout API failure and continue local session cleanup.
        }
        finally {
            dispatch(clearSession());
            navigate("/login", { replace: true });
        }
    }
    useEffect(() => {
        const onScroll = () => setShrink(window.scrollY > 18);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);
    return (_jsxs("main", { className: "dashboard-page dashboard-shell", children: [_jsxs("nav", { className: `dashboard-nav ${shrink ? "shrink" : ""} ${menuOpen ? "open" : ""}`, children: [_jsxs("div", { className: "dashboard-brand", children: [_jsx("div", { className: "dashboard-brand-logo", children: "BW" }), _jsx("div", { children: "bawabawa.id" })] }), _jsx("button", { type: "button", className: "dashboard-menu-btn", onClick: () => setMenuOpen((v) => !v), children: "\u2630" }), _jsxs("div", { className: "dashboard-nav-links", children: [_jsx(Link, { to: "/sales", children: "Sales" }), _jsx(Link, { to: "/orders", children: "Orders" }), _jsx(Link, { to: "/inventory", children: "Inventory" }), _jsx(Link, { to: "/finance", children: "Finance" }), _jsx("button", { className: "dashboard-module-link dashboard-logout", onClick: logout, type: "button", children: "Logout" })] })] }), _jsxs("section", { className: "dashboard-card", children: [_jsx("h1", { children: "bawabawa.id Control Center" }), _jsx("p", { children: "Dashboard modular aktif dengan visual glass dan status cloud secara real-time." }), _jsxs("div", { className: "dashboard-chart-grid", children: [_jsxs("article", { className: "dashboard-mini-chart", children: [_jsx("h3", { children: "Sales Pulse" }), _jsxs("div", { className: "bars", children: [_jsx("span", { style: { height: "36%" } }), _jsx("span", { style: { height: "58%" } }), _jsx("span", { style: { height: "72%" } }), _jsx("span", { style: { height: "45%" } }), _jsx("span", { style: { height: "84%" } })] })] }), _jsxs("article", { className: "dashboard-mini-chart", children: [_jsx("h3", { children: "Finance Signal" }), _jsx("div", { className: "trend-line", children: _jsx("div", {}) })] })] })] }), _jsx("section", { className: "dashboard-grid", children: modules.map((module) => (_jsx(Link, { to: module.path, className: "dashboard-module-link", children: module.label }, module.path))) })] }));
}
