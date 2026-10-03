import type { PricingBreakdown, TierId } from "@/lib/pricing";

/** Mirrors ORDER_REQUEST_STATUSES in apps/api/src/modules/order-requests. */
export type OrderRequestStatus =
  | "submitted"
  | "quoted"
  | "approved"
  | "paid"
  | "purchasing"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled";

export const ORDER_REQUEST_STATUSES_LIST: OrderRequestStatus[] = [
  "submitted", "quoted", "approved", "paid", "purchasing", "packed", "shipped", "delivered", "cancelled",
];

/** Customer-facing order of steps (cancelled is shown separately). */
export const ORDER_FLOW: OrderRequestStatus[] = [
  "submitted",
  "quoted",
  "approved",
  "paid",
  "purchasing",
  "packed",
  "shipped",
  "delivered",
];

export const ORDER_STEP_LABEL: Record<OrderRequestStatus, string> = {
  submitted: "Request diterima",
  quoted: "Penawaran harga",
  approved: "Menunggu pembayaran",
  paid: "Pembayaran diterima",
  purchasing: "Sedang dibelikan",
  packed: "Ditimbang & dikemas",
  shipped: "Dalam pengiriman",
  delivered: "Sudah diterima",
  cancelled: "Dibatalkan",
};

export const STATUS_BADGE: Record<OrderRequestStatus, "default" | "info" | "warning" | "success" | "danger" | "neutral"> = {
  submitted: "info",
  quoted: "warning",
  approved: "warning",
  paid: "success",
  purchasing: "default",
  packed: "default",
  shipped: "info",
  delivered: "success",
  cancelled: "danger",
};

export const OUT_OF_STOCK_LABEL: Record<string, string> = {
  ask: "Tanya saya dulu",
  substitute: "Ganti varian terdekat",
  cancel: "Batalkan item & refund",
};

export type OrderHistoryEntry = {
  status: OrderRequestStatus;
  at: string;
  note: string | null;
};

export type PublicOrderView = {
  code: string;
  source: "request" | "catalog";
  status: OrderRequestStatus;
  statusLabel: string;
  createdAt: string;
  updatedAt: string;
  customerName: string;
  customerPhone: string;
  city: string | null;
  tier: TierId;
  trip: { code: string; departAt: string; arriveEstimateAt: string | null } | null;
  items: Array<{
    name: string;
    qty: number;
    variant: string | null;
    maxPrice: number | null;
    unitPrice: number | null;
    imageUrl: string | null;
  }>;
  outOfStockPreference: string;
  estimate: PricingBreakdown | null;
  quote: PricingBreakdown | null;
  quoteNote: string | null;
  trackingNumber: string | null;
  paymentInstructions: string | null;
  history: OrderHistoryEntry[];
  canApprove: boolean;
  canCancel: boolean;
  canReview?: boolean;
  reviewSubmitted?: boolean;
  deliveryMethod?: "delivery" | "pickup";
  pickupPoint?: string | null;
};

export type ApiError = { error?: { code?: string; message?: string; details?: unknown } | string };

/** Pull a human message out of an ERP error body. */
export function errorMessage(body: unknown, fallback: string): string {
  const err = (body as ApiError | null)?.error;
  if (typeof err === "string") return err;
  return err?.message ?? fallback;
}
