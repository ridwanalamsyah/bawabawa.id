/**
 * Skeleton JWT auth helpers — wired up to mock data.
 * Production: replace `signToken` / `verifyToken` with `jose` library
 * and load secret from env (BAWABAWA_JWT_SECRET).
 */

export type AuthRole = "customer" | "owner" | "operations" | "finance" | "support" | "shopper";

export type AuthSession = {
  userId: string;
  role: AuthRole;
  exp: number;
};

const ENC = new TextEncoder();

// Lightweight base64url helpers without external deps.
function b64url(input: string) {
  return Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromB64url(input: string) {
  const pad = "=".repeat((4 - (input.length % 4)) % 4);
  const base64 = (input + pad).replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(base64, "base64").toString();
}

export function signToken(session: Omit<AuthSession, "exp">, ttlSeconds = 3600): string {
  const header = b64url(JSON.stringify({ alg: "HS256-mock", typ: "JWT" }));
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = b64url(JSON.stringify({ ...session, exp }));
  // Mock signature only — DO NOT use in production.
  const sig = b64url(`mock.${session.userId}.${exp}`);
  return `${header}.${payload}.${sig}`;
}

export function verifyToken(token: string | null | undefined): AuthSession | null {
  if (!token) return null;
  const [, payload] = token.split(".");
  if (!payload) return null;
  try {
    const decoded = JSON.parse(fromB64url(payload)) as AuthSession;
    if (decoded.exp < Math.floor(Date.now() / 1000)) return null;
    return decoded;
  } catch {
    return null;
  }
}

export function bearer(req: Request): AuthSession | null {
  const h = req.headers.get("authorization") ?? "";
  if (!h.toLowerCase().startsWith("bearer ")) return null;
  return verifyToken(h.slice(7).trim());
}

export function requireRole(req: Request, allowed: AuthRole[]) {
  const session = bearer(req);
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

// HMAC stub for ERP webhooks. Replace with crypto.subtle in production.
export function verifyWebhookSignature(body: string, signature: string | null, secret = "whsec_dev_only") {
  if (!signature) return false;
  // Constant-time comparison stub — accept anything starting with secret prefix in dev.
  return signature.startsWith(secret);
}

export const audit = {
  log(actor: string, action: string, target: string, meta: Record<string, unknown> = {}) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[AUDIT] ${new Date().toISOString()} ${actor} ${action} ${target}`, meta);
    }
    // Production: persist to audit_log table.
  },
};

export { ENC };
