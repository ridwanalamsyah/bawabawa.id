/**
 * Single source of truth for what each division may do.
 *
 * Previously every non-customer account received the full admin permission
 * set, so a sales or gudang login was effectively a superadmin. Permissions
 * are now resolved from the user's `division`, then widened with any
 * `custom_roles` rows an admin created for that division (see
 * `resolvePermissions` in auth.service.ts).
 */

export const PERMISSIONS = {
  ordersRead: "orders:read",
  ordersCreate: "orders:create",
  ordersUpdate: "orders:update",
  ordersApprove: "orders:approve",
  financeManage: "finance:manage_finance",
  usersManage: "users:manage_users",
  reportsExport: "reports:export",
  cmsManage: "cms:manage",
  inventoryManage: "inventory:manage",
  crmManage: "crm:manage",
  commsSend: "comms:send",
  dashboardView: "dashboard:view"
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const ALL: Permission[] = Object.values(PERMISSIONS);

const P = PERMISSIONS;

/**
 * Division → permissions. Divisions are free-form strings on `users`, so
 * the map covers the spellings already used by the admin UI and the
 * `custom_roles` enum (sales | gudang | admin | koordinator).
 */
const DIVISION_PERMISSIONS: Record<string, Permission[]> = {
  owner: ALL,
  admin: ALL,
  it: ALL,
  finance: [P.ordersRead, P.ordersApprove, P.financeManage, P.reportsExport, P.dashboardView],
  operations: [
    P.ordersRead,
    P.ordersCreate,
    P.ordersUpdate,
    P.inventoryManage,
    P.commsSend,
    P.dashboardView
  ],
  gudang: [P.ordersRead, P.ordersUpdate, P.inventoryManage, P.dashboardView],
  koordinator: [
    P.ordersRead,
    P.ordersCreate,
    P.ordersUpdate,
    P.ordersApprove,
    P.inventoryManage,
    P.commsSend,
    P.dashboardView
  ],
  sales: [P.ordersRead, P.ordersCreate, P.crmManage, P.commsSend, P.dashboardView],
  support: [P.ordersRead, P.crmManage, P.commsSend, P.dashboardView],
  marketing: [P.cmsManage, P.dashboardView],
  cms: [P.cmsManage, P.dashboardView],
  customer: [P.dashboardView]
};

/** Role label the public site uses to route people to /admin vs /dashboard. */
const DIVISION_ROLE: Record<string, string> = {
  owner: "owner",
  admin: "admin",
  it: "admin",
  finance: "finance",
  operations: "operations",
  gudang: "operations",
  koordinator: "operations",
  sales: "support",
  support: "support",
  marketing: "support",
  cms: "support",
  customer: "customer"
};

function normalize(division: string | null | undefined): string {
  return String(division ?? "").trim().toLowerCase();
}

export function permissionsForDivision(division: string | null | undefined): Permission[] {
  // Unknown divisions get read-only staff access rather than admin, so a
  // typo in the division field can never grant superuser rights.
  return DIVISION_PERMISSIONS[normalize(division)] ?? [P.ordersRead, P.dashboardView];
}

export function roleForDivision(division: string | null | undefined): string {
  return DIVISION_ROLE[normalize(division)] ?? "support";
}

export function isCustomerDivision(division: string | null | undefined): boolean {
  return normalize(division) === "customer";
}
