import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { brand } from "../../../design-system/brand";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { clearSession } from "../../../features/auth/auth.slice";
import { api } from "../../api/client";
import { usePermission } from "../../hooks/usePermission";
import { Button, Sheet, ThemeToggle } from "../primitives";
import { cn } from "../../lib/cn";
import "./app-shell.css";

export interface NavLinkDef {
  to: string;
  label: string;
  permission?: string;
  /** When provided, link is hidden unless the user has the role. */
  role?: string;
}

const DEFAULT_NAV: NavLinkDef[] = [
  { to: "/", label: "Dashboard" },
  { to: "/sales", label: "Sales" },
  { to: "/orders", label: "Orders", permission: "orders:read" },
  { to: "/inventory", label: "Inventory" },
  { to: "/procurement", label: "Procurement" },
  { to: "/finance", label: "Finance", permission: "finance:manage_finance" },
  { to: "/crm", label: "CRM" },
  { to: "/hr", label: "HR" },
  { to: "/admin", label: "Admin", permission: "users:manage_users" }
];

export interface AppShellProps {
  /** Override the default navigation list. */
  navLinks?: NavLinkDef[];
  children: ReactNode;
}

export function AppShell({ navLinks = DEFAULT_NAV, children }: AppShellProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const refreshToken = useAppSelector((state) => state.auth.refreshToken);
  const user = useAppSelector((state) => state.auth.user);

  const [shrink, setShrink] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const permission = usePermission();

  // Filter nav based on permissions/roles.
  const visibleLinks = useMemo(
    () =>
      navLinks.filter((link) => {
        if (link.permission && !permission.has(link.permission)) return false;
        if (link.role && !permission.hasRole(link.role)) return false;
        return true;
      }),
    [navLinks, permission]
  );

  // Close mobile menu whenever navigation changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setShrink(window.scrollY > 18);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function logout() {
    try {
      if (refreshToken) {
        await api.post("/auth/logout", { refreshToken });
      }
    } catch {
      // ignore logout API failure and continue local cleanup
    } finally {
      dispatch(clearSession());
      navigate("/login", { replace: true });
    }
  }

  const userInitials = (user?.fullName || user?.email || "User")
    .split(/\s+|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="bb-shell">
      <motion.nav
        className="bb-navbar"
        data-shrink={shrink ? "true" : "false"}
        data-burger-open={menuOpen ? "true" : "false"}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.36, ease: [0.32, 0.72, 0, 1] }}
        aria-label="Navigasi utama"
      >
        <Link to="/" className="bb-navbar-brand" aria-label={`Beranda ${brand.name}`}>
          <span className="bb-navbar-logo" aria-hidden="true">
            {brand.monogram}
          </span>
          <span>{brand.name}</span>
        </Link>

        <div className="bb-navbar-links" role="navigation">
          {visibleLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="bb-navbar-link"
              data-active={isActive(location.pathname, link.to) ? "true" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="bb-navbar-actions">
          <ThemeToggle />
          {permission.isAuthenticated ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="bb-navbar-logout-desktop"
            >
              Logout
            </Button>
          ) : null}
          <button
            type="button"
            className="bb-navbar-burger"
            onClick={() => setMenuOpen((value) => !value)}
            aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
            aria-expanded={menuOpen}
            aria-controls="bb-mobile-menu"
          >
            <span className="bb-burger-icon" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </button>
        </div>
      </motion.nav>

      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} ariaLabel="Menu navigasi">
        <div className="bb-sheet-header" id="bb-mobile-menu">
          <Link
            to="/"
            className="bb-navbar-brand"
            onClick={() => setMenuOpen(false)}
            aria-label={`Beranda ${brand.name}`}
          >
            <span className="bb-navbar-logo" aria-hidden="true">
              {brand.monogram}
            </span>
            <span>{brand.name}</span>
          </Link>
          <div style={{ display: "inline-flex", gap: 8 }}>
            <ThemeToggle />
            <button
              type="button"
              className="bb-sheet-close"
              onClick={() => setMenuOpen(false)}
              aria-label="Tutup menu"
            >
              ×
            </button>
          </div>
        </div>

        <ul className="bb-mobile-menu-list" role="list">
          {visibleLinks.map((link, index) => (
            <motion.li
              key={link.to}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 * index, duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
            >
              <Link
                to={link.to}
                className={cn("bb-mobile-menu-item")}
                data-active={isActive(location.pathname, link.to) ? "true" : undefined}
              >
                <span>{link.label}</span>
              </Link>
            </motion.li>
          ))}
        </ul>

        <div className="bb-mobile-menu-footer">
          {permission.isAuthenticated ? (
            <>
              <div className="bb-mobile-menu-user">
                <span className="bb-mobile-menu-user-avatar" aria-hidden="true">
                  {userInitials || "U"}
                </span>
                <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
                  <strong style={{ color: "var(--color-text-strong)" }}>
                    {user?.fullName || user?.email || "Pengguna"}
                  </strong>
                  {user?.division ? <span>{user.division}</span> : null}
                </div>
              </div>
              <Button variant="outline" onClick={logout} size="lg">
                Logout
              </Button>
            </>
          ) : (
            <Link to="/login">
              <Button variant="primary" size="lg" style={{ width: "100%" }}>
                Masuk
              </Button>
            </Link>
          )}
        </div>
      </Sheet>

      <main className="bb-shell-main" id="main">
        {children}
      </main>
    </div>
  );
}

function isActive(pathname: string, target: string): boolean {
  if (target === "/") return pathname === "/";
  return pathname === target || pathname.startsWith(`${target}/`);
}
