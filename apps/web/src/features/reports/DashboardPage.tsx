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
    } catch {
      // Ignore logout API failure and continue local session cleanup.
    } finally {
      dispatch(clearSession());
      navigate("/login", { replace: true });
    }
  }

  useEffect(() => {
    const onScroll = () => setShrink(window.scrollY > 18);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <main className="dashboard-page dashboard-shell">
      <nav className={`dashboard-nav ${shrink ? "shrink" : ""} ${menuOpen ? "open" : ""}`}>
        <div className="dashboard-brand">
          <div className="dashboard-brand-logo">BW</div>
          <div>bawabawa.id</div>
        </div>
        <button type="button" className="dashboard-menu-btn" onClick={() => setMenuOpen((v) => !v)}>
          ☰
        </button>
        <div className="dashboard-nav-links">
          <Link to="/sales">Sales</Link>
          <Link to="/orders">Orders</Link>
          <Link to="/inventory">Inventory</Link>
          <Link to="/finance">Finance</Link>
          <button className="dashboard-module-link dashboard-logout" onClick={logout} type="button">
            Logout
          </button>
        </div>
      </nav>
      <section className="dashboard-card">
        <h1>bawabawa.id Control Center</h1>
        <p>
          Dashboard modular aktif dengan visual glass dan status cloud secara real-time.
        </p>
        <div className="dashboard-chart-grid">
          <article className="dashboard-mini-chart">
            <h3>Sales Pulse</h3>
            <div className="bars">
              <span style={{ height: "36%" }} />
              <span style={{ height: "58%" }} />
              <span style={{ height: "72%" }} />
              <span style={{ height: "45%" }} />
              <span style={{ height: "84%" }} />
            </div>
          </article>
          <article className="dashboard-mini-chart">
            <h3>Finance Signal</h3>
            <div className="trend-line">
              <div />
            </div>
          </article>
        </div>
      </section>
      <section className="dashboard-grid">
        {modules.map((module) => (
          <Link key={module.path} to={module.path} className="dashboard-module-link">
            {module.label}
          </Link>
        ))}
      </section>
    </main>
  );
}
