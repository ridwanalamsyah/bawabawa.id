/**
 * Edge-runtime session verifier. Next.js proxy/middleware runs on the
 * Edge runtime where `jose` is supported but Node APIs (Buffer, fs) are
 * not. This module signs nothing — it only verifies tokens issued by
 * `lib/auth.ts` so it can authorize incoming requests in `proxy.ts`.
 */

import { jwtVerify } from "jose";

export type AuthRoleEdge =
  | "customer"
  | "owner"
  | "operations"
  | "finance"
  | "support"
  | "shopper"
  | "admin";

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

const ISSUER = "bawabawa-site";
const AUDIENCE = "bawabawa-session";

function getSecret(): Uint8Array | null {
  const secret = process.env.SESSION_JWT_SECRET;
  if (!secret || secret.length < 32) return null;
  return new TextEncoder().encode(secret);
}

export async function verifyTokenEdge(
  token: string | null | undefined,
): Promise<AuthSessionEdge | null> {
  if (!token) return null;
  const secret = getSecret();
  if (!secret) return null;
  try {
    const { payload } = await jwtVerify(token, secret, {
      issuer: ISSUER,
      audience: AUDIENCE,
      algorithms: ["HS256"],
    });
    const userId = typeof payload.userId === "string" ? payload.userId : payload.sub;
    const role = typeof payload.role === "string" ? (payload.role as AuthRoleEdge) : null;
    if (!userId || !role || typeof payload.exp !== "number") return null;
    return { userId, role, exp: payload.exp };
  } catch {
    return null;
  }
}

export function isAdminRole(role: string | null | undefined): boolean {
  return !!role && ADMIN_ROLES.includes(role as AuthRoleEdge);
}

export const SESSION_COOKIE = "bb_session";
