import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { brand } from "../../design-system/brand";
import "./enterprise-shell.css";

type EnterpriseModulePageProps = {
  title: string;
  subtitle: string;
  points: string[];
};

export function EnterpriseModulePage({
  title,
  subtitle,
  points
}: EnterpriseModulePageProps) {
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

  return (
    <main className="module-shell">
      <nav className={`module-nav ${menuOpen ? "open" : ""} ${shrink ? "shrink" : ""}`}>
        <div className="module-brand">
          <div className="module-brand-logo">{brand.monogram}</div>
          <div className="module-brand-name">{brand.name}</div>
        </div>
        <button
          type="button"
          className="module-menu-btn"
          onClick={() => setMenuOpen((state) => !state)}
          aria-label="Toggle menu"
        >
          ☰
        </button>
        <div className="module-nav-list">
          {links.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`module-nav-link ${location.pathname === link.path ? "active" : ""}`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
      <section className="module-hero-card">
        <h1 className="module-title">{title}</h1>
        <p className="module-subtitle">{subtitle}</p>
        <strong>Scope aktif</strong>
        <ul className="module-list">
          {points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
