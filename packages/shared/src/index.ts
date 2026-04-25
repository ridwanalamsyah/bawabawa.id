export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type SessionUser = {
  id: string;
  email: string;
  fullName?: string;
  division?: string;
  roles?: string[];
  permissions?: string[];
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: SessionUser;
};

export type PermissionAction =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "approve"
  | "export"
  | "manage_users"
  | "manage_finance";

export type OrderStatus =
  | "draft"
  | "confirmed"
  | "payment_pending"
  | "payment_dp"
  | "payment_paid"
  | "stock_reserved"
  | "packed"
  | "shipped"
  | "invoiced"
  | "posted_finance"
  | "cancelled";

export type ProfitShareRule = {
  owner: string;
  percentage: number;
};
