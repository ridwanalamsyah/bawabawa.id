/**
 * Server-side session helpers built on top of `jose`. Used by Next.js route
 * handlers and server components. `auth-edge.ts` mirrors the verify path
 * for the Edge runtime (Next.js proxy/middleware) where `jose` is also
 * supported but we keep that file dependency-free of Buffer/Node APIs.
 */

import { SignJWT, jwtVerify, type JWTPayload } from "jose";

export type AuthRole = "customer" | "owner" | "operations" | "finance" | "support" | "shopper" | "admin";

export type AuthSession = {
  userId: string;
  role: AuthRole;
  exp: number;
};

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_JWT_SECRET;
  if (!secret || secret.length < 32) {
    // Fail loudly so misconfigured prod deploys surface immediately instead
    // of silently issuing forgeable tokens. The 32-char floor matches the
    // length of the random secret stored in Vercel env vars.
    throw new Error(
      "SESSION_JWT_SECRET is missing or too short. Configure a 32+ character random value in the environment."
    );
  }
  return new TextEncoder().encode(secret);
}

const ISSUER = "bawabawa-site";
const AUDIENCE = "bawabawa-session";

export async function signToken(
  session: Omit<AuthSession, "exp">,
  ttlSeconds = 60 * 60 * 8,
): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  return await new SignJWT({ userId: session.userId, role: session.role })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(exp)
    .setSubject(session.userId)
    .sign(getSecret());
}

export async function verifyToken(
  token: string | null | undefined,
): Promise<AuthSession | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: ISSUER,
      audience: AUDIENCE,
      algorithms: ["HS256"],
    });
    return payloadToSession(payload);
  } catch {
    return null;
  }
}

function payloadToSession(payload: JWTPayload): AuthSession | null {
  const userId = typeof payload.userId === "string" ? payload.userId : payload.sub;
  const role = typeof payload.role === "string" ? (payload.role as AuthRole) : null;
  if (!userId || !role || typeof payload.exp !== "number") return null;
  return { userId, role, exp: payload.exp };
}

export async function bearer(req: Request): Promise<AuthSession | null> {
  const h = req.headers.get("authorization") ?? "";
  if (!h.toLowerCase().startsWith("bearer ")) return null;
  return await verifyToken(h.slice(7).trim());
}

export async function requireRole(req: Request, allowed: AuthRole[]) {
  const session = await bearer(req);
  if (!session) {
    return {
      ok: false as const,
      response: new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      }),
    };
  }
  if (!allowed.includes(session.role)) {
    return {
      ok: false as const,
      response: new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403,
        headers: { "content-type": "application/json" },
      }),
    };
  }
  return { ok: true as const, session };
}

/**
 * HMAC stub for ERP webhooks. Replace with a real timing-safe compare
 * against `crypto.subtle.verify` for production webhooks issued by ERP.
 */
export function verifyWebhookSignature(_body: string, signature: string | null, secret = "whsec_dev_only") {
  if (!signature) return false;
  return signature.startsWith(secret);
}

export const audit = {
  log(actor: string, action: string, target: string, meta: Record<string, unknown> = {}) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[AUDIT] ${new Date().toISOString()} ${actor} ${action} ${target}`, meta);
    }
    // Production: persist to audit_log table (TODO once admin DB schema is
    // wired through the site).
  },
};
