import { useMemo } from "react";
import { useAppSelector } from "../../app/hooks";

const SUPER_ROLES = ["superadmin", "super_admin", "owner", "root"] as const;

export interface PermissionState {
  /**
   * `true` when the user is authenticated AND meets every required permission/role
   * passed to {@link usePermission}. Superadmin-equivalent roles always evaluate to
   * `true` regardless of the requested permissions.
   */
  allowed: boolean;
  isAuthenticated: boolean;
  isSuper: boolean;
  has: (perm: string) => boolean;
  hasAny: (perms: string[]) => boolean;
  hasAll: (perms: string[]) => boolean;
  hasRole: (role: string) => boolean;
}

/**
 * Check whether the currently logged-in user has the given permission(s) and/or role(s).
 *
 * Permissions follow the `resource:action` convention used by the backend RBAC module
 * (e.g. `orders:read`, `finance:manage_finance`). Pass either a single permission, an
 * array, or omit to only check the role list.
 *
 * The returned object is memoized — its identity stays stable across renders as long as
 * the underlying auth state (permissions, roles, session) and the requested permissions/
 * roles do not change. This keeps it safe to use as a `useMemo`/`useEffect` dependency.
 *
 *   const can = usePermission("orders:write");
 *   if (!can.allowed) return null;
 *   return <Button>Edit Order</Button>;
 *
 *   const isAdmin = usePermission(undefined, ["admin", "superadmin"]).allowed;
 */
export function usePermission(
  required?: string | string[],
  requiredRoles?: string | string[]
): PermissionState {
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const userPerms = useAppSelector((state) => state.auth.permissions);
  const userRoles = useAppSelector((state) => state.auth.user?.roles);

  // Stable string keys so callers can pass freshly-allocated arrays without
  // breaking memoization downstream.
  const reqPerms = useMemo(
    () => (Array.isArray(required) ? required : required ? [required] : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [Array.isArray(required) ? required.join("|") : required]
  );
  const reqRoles = useMemo(
    () => (Array.isArray(requiredRoles) ? requiredRoles : requiredRoles ? [requiredRoles] : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [Array.isArray(requiredRoles) ? requiredRoles.join("|") : requiredRoles]
  );

  return useMemo<PermissionState>(() => {
    const perms = userPerms ?? [];
    const roles = userRoles ?? [];

    const isAuthenticated = Boolean(accessToken);
    const isSuper = roles.some((role) =>
      (SUPER_ROLES as readonly string[]).includes(role.toLowerCase())
    );

    const hasAllPerms = reqPerms.every((perm) => perms.includes(perm));
    const hasAnyRole = reqRoles.length === 0 || reqRoles.some((role) => roles.includes(role));
    const allowed = isAuthenticated && (isSuper || (hasAllPerms && hasAnyRole));

    return {
      allowed,
      isAuthenticated,
      isSuper,
      has: (perm: string) => isSuper || perms.includes(perm),
      hasAny: (perms2: string[]) => isSuper || perms2.some((perm) => perms.includes(perm)),
      hasAll: (perms2: string[]) => isSuper || perms2.every((perm) => perms.includes(perm)),
      hasRole: (role: string) => isSuper || roles.includes(role)
    };
  }, [accessToken, userPerms, userRoles, reqPerms, reqRoles]);
}
