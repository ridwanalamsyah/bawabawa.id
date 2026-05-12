/**
 * Edge-runtime compatible token verifier. Mirrors `verifyToken` in
 * `./auth.ts` but avoids `Buffer`, so it can run inside Next.js
 * middleware (which uses the Edge runtime).
 *
 * Token shape: `<header>.<payload>.<signature>`, base64url encoded JSON.
 * Production: replace with `jose` and a real HMAC verify against a
 * shared secret.
 */

export type AuthRoleEdge =
  | "customer"
  | "owner"
  | "operations"
  | "finance"
  | "support"
  | "shopper"
  | "admin"; // ERP API may emit `admin` directly

export type AuthSessionEdge = {
  userId: string;
  role: AuthRoleEdge;
  exp: number;
};

const ADMIN_ROLES: AuthRoleEdge[] = [
  "owner",
  "operations",
  "finance",
  "support",
  "admin",
];

function fromB64url(input: string): string {
  const pad = "=".repeat((4 - (input.length % 4)) % 4);
  const base64 = (input + pad).replace(/-/g, "+").replace(/_/g, "/");
  // atob exists in Edge runtime; decode UTF-8 manually.
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export function verifyTokenEdge(
  token: string | null | undefined,
): AuthSessionEdge | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(fromB64url(parts[1])) as AuthSessionEdge;
    if (!payload.userId || !payload.role) return null;
    if (typeof payload.exp === "number" && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function isAdminRole(role: string | null | undefined): boolean {
  return !!role && ADMIN_ROLES.includes(role as AuthRoleEdge);
}

export const SESSION_COOKIE = "bb_session";
