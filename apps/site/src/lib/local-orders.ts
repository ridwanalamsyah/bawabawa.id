/**
 * Lightweight client-side store of recent guest checkouts so a customer
 * who didn't log in can still reach their tracking page from any device
 * that has the link.
 *
 * The data is intentionally non-authoritative — the source of truth is
 * the ERP API once a customer signs up or links the tracking token. This
 * just powers the `/track/[token]` page during the guest window before
 * the order is persisted upstream.
 *
 * Storage: localStorage under `bb_orders_v1`, indexed by token. Bounded
 * to the last 20 orders to avoid unbounded quota growth.
 */

import type { PricingBreakdown, TierId } from "./pricing";

const STORAGE_KEY = "bb_orders_v1";
const MAX_ORDERS = 20;

export type LocalOrderStatus =
  | "pending_payment"
  | "shopping"
  | "packed"
  | "in_transit"
  | "delivered"
  | "cancelled";

export type LocalOrder = {
  token: string;
  code: string;
  createdAt: string;
  tier: TierId;
  // For tier=fast (Reguler) we ship via ekspedisi reguler directly, so
  // there is no Open Trip attached — these fields stay undefined and the
  // tracking page degrades gracefully.
  tripCode?: string;
  tripDepartAt?: string;
  tripArriveEstimateAt?: string;
  items: Array<{
    name: string;
    category: string;
    qty: number;
    estPrice: number;
    notes: string;
  }>;
  address: {
    name: string;
    phone: string;
    street: string;
    city: string;
    postal: string;
    label: string;
    notes: string;
  };
  payment: "qris" | "transfer" | "ewallet";
  pricing: PricingBreakdown;
  totalKg: number;
  status: LocalOrderStatus;
};

export function generateTrackingToken(): string {
  // Cryptographically random 16-byte token, base32-ish url-safe encoding.
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replace(/-/g, "");
  }
  // Fallback for very old runtimes.
  return Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 36).toString(36),
  ).join("");
}

function readStore(): Record<string, LocalOrder> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return parsed as Record<string, LocalOrder>;
    }
    return {};
  } catch {
    return {};
  }
}

function writeStore(store: Record<string, LocalOrder>): void {
  if (typeof window === "undefined") return;
  try {
    // Trim to MAX_ORDERS, keeping the most recent by createdAt.
    const entries = Object.entries(store).sort(
      ([, a], [, b]) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
    );
    const trimmed = Object.fromEntries(entries.slice(0, MAX_ORDERS));
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Quota exceeded or other storage error — fail silently.
  }
}

export function saveLocalOrder(order: LocalOrder): void {
  const store = readStore();
  store[order.token] = order;
  writeStore(store);
}

export function getLocalOrder(token: string): LocalOrder | null {
  const store = readStore();
  return store[token] ?? null;
}

export function listLocalOrders(): LocalOrder[] {
  const store = readStore();
  return Object.values(store).sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
}

// React-friendly snapshot helpers that survive React 19's strict
// effect-state-sync linting (react-hooks/set-state-in-effect).
//
// Returns stable references for empty lists so `useSyncExternalStore`'s
// equality check doesn't trigger an infinite render loop.
const EMPTY_ARRAY: LocalOrder[] = [];
let cachedListSig: string | null = null;
let cachedList: LocalOrder[] = EMPTY_ARRAY;

export function getLocalOrderListSnapshot(): LocalOrder[] {
  if (typeof window === "undefined") return EMPTY_ARRAY;
  const raw = window.localStorage.getItem(STORAGE_KEY) ?? "";
  if (raw === cachedListSig) return cachedList;
  cachedListSig = raw;
  cachedList = listLocalOrders();
  return cachedList;
}

export function getLocalOrderSnapshot(token: string): LocalOrder | null {
  if (typeof window === "undefined") return null;
  return getLocalOrder(token);
}

export function subscribeLocalOrders(callback: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const handler = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) callback();
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}
