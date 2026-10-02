/**
 * Device-local list of orders submitted from this browser, so a guest can
 * find their tracking links again without logging in. The ERP is the source
 * of truth — this only remembers {code, token}; every detail shown on
 * /track/[token] is fetched from the server.
 */

const STORAGE_KEY = "bb_order_links_v2";
const MAX_ORDERS = 20;

export type LocalOrderLink = {
  token: string;
  code: string;
  createdAt: string;
  itemCount: number;
  estimateTotal: number;
};

function read(): LocalOrderLink[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? (parsed as LocalOrderLink[]) : [];
  } catch {
    return [];
  }
}

let cache: LocalOrderLink[] | null = null;
const listeners = new Set<() => void>();

export function getLocalOrderLinks(): LocalOrderLink[] {
  if (cache === null) cache = read();
  return cache;
}

export function getServerLocalOrderLinks(): LocalOrderLink[] {
  return EMPTY;
}
const EMPTY: LocalOrderLink[] = [];

export function subscribeLocalOrderLinks(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function rememberOrderLink(link: LocalOrderLink): void {
  const next = [link, ...getLocalOrderLinks().filter((o) => o.token !== link.token)].slice(0, MAX_ORDERS);
  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Private mode / quota — the WhatsApp confirmation still has the link.
  }
  for (const listener of listeners) listener();
}
