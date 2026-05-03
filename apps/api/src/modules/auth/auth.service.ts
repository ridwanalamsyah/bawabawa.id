import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { OAuth2Client, type TokenPayload } from "google-auth-library";
import { getPool } from "../../infrastructure/db/pool";
import { AppError } from "../../common/errors/app-error";
import { requireEnv } from "../../common/security/env";
import { loadEnv } from "../../config/env";

const ACCESS_SECRET = requireEnv("JWT_ACCESS_SECRET");
const REFRESH_SECRET = requireEnv("JWT_REFRESH_SECRET");
const BOOTSTRAP_ADMIN_EMAIL = process.env.BOOTSTRAP_ADMIN_EMAIL ?? "admin@erp.local";
const BOOTSTRAP_ADMIN_PASSWORD = process.env.BOOTSTRAP_ADMIN_PASSWORD ?? "Admin#1234";
const BOOTSTRAP_ADMIN_NAME = process.env.BOOTSTRAP_ADMIN_NAME ?? "ERP Administrator";
const BOOTSTRAP_ADMIN_DIVISION = process.env.BOOTSTRAP_ADMIN_DIVISION ?? "admin";
const BOOTSTRAP_ADMIN_ID = "00000000-0000-0000-0000-000000000001";

/**
 * Resolves runtime auth flags from validated env each time they're read so
 * tests that swap process.env between cases see fresh values, while a normal
 * server still pays the loadEnv() cache cost only once.
 */
function authFlags(): {
  demoMode: boolean;
  googleClientId: string | null;
  oauthAllowedDomains: ReadonlySet<string>;
  oauthRequireApproval: boolean;
} {
  const env = loadEnv();
  return {
    demoMode: env.DEMO_MODE === true,
    googleClientId: env.GOOGLE_OAUTH_CLIENT_ID ?? null,
    oauthAllowedDomains: new Set((env.OAUTH_ALLOWED_DOMAINS ?? []).map((d) => d.toLowerCase())),
    oauthRequireApproval: env.OAUTH_REQUIRE_APPROVAL !== false
  };
}

let googleClient: OAuth2Client | null = null;
function getGoogleClient(clientId: string): OAuth2Client {
  if (!googleClient) googleClient = new OAuth2Client(clientId);
  return googleClient;
}

type DemoUser = {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  division: string;
  roles: string[];
  permissions: string[];
};

// Demo mode is now driven by env (DEMO_MODE=true). When DEMO_MODE=false the
// in-memory store stays defined but is never read — Google OAuth is the only
// supported path.
const demoUsers: Map<string, DemoUser> = new Map();

// Initialize default admin
demoUsers.set("admin@erp.com", {
  id: BOOTSTRAP_ADMIN_ID,
  email: "admin@erp.com",
  passwordHash: "", // Will be set dynamically
  fullName: "Admin User",
  division: "IT",
  roles: ["admin"],
  permissions: [
    "orders:create",
    "orders:read",
    "orders:update",
    "orders:approve",
    "finance:manage_finance",
    "users:manage_users",
    "reports:export",
    "cms:manage"
  ]
});

export class AuthService {
  async getUserById(userId: string) {
    if (authFlags().demoMode) {
      for (const u of demoUsers.values()) {
        if (u.id === userId) {
          const { passwordHash: _pw, ...safe } = u;
          return safe;
        }
      }
      return null;
    }

    try {
      const pool = await getPool();
      const result = await pool.query<{
        id: string;
        email: string;
        full_name: string;
        division: string;
      }>(
        `SELECT id, email, full_name, division
         FROM users
         WHERE id = $1 AND deleted_at IS NULL AND is_active = TRUE
         LIMIT 1`,
        [userId]
      );

      if (!result.rowCount) return null;
      return {
        id: result.rows[0].id,
        email: result.rows[0].email,
        fullName: result.rows[0].full_name,
        division: result.rows[0].division,
        roles: ["admin"],
        permissions: [
          "orders:create",
          "orders:read",
          "orders:update",
          "orders:approve",
          "finance:manage_finance",
          "users:manage_users",
          "reports:export",
    "cms:manage"
        ]
      };
    } catch (error) {
      console.error("Get user by id failed:", error);
      return null;
    }
  }

  private async findSessionByRefreshToken(userId: string, refreshToken: string) {
    if (authFlags().demoMode) {
      // Demo mode - skip session checking
      return { id: randomUUID(), refresh_token_hash: await argon2.hash(refreshToken) };
    }

    try {
      const pool = await getPool();

      const sessions = await pool.query<{
        id: string;
        refresh_token_hash: string;
      }>(
        `SELECT id, refresh_token_hash
         FROM user_sessions
         WHERE user_id = $1
           AND revoked_at IS NULL
         ORDER BY created_at DESC`,
        [userId]
      );

      for (const session of sessions.rows) {
        const isMatch = await argon2.verify(session.refresh_token_hash, refreshToken);
        if (isMatch) return session as any;
      }

      return null;
    } catch (error) {
      console.error("Session lookup failed:", error);
      return null;
    }
  }

  private async bootstrapAdminIfMissing() {
    if (authFlags().demoMode) return;
    
    try {
      const pool = await getPool();
      const existing = await pool.query<{ id: string }>(
        "SELECT id FROM users WHERE email = $1 LIMIT 1",
        [BOOTSTRAP_ADMIN_EMAIL]
      );
      if (existing.rowCount) return;

      const passwordHash = await argon2.hash(BOOTSTRAP_ADMIN_PASSWORD);
      await pool.query(
        `INSERT INTO users (id, full_name, email, password_hash, division)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (email) DO NOTHING`,
        [
          BOOTSTRAP_ADMIN_ID,
          BOOTSTRAP_ADMIN_NAME,
          BOOTSTRAP_ADMIN_EMAIL,
          passwordHash,
          BOOTSTRAP_ADMIN_DIVISION
        ]
      );
    } catch (error) {
      console.error("Bootstrap admin failed:", error);
    }
  }

  private async getUserByEmail(email: string): Promise<DemoUser | null> {
    if (authFlags().demoMode) {
      // Demo mode - return demo user from the map
      const user = demoUsers.get(email.toLowerCase());
      if (user) {
        // Hash the default admin password on first access
        if (!user.passwordHash && email === "admin@erp.com") {
          user.passwordHash = await argon2.hash("admin123");
        }
        return user;
      }
      return null;
    }

    await this.bootstrapAdminIfMissing();
    try {
      const pool = await getPool();
      const result = await pool.query<{
        id: string;
        email: string;
        password_hash: string;
        full_name: string;
        division: string;
      }>(
        `SELECT id, email, password_hash, full_name, division
         FROM users
         WHERE email = $1 AND deleted_at IS NULL AND is_active = TRUE
         LIMIT 1`,
        [email]
      );

      if (!result.rowCount) return null;
      return {
        id: result.rows[0].id,
        email: result.rows[0].email,
        passwordHash: result.rows[0].password_hash,
        fullName: result.rows[0].full_name,
        division: result.rows[0].division,
        roles: ["admin"],
        permissions: [
          "orders:create",
          "orders:read",
          "orders:update",
          "orders:approve",
          "finance:manage_finance",
          "users:manage_users",
          "reports:export",
    "cms:manage"
        ]
      };
    } catch (error) {
      console.error("Get user by email failed:", error);
      return null;
    }
  }

  async login(email: string, password: string) {
    const user = await this.getUserByEmail(email);
    if (!user) {
      throw new AppError(401, "INVALID_CREDENTIALS", "Email atau password salah");
    }

    const valid = await argon2.verify(user.passwordHash, password);
    if (!valid) {
      throw new AppError(401, "INVALID_CREDENTIALS", "Email atau password salah");
    }

    const accessToken = jwt.sign(
      { sub: user.id, roles: user.roles, permissions: user.permissions },
      ACCESS_SECRET,
      { expiresIn: "15m" }
    );
    const refreshToken = jwt.sign({ sub: user.id }, REFRESH_SECRET, {
      expiresIn: "7d"
    });

    if (!authFlags().demoMode) {
      try {
        const refreshHash = await argon2.hash(refreshToken);
        const pool = await getPool();
        await (pool as any).query(
          `INSERT INTO user_sessions (id, user_id, refresh_token_hash, expires_at)
           VALUES ($1, $2, $3, NOW() + INTERVAL '7 days')`,
          [randomUUID(), user.id, refreshHash]
        );
      } catch (error) {
        console.error("Session creation failed:", error);
      }
    }

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        division: user.division,
        roles: user.roles,
        permissions: user.permissions
      }
    };
  }

  async register(email: string, password: string, fullName: string, division: string, role: string) {
    if (authFlags().demoMode) {
      // Check if user already exists
      if (demoUsers.has(email.toLowerCase())) {
        throw new AppError(409, "EMAIL_EXISTS", "Email sudah terdaftar");
      }

      const passwordHash = await argon2.hash(password);
      const userId = randomUUID();
      const isFirstUser = demoUsers.size === 1; // only admin exists
      const userRole = isFirstUser ? role : (role || "sales");
      const status = "active";

      const newUser: DemoUser = {
        id: userId,
        email: email.toLowerCase(),
        passwordHash,
        fullName,
        division: division || userRole,
        roles: [userRole],
        permissions: userRole === "admin" ? [
          "orders:create", "orders:read", "orders:update", "orders:approve",
          "finance:manage_finance", "users:manage_users", "reports:export",
    "cms:manage"
        ] : [
          "orders:create", "orders:read"
        ]
      };

      demoUsers.set(email.toLowerCase(), newUser);

      return {
        user: {
          id: userId,
          email: newUser.email,
          fullName: newUser.fullName,
          division: newUser.division,
          roles: newUser.roles,
          status
        },
        message: "Akun berhasil dibuat!"
      };
    }

    // Non-demo: database registration
    throw new AppError(501, "NOT_IMPLEMENTED", "Registration requires database setup");
  }

  async refresh(refreshToken: string) {
    if (authFlags().demoMode) {
      try {
        const payload = jwt.verify(refreshToken, REFRESH_SECRET) as { sub: string };
        const accessToken = jwt.sign({ sub: payload.sub }, ACCESS_SECRET, { expiresIn: "15m" });
        const newRefreshToken = jwt.sign({ sub: payload.sub }, REFRESH_SECRET, { expiresIn: "7d" });
        return { accessToken, refreshToken: newRefreshToken };
      } catch {
        throw new AppError(401, "INVALID_REFRESH_TOKEN", "Refresh token tidak valid");
      }
    }

    try {
      const payload = jwt.verify(refreshToken, REFRESH_SECRET) as { sub: string };
      const matchedSession = await this.findSessionByRefreshToken(payload.sub, refreshToken);

      if (!matchedSession) {
        throw new AppError(401, "INVALID_REFRESH_TOKEN", "Refresh token tidak valid");
      }

      // Re-check the user is still allowed to hold tokens. Without this, an
      // admin suspending an account has no effect until the current refresh
      // token naturally expires (up to 7 days), because /auth/refresh would
      // happily mint new access+refresh pairs forever.
      const pool = await getPool();
      const userRow = await pool.query<{ status: string | null; is_active: boolean | number | null }>(
        `SELECT status, is_active
           FROM users
          WHERE id = $1 AND deleted_at IS NULL
          LIMIT 1`,
        [payload.sub]
      );
      const user = userRow.rows[0];
      // Postgres returns boolean for is_active; SQLite returns 0/1 INTEGER.
      // Coerce via truthiness so both drivers reject deactivated rows.
      const isUsable =
        !!user &&
        Boolean(user.is_active) &&
        (user.status == null || user.status === "active");
      if (!isUsable) {
        // Revoke the session that just authenticated so a stolen refresh
        // token can't be replayed after the user is reactivated.
        try {
          await pool.query("UPDATE user_sessions SET revoked_at = NOW() WHERE id = $1", [
            matchedSession.id
          ]);
        } catch (revokeErr) {
          console.error("Session revoke failed during suspended-user refresh:", revokeErr);
        }
        throw new AppError(
          403,
          "ACCOUNT_NOT_ACTIVE",
          "Akun tidak aktif. Silakan hubungi admin."
        );
      }

      await pool.query("UPDATE user_sessions SET revoked_at = NOW() WHERE id = $1", [
        matchedSession.id
      ]);

      const accessToken = jwt.sign({ sub: payload.sub }, ACCESS_SECRET, {
        expiresIn: "15m"
      });
      const newRefreshToken = jwt.sign({ sub: payload.sub }, REFRESH_SECRET, {
        expiresIn: "7d"
      });
      const refreshHash = await argon2.hash(newRefreshToken);
      await pool.query(
        `INSERT INTO user_sessions (id, user_id, refresh_token_hash, expires_at)
         VALUES ($1, $2, $3, NOW() + INTERVAL '7 days')`,
        [randomUUID(), payload.sub, refreshHash]
      );
      return { accessToken, refreshToken: newRefreshToken };
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError(401, "INVALID_REFRESH_TOKEN", "Refresh token tidak valid");
    }
  }

  async logout(refreshToken: string) {
    if (authFlags().demoMode) {
      // Demo mode: no server-side session persistence
      try {
        jwt.verify(refreshToken, REFRESH_SECRET);
      } catch {
        // ignore
      }
      return { loggedOut: true };
    }

    try {
      const payload = jwt.verify(refreshToken, REFRESH_SECRET) as { sub: string };
      const matchedSession = await this.findSessionByRefreshToken(payload.sub, refreshToken);
      if (!matchedSession) {
        throw new AppError(401, "INVALID_REFRESH_TOKEN", "Refresh token tidak valid");
      }
      await (await getPool()).query("UPDATE user_sessions SET revoked_at = NOW() WHERE id = $1", [
        matchedSession.id
      ]);
      return { loggedOut: true };
    } catch {
      throw new AppError(401, "INVALID_REFRESH_TOKEN", "Refresh token tidak valid");
    }
  }

  async loginWithGoogle(idToken: string) {
    const { googleClientId, oauthAllowedDomains, oauthRequireApproval } = authFlags();
    if (!googleClientId) {
      throw new AppError(503, "OAUTH_NOT_CONFIGURED", "Google sign-in tidak dikonfigurasi");
    }
    if (typeof idToken !== "string" || idToken.length < 20) {
      throw new AppError(400, "INVALID_ID_TOKEN", "Token Google tidak valid");
    }

    let payload: TokenPayload | undefined;
    try {
      const ticket = await getGoogleClient(googleClientId).verifyIdToken({
        idToken,
        audience: googleClientId
      });
      payload = ticket.getPayload();
    } catch (error) {
      throw new AppError(401, "INVALID_ID_TOKEN", "Token Google ditolak", { cause: error });
    }

    if (!payload || !payload.sub || !payload.email) {
      throw new AppError(401, "INVALID_ID_TOKEN", "Token Google tidak lengkap");
    }
    if (payload.email_verified === false) {
      throw new AppError(401, "EMAIL_NOT_VERIFIED", "Email Google belum terverifikasi");
    }

    const email = String(payload.email).toLowerCase();
    const sub = String(payload.sub);
    const name = String(payload.name || payload.email);
    const picture = typeof payload.picture === "string" ? payload.picture : null;
    const domain = email.split("@")[1] || "";
    const isAllowedDomain = oauthAllowedDomains.size === 0 || oauthAllowedDomains.has(domain);
    const initialStatus =
      !oauthRequireApproval || (isAllowedDomain && oauthAllowedDomains.size > 0) ? "active" : "pending";

    const user = await this.upsertGoogleUser({
      sub,
      email,
      fullName: name,
      pictureUrl: picture,
      initialStatus
    });

    if (user.status !== "active") {
      throw new AppError(
        403,
        "PENDING_APPROVAL",
        "Akun belum disetujui admin. Silakan tunggu verifikasi."
      );
    }

    const accessToken = jwt.sign(
      { sub: user.id, roles: user.roles, permissions: user.permissions },
      ACCESS_SECRET,
      { expiresIn: "15m" }
    );
    const refreshToken = jwt.sign({ sub: user.id }, REFRESH_SECRET, { expiresIn: "7d" });

    if (!authFlags().demoMode) {
      try {
        const refreshHash = await argon2.hash(refreshToken);
        const pool = await getPool();
        await (pool as any).query(
          `INSERT INTO user_sessions (id, user_id, refresh_token_hash, expires_at)
           VALUES ($1, $2, $3, NOW() + INTERVAL '7 days')`,
          [randomUUID(), user.id, refreshHash]
        );
      } catch (error) {
        console.error("Session creation failed:", error);
      }
    }

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        division: user.division,
        roles: user.roles,
        permissions: user.permissions,
        pictureUrl: user.pictureUrl
      }
    };
  }

  private async upsertGoogleUser(args: {
    sub: string;
    email: string;
    fullName: string;
    pictureUrl: string | null;
    initialStatus: "pending" | "active";
  }): Promise<{
    id: string;
    email: string;
    fullName: string;
    division: string;
    roles: string[];
    permissions: string[];
    status: string;
    pictureUrl: string | null;
  }> {
    const flags = authFlags();
    const baseRoles = ["admin"];
    const basePermissions = [
      "orders:create",
      "orders:read",
      "orders:update",
      "orders:approve",
      "finance:manage_finance",
      "users:manage_users",
      "reports:export",
      "cms:manage"
    ];

    if (flags.demoMode) {
      const existing = demoUsers.get(args.email);
      if (existing) {
        return {
          id: existing.id,
          email: existing.email,
          fullName: existing.fullName,
          division: existing.division,
          roles: existing.roles,
          permissions: existing.permissions,
          status: "active",
          pictureUrl: args.pictureUrl
        };
      }
      const created: DemoUser = {
        id: randomUUID(),
        email: args.email,
        passwordHash: "",
        fullName: args.fullName,
        division: "general",
        roles: baseRoles,
        permissions: basePermissions
      };
      demoUsers.set(args.email, created);
      return { ...created, status: "active", pictureUrl: args.pictureUrl };
    }

    const pool = await getPool();
    // Prefer the (oauth_provider, oauth_subject) match — that's the
    // authoritative identity link Google issues. Falling back to email lets
    // a previously-seeded admin row get linked to its Google identity on
    // first sign-in. COALESCE-to-FALSE is required because Postgres orders
    // NULLs FIRST on DESC by default — without it, a row with
    // oauth_provider IS NULL would compute sub_match=NULL and sort ahead of
    // the genuine TRUE match, causing the next UPDATE to violate
    // users_oauth_provider_subject_uq.
    const existing = await (pool as any).query(
      `SELECT id, email, full_name, division, status,
              COALESCE(oauth_provider = 'google' AND oauth_subject = $1, FALSE) AS sub_match
       FROM users
       WHERE (oauth_provider = 'google' AND oauth_subject = $1)
          OR LOWER(email) = LOWER($2)
       ORDER BY sub_match DESC, created_at ASC
       LIMIT 1`,
      [args.sub, args.email]
    );

    if (existing.rowCount) {
      const row = existing.rows[0];
      await (pool as any).query(
        `UPDATE users
            SET oauth_provider = 'google',
                oauth_subject = $1,
                picture_url = COALESCE($2, picture_url)
          WHERE id = $3`,
        [args.sub, args.pictureUrl, row.id]
      );
      return {
        id: row.id,
        email: row.email,
        fullName: row.full_name,
        division: row.division,
        roles: baseRoles,
        permissions: basePermissions,
        status: row.status ?? "active",
        pictureUrl: args.pictureUrl
      };
    }

    const id = randomUUID();
    await (pool as any).query(
      `INSERT INTO users (id, full_name, email, password_hash, division, oauth_provider, oauth_subject, picture_url, status, is_active)
       VALUES ($1, $2, $3, NULL, $4, 'google', $5, $6, $7, TRUE)`,
      [id, args.fullName, args.email, "general", args.sub, args.pictureUrl, args.initialStatus]
    );
    return {
      id,
      email: args.email,
      fullName: args.fullName,
      division: "general",
      roles: baseRoles,
      permissions: basePermissions,
      status: args.initialStatus,
      pictureUrl: args.pictureUrl
    };
  }

  async logoutAll(userId: string) {
    if (authFlags().demoMode) return { loggedOutAll: true };

    await (await getPool()).query(
      "UPDATE user_sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL",
      [userId]
    );
    return { loggedOutAll: true };
  }
}
