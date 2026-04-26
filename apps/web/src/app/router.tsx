import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "../features/auth/ProtectedRoute";
import { ErrorBoundary } from "../shared/ui/ErrorBoundary";
import { Seo } from "../shared/seo/Seo";

/**
 * All non-trivial route modules are lazy-loaded so the initial JS bundle only
 * carries the auth shell + the dashboard. Each chunk gets a debug name for
 * easier inspection in network panels.
 */
const LoginPage = lazy(() => import("../features/auth/LoginPage").then((m) => ({ default: m.LoginPage })));
const DashboardPage = lazy(() => import("../features/reports/DashboardPage").then((m) => ({ default: m.DashboardPage })));
const OrdersPage = lazy(() => import("../features/orders/OrdersPage").then((m) => ({ default: m.OrdersPage })));
const SalesPage = lazy(() => import("../features/sales/SalesPage").then((m) => ({ default: m.SalesPage })));
const InventoryPage = lazy(() => import("../features/inventory/InventoryPage").then((m) => ({ default: m.InventoryPage })));
const ProcurementPage = lazy(() =>
  import("../features/procurement/ProcurementPage").then((m) => ({ default: m.ProcurementPage }))
);
const FinancePage = lazy(() => import("../features/finance/FinancePage").then((m) => ({ default: m.FinancePage })));
const CrmPage = lazy(() => import("../features/crm/CrmPage").then((m) => ({ default: m.CrmPage })));
const HrPage = lazy(() => import("../features/hr/HrPage").then((m) => ({ default: m.HrPage })));
const AdminPage = lazy(() => import("../features/admin/AdminPage").then((m) => ({ default: m.AdminPage })));
const SiteSettingsPage = lazy(() =>
  import("../features/admin/SiteSettingsPage").then((m) => ({ default: m.SiteSettingsPage }))
);
const NavigationPage = lazy(() =>
  import("../features/admin/NavigationPage").then((m) => ({ default: m.NavigationPage }))
);
const PagesPage = lazy(() => import("../features/admin/PagesPage").then((m) => ({ default: m.PagesPage })));
const SectionsPage = lazy(() => import("../features/admin/SectionsPage").then((m) => ({ default: m.SectionsPage })));
const MediaPage = lazy(() => import("../features/admin/MediaPage").then((m) => ({ default: m.MediaPage })));

function RouteFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        color: "var(--color-muted)",
        fontSize: 14,
        background: "transparent"
      }}
    >
      Memuat modul…
    </div>
  );
}

export function AppRouter() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Seo title="Dashboard" noindex />
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/login"
            element={
              <>
                <Seo title="Login" noindex />
                <LoginPage />
              </>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute requiredPermission="orders:read">
                <Seo title="Orders" noindex />
                <OrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sales"
            element={
              <ProtectedRoute>
                <Seo title="Sales" noindex />
                <SalesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory"
            element={
              <ProtectedRoute>
                <Seo title="Inventory" noindex />
                <InventoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/procurement"
            element={
              <ProtectedRoute>
                <Seo title="Procurement" noindex />
                <ProcurementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/finance"
            element={
              <ProtectedRoute requiredPermission="finance:manage_finance">
                <Seo title="Finance" noindex />
                <FinancePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/crm"
            element={
              <ProtectedRoute>
                <Seo title="CRM" noindex />
                <CrmPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr"
            element={
              <ProtectedRoute>
                <Seo title="HR" noindex />
                <HrPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredPermission="users:manage_users">
                <Seo title="Admin" noindex />
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/cms/settings"
            element={
              <ProtectedRoute requiredPermission="cms:manage">
                <Seo title="Site Settings" noindex />
                <SiteSettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/cms/navigation"
            element={
              <ProtectedRoute requiredPermission="cms:manage">
                <Seo title="Navigation" noindex />
                <NavigationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/cms/pages"
            element={
              <ProtectedRoute requiredPermission="cms:manage">
                <Seo title="Pages" noindex />
                <PagesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/cms/sections"
            element={
              <ProtectedRoute requiredPermission="cms:manage">
                <Seo title="Sections" noindex />
                <SectionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/cms/media"
            element={
              <ProtectedRoute requiredPermission="cms:manage">
                <Seo title="Media" noindex />
                <MediaPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
