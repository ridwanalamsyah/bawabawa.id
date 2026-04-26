import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { getPool } from "../../infrastructure/db/pool";
import { AppError } from "../../common/errors/app-error";
import { requireEnv } from "../../common/security/env";

const ACCESS_SECRET = requireEnv("JWT_ACCESS_SECRET");
const REFRESH_SECRET = requireEnv("JWT_REFRESH_SECRET");
const BOOTSTRAP_ADMIN_EMAIL = process.env.BOOTSTRAP_ADMIN_EMAIL ?? "admin@erp.local";
const BOOTSTRAP_ADMIN_PASSWORD = process.env.BOOTSTRAP_ADMIN_PASSWORD ?? "Admin#1234";
const BOOTSTRAP_ADMIN_NAME = process.env.BOOTSTRAP_ADMIN_NAME ?? "ERP Administrator";
const BOOTSTRAP_ADMIN_DIVISION = process.env.BOOTSTRAP_ADMIN_DIVISION ?? "admin";
const BOOTSTRAP_ADMIN_ID = "00000000-0000-0000-0000-000000000001";

type DemoUser = {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  division: string;
  roles: string[];
  permissions: string[];
};

// Demo mode for testing without database
const DEMO_MODE = true;
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
    if (DEMO_MODE) {
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
    if (DEMO_MODE) {
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
    if (DEMO_MODE) return;
    
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
    if (DEMO_MODE) {
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

    if (!DEMO_MODE) {
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
    if (DEMO_MODE) {
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
    if (DEMO_MODE) {
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

      await (await getPool()).query(
        "UPDATE user_sessions SET revoked_at = NOW() WHERE id = $1",
        [matchedSession.id]
      );

      const accessToken = jwt.sign({ sub: payload.sub }, ACCESS_SECRET, {
        expiresIn: "15m"
      });
      const newRefreshToken = jwt.sign({ sub: payload.sub }, REFRESH_SECRET, {
        expiresIn: "7d"
      });
      const refreshHash = await argon2.hash(newRefreshToken);
      await (await getPool()).query(
        `INSERT INTO user_sessions (id, user_id, refresh_token_hash, expires_at)
         VALUES ($1, $2, $3, NOW() + INTERVAL '7 days')`,
        [randomUUID(), payload.sub, refreshHash]
      );
      return { accessToken, refreshToken: newRefreshToken };
    } catch {
      throw new AppError(401, "INVALID_REFRESH_TOKEN", "Refresh token tidak valid");
    }
  }

  async logout(refreshToken: string) {
    if (DEMO_MODE) {
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

  async logoutAll(userId: string) {
    if (DEMO_MODE) return { loggedOutAll: true };

    await (await getPool()).query(
      "UPDATE user_sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL",
      [userId]
    );
    return { loggedOutAll: true };
  }
}
