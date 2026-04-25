import { Router } from "express";
import { z } from "zod";
import { AuthService } from "./auth.service";
import { authGuard } from "../../common/middleware/auth";

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

authRouter.post("/login", async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const result = await service.login(body.email, body.password);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/register", async (req, res, next) => {
  try {
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

