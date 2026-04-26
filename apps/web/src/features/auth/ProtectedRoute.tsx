import { Navigate } from "react-router-dom";
import { useAppSelector } from "../../app/hooks";
import { ForbiddenPage } from "../errors/ForbiddenPage";

type ProtectedRouteProps = {
  requiredPermission?: string;
  /** Optional list of acceptable roles (e.g. `["admin", "superadmin"]`). */
  requiredRoles?: string[];
  children: JSX.Element;
};

const SUPER_ROLES = new Set(["superadmin", "super_admin", "owner", "root"]);

export function ProtectedRoute({ requiredPermission, requiredRoles, children }: ProtectedRouteProps) {
  const auth = useAppSelector((state) => state.auth);

  if (!auth.accessToken) {
    return <Navigate to="/login" replace />;
  }

  const userRoles = auth.user?.roles ?? [];
  const isSuper = userRoles.some((role) => SUPER_ROLES.has(role.toLowerCase()));

  const lacksPermission =
    !!requiredPermission && !isSuper && !auth.permissions.includes(requiredPermission);
  const lacksRole =
    !!requiredRoles &&
    requiredRoles.length > 0 &&
    !isSuper &&
    !requiredRoles.some((role) => userRoles.includes(role));

  if (lacksPermission || lacksRole) {
    return <ForbiddenPage requiredPermission={requiredPermission} />;
  }

  return children;
}
