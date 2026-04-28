import cors from "cors";
import express from "express";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { requestIdMiddleware } from "./common/middleware/request-id";
import { rateLimitMiddleware } from "./common/security/rate-limit";
import { errorHandler } from "./common/errors/error-handler";
import { apiRouter } from "./routes";
import { metricsMiddleware } from "./common/observability/metrics";
import { cmsPublicRouter } from "./modules/cms/cms.public.routes";

function buildAllowedOrigins() {
  const list = process.env.CORS_ALLOWED_ORIGINS ?? "";
  if (!list.trim()) return [];
  return list.split(",").map((item) => item.trim()).filter(Boolean);
}

export function createApp() {
  const app = express();
  const allowedOrigins = buildAllowedOrigins();

  // API-only surface. The React web app (apps/web) is served by Vite in dev
  // and by `vite preview` / a static host in production — Express no longer
  // serves frontend HTML.
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false
    })
  );

  // CORS: allow all origins when none are configured (dev mode)
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error("Origin not allowed"));
      },
      credentials: true
    })
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(requestIdMiddleware);
  app.use(metricsMiddleware);
  app.use(pinoHttp());
  app.use(rateLimitMiddleware);

  // ── API routes ──
  app.use("/api/v1", apiRouter);

  // ── SEO well-known files (sitemap.xml, robots.txt) ──
  app.use("/", cmsPublicRouter);

  app.use(errorHandler);

  return app;
}
