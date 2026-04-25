import { jsx as _jsx } from "react/jsx-runtime";
import { Navigate } from "react-router-dom";
import { useAppSelector } from "../../app/hooks";
export function ProtectedRoute({ requiredPermission, children }) {
    const auth = useAppSelector((state) => state.auth);
    if (!auth.accessToken) {
        return _jsx(Navigate, { to: "/login", replace: true });
    }
    if (requiredPermission && !auth.permissions.includes(requiredPermission)) {
        return _jsx(Navigate, { to: "/", replace: true });
    }
    return children;
}
