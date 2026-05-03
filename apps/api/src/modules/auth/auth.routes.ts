import { Router } from "express";
import { z } from "zod";
import { AuthService } from "./auth.service";
import { authGuard } from "../../common/middleware/auth";
import { loadEnv } from "../../config/env";
import { AppError } from "../../common/errors/app-error";

const authRouter = Router();
const service = new AuthService();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(1),
  division: z.string().optional(),
  role: z.string().optional()
});

const googleSchema = z.object({
  idToken: z.string().min(20)
});

/**
 * Public auth config — frontend reads this on boot to know which sign-in
 * methods to render. Never returns secrets; only the (public) Google client
 * ID + a flag indicating whether the demo email/password form should remain
 * visible (development convenience only).
 */
authRouter.get("/config", (_req, res) => {
  const env = loadEnv();
  res.json({
    success: true,
    data: {
      googleClientId: env.GOOGLE_OAUTH_CLIENT_ID ?? null,
      demoMode: env.DEMO_MODE === true,
      allowEmailLogin: env.DEMO_MODE === true && env.NODE_ENV !== "production"
    }
  });
});

/**
 * Production sign-in path. Frontend exchanges a Google Identity Services
 * `credential` (ID token) for our access + refresh JWT pair.
 */
authRouter.post("/google", async (req, res, next) => {
  try {
    const body = googleSchema.parse(req.body);
    const result = await service.loginWithGoogle(body.idToken);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

/**
 * Refuses email/password login outside development+demo. Production
 * deployments rely exclusively on /auth/google.
 */
function emailLoginGuard(): void {
  const env = loadEnv();
  if (env.NODE_ENV === "production" || env.DEMO_MODE !== true) {
    throw new AppError(
      410,
      "EMAIL_LOGIN_DISABLED",
      "Login email/password sudah dinonaktifkan. Silakan gunakan Google sign-in."
    );
  }
}

authRouter.post("/login", async (req, res, next) => {
  try {
    emailLoginGuard();
    const body = loginSchema.parse(req.body);
    const result = await service.login(body.email, body.password);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/register", async (req, res, next) => {
  try {
    emailLoginGuard();
    const body = registerSchema.parse(req.body);
    const result = await service.register(body.email, body.password, body.fullName, body.division || "", body.role || "sales");
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/refresh", async (req, res, next) => {
  try {
    const token = z.string().parse(req.body.refreshToken);
    const result = await service.refresh(token);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/logout", async (req, res, next) => {
  try {
    const token = z.string().parse(req.body.refreshToken);
    const result = await service.logout(token);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/logout-all", authGuard, async (req, res, next) => {
  try {
    const result = await service.logoutAll(String(req.user?.sub ?? ""));
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

authRouter.get("/me", authGuard, async (req, res, next) => {
  try {
    const userId = String(req.user?.sub ?? "");
    const user = await service.getUserById(userId);
    if (!user) {
      res.status(401).json({ success: false, error: { code: "UNAUTHENTICATED", message: "User tidak ditemukan" } });
      return;
    }
    res.json({ success: true, data: { user } });
  } catch (error) {
    next(error);
  }
});

export { authRouter };
