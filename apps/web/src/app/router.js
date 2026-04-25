import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
    return (_jsx(ErrorBoundary, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(ProtectedRoute, { children: _jsx(DashboardPage, {}) }) }), _jsx(Route, { path: "/login", element: _jsx(LoginPage, {}) }), _jsx(Route, { path: "/orders", element: _jsx(ProtectedRoute, { requiredPermission: "orders:read", children: _jsx(OrdersPage, {}) }) }), _jsx(Route, { path: "/sales", element: _jsx(ProtectedRoute, { children: _jsx(SalesPage, {}) }) }), _jsx(Route, { path: "/inventory", element: _jsx(ProtectedRoute, { children: _jsx(InventoryPage, {}) }) }), _jsx(Route, { path: "/procurement", element: _jsx(ProtectedRoute, { children: _jsx(ProcurementPage, {}) }) }), _jsx(Route, { path: "/finance", element: _jsx(ProtectedRoute, { requiredPermission: "finance:manage_finance", children: _jsx(FinancePage, {}) }) }), _jsx(Route, { path: "/crm", element: _jsx(ProtectedRoute, { children: _jsx(CrmPage, {}) }) }), _jsx(Route, { path: "/hr", element: _jsx(ProtectedRoute, { children: _jsx(HrPage, {}) }) }), _jsx(Route, { path: "/admin", element: _jsx(ProtectedRoute, { requiredPermission: "users:manage_users", children: _jsx(AdminPage, {}) }) })] }) }));
}
