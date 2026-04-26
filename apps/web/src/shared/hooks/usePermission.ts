import { useAppSelector } from "../../app/hooks";

const SUPER_ROLES = ["superadmin", "super_admin", "owner", "root"] as const;

/**
 * Check whether the currently logged-in user has the given permission(s) and/or role(s).
 *
 * Permissions follow the `resource:action` convention used by the backend RBAC module
 * (e.g. `orders:read`, `finance:manage_finance`). Pass either a single permission, an
 * array, or omit to only check the role list.
 *
 * Returns helpers in addition to a boolean to simplify conditional rendering:
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
) {
  const auth = useAppSelector((state) => state.auth);

  const userPerms = auth.permissions ?? [];
  const userRoles = auth.user?.roles ?? [];

  const reqPerms = Array.isArray(required) ? required : required ? [required] : [];
  const reqRoles = Array.isArray(requiredRoles)
    ? requiredRoles
    : requiredRoles
    ? [requiredRoles]
    : [];

  const isSuper = userRoles.some((role) =>
    (SUPER_ROLES as readonly string[]).includes(role.toLowerCase())
  );

  const hasAllPerms = reqPerms.every((perm) => userPerms.includes(perm));
  const hasAnyRole = reqRoles.length === 0 || reqRoles.some((role) => userRoles.includes(role));

  // No specific check requested → just verify session is authenticated.
  const isAuthenticated = Boolean(auth.accessToken);
  const allowed = isAuthenticated && (isSuper || (hasAllPerms && hasAnyRole));

  return {
    allowed,
    isAuthenticated,
    isSuper,
    has: (perm: string) => isSuper || userPerms.includes(perm),
    hasAny: (perms: string[]) => isSuper || perms.some((perm) => userPerms.includes(perm)),
    hasAll: (perms: string[]) => isSuper || perms.every((perm) => userPerms.includes(perm)),
    hasRole: (role: string) => isSuper || userRoles.includes(role)
  };
}
