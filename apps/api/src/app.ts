import cors from "cors";
import express from "express";
import helmet from "helmet";
import path from "node:path";
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

  // Helmet: allow inline scripts/styles for the single-file frontend
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
  app.use(
    pinoHttp({
      autoLogging: {
        ignore: (req) => (req as any).url?.startsWith?.("/assets") || (req as any).url?.endsWith?.(".html") || (req as any).url?.endsWith?.(".css") || (req as any).url?.endsWith?.(".js")
      }
    })
  );
  app.use(rateLimitMiddleware);

  // ── API routes ──
  app.use("/api/v1", apiRouter);

  // ── SEO well-known files (sitemap.xml, robots.txt) ──
  app.use("/", cmsPublicRouter);

  // ── Serve frontend static files ──
  const webPublicDir = path.resolve(__dirname, "../../web/public");
  app.use(express.static(webPublicDir));

  // SPA fallback: serve index.html for any non-API route so deep links work.
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    res.sendFile(path.join(webPublicDir, "index.html"));
  });

  app.use(errorHandler);

  return app;
}
