/**
 * Catalog cart, persisted per device. Prices shown here are only a preview —
 * the ERP re-prices catalog items from the products table at checkout.
 */

export type CartLine = {
  productId: string;
  name: string;
  price: number;
  weightKg: number;
  imageUrl: string | null;
  variant?: string;
  qty: number;
  tripId: string | null;
};

const STORAGE_KEY = "bb_cart_v1";
const EMPTY: CartLine[] = [];
let cache: CartLine[] | null = null;
const listeners = new Set<() => void>();

function read(): CartLine[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? (parsed as CartLine[]) : [];
  } catch {
    return [];
  }
}

function write(next: CartLine[]) {
  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // storage unavailable — cart still works for this page view
  }
  for (const listener of listeners) listener();
}

const lineKey = (line: Pick<CartLine, "productId" | "variant">) => `${line.productId}::${line.variant ?? ""}`;

export const cart = {
  get(): CartLine[] {
    if (typeof window === "undefined") return EMPTY;
    if (cache === null) cache = read();
    return cache;
  },
  getServer(): CartLine[] {
    return EMPTY;
  },
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  add(line: Omit<CartLine, "qty">, qty = 1) {
    const lines = cart.get();
    const existing = lines.find((l) => lineKey(l) === lineKey(line));
    write(
      existing
        ? lines.map((l) => (lineKey(l) === lineKey(line) ? { ...l, qty: Math.min(99, l.qty + qty) } : l))
        : [...lines, { ...line, qty }],
    );
  },
  setQty(line: Pick<CartLine, "productId" | "variant">, qty: number) {
    write(
      qty <= 0
        ? cart.get().filter((l) => lineKey(l) !== lineKey(line))
        : cart.get().map((l) => (lineKey(l) === lineKey(line) ? { ...l, qty: Math.min(99, qty) } : l)),
    );
  },
  clear() {
    write([]);
  },
};

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.qty, 0);
}
