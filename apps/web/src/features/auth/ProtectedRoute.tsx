import { Navigate } from "react-router-dom";
import { useAppSelector } from "../../app/hooks";

type ProtectedRouteProps = {
  requiredPermission?: string;
  children: JSX.Element;
};

export function ProtectedRoute({ requiredPermission, children }: ProtectedRouteProps) {
  const auth = useAppSelector((state) => state.auth);
  if (!auth.accessToken) {
    return <Navigate to="/login" replace />;
  }
  if (requiredPermission && !auth.permissions.includes(requiredPermission)) {
    return <Navigate to="/" replace />;
  }
  return children;
}
