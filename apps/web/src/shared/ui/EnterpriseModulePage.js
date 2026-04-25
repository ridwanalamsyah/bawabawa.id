import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { brand } from "../../design-system/brand";
import "./enterprise-shell.css";
export function EnterpriseModulePage({ title, subtitle, points }) {
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);
    const [shrink, setShrink] = useState(false);
    useEffect(() => {
        const onScroll = () => setShrink(window.scrollY > 18);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);
    const links = [
        { path: "/", label: "Dashboard" },
        { path: "/orders", label: "Orders" },
        { path: "/procurement", label: "PO" },
        { path: "/finance", label: "Finance" },
        { path: "/admin", label: "Admin" }
    ];
    return (_jsxs("main", { className: "module-shell", children: [_jsxs("nav", { className: `module-nav ${menuOpen ? "open" : ""} ${shrink ? "shrink" : ""}`, children: [_jsxs("div", { className: "module-brand", children: [_jsx("div", { className: "module-brand-logo", children: brand.monogram }), _jsx("div", { className: "module-brand-name", children: brand.name })] }), _jsx("button", { type: "button", className: "module-menu-btn", onClick: () => setMenuOpen((state) => !state), "aria-label": "Toggle menu", children: "\u2630" }), _jsx("div", { className: "module-nav-list", children: links.map((link) => (_jsx(Link, { to: link.path, className: `module-nav-link ${location.pathname === link.path ? "active" : ""}`, children: link.label }, link.path))) })] }), _jsxs("section", { className: "module-hero-card", children: [_jsx("h1", { className: "module-title", children: title }), _jsx("p", { className: "module-subtitle", children: subtitle }), _jsx("strong", { children: "Scope aktif" }), _jsx("ul", { className: "module-list", children: points.map((point) => (_jsx("li", { children: point }, point))) })] })] }));
}
