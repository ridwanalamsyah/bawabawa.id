import { Route, Routes } from "react-router-dom";
import { LoginPage } from "../features/auth/LoginPage";
import { ProtectedRoute } from "../features/auth/ProtectedRoute";
import { DashboardPage } from "../features/reports/DashboardPage";
import { OrdersPage } from "../features/orders/OrdersPage";
import { ErrorBoundary } from "../shared/ui/ErrorBoundary";
import { SalesPage } from "../features/sales/SalesPage";
import { InventoryPage } from "../features/inventory/InventoryPage";
import { ProcurementPage } from "../features/procurement/ProcurementPage";
import { FinancePage } from "../features/finance/FinancePage";
import { CrmPage } from "../features/crm/CrmPage";
import { HrPage } from "../features/hr/HrPage";
import { AdminPage } from "../features/admin/AdminPage";

export function AppRouter() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/orders"
          element={
            <ProtectedRoute requiredPermission="orders:read">
              <OrdersPage />
            </ProtectedRoute>
          }
        />
        <Route path="/sales" element={<ProtectedRoute><SalesPage /></ProtectedRoute>} />
        <Route
          path="/inventory"
          element={<ProtectedRoute><InventoryPage /></ProtectedRoute>}
        />
        <Route
          path="/procurement"
          element={<ProtectedRoute><ProcurementPage /></ProtectedRoute>}
        />
        <Route
          path="/finance"
          element={
            <ProtectedRoute requiredPermission="finance:manage_finance">
              <FinancePage />
            </ProtectedRoute>
          }
        />
        <Route path="/crm" element={<ProtectedRoute><CrmPage /></ProtectedRoute>} />
        <Route path="/hr" element={<ProtectedRoute><HrPage /></ProtectedRoute>} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredPermission="users:manage_users">
              <AdminPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </ErrorBoundary>
  );
}
