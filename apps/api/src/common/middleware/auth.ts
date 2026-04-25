import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/app-error";
import { requireEnv } from "../security/env";

const ACCESS_SECRET = requireEnv("JWT_ACCESS_SECRET");

export type AuthUser = {
  sub: string;
  roles?: string[];
  permissions?: string[];
};

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthUser;
  }
}

export function authGuard(req: Request, _res: Response, next: NextFunction) {
  const header = req.header("authorization");
  if (!header?.startsWith("Bearer ")) {
    throw new AppError(401, "UNAUTHENTICATED", "Token tidak ditemukan");
  }

  const token = header.replace("Bearer ", "");
  try {
    req.user = jwt.verify(token, ACCESS_SECRET) as AuthUser;
    next();
  } catch {
    throw new AppError(401, "UNAUTHENTICATED", "Token tidak valid");
  }
}

export function requirePermission(permission: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const permissions = req.user?.permissions ?? [];
    if (!permissions.includes(permission)) {
      throw new AppError(403, "FORBIDDEN", "Akses ditolak");
    }
    next();
  };
}
