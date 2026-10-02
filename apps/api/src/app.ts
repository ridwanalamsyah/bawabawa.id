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
import { webhooksRouter } from "./routes";

function buildAllowedOrigins() {
  const list = process.env.CORS_ALLOWED_ORIGINS ?? "";
  if (!list.trim()) return [];
  return list.split(",").map((item) => item.trim()).filter(Boolean);
}

export function createApp() {
  const app = express();
  const allowedOrigins = buildAllowedOrigins();
  const isProduction = process.env.NODE_ENV === "production";

  // Vercel / Fly put one proxy hop in front of the app. Without this,
  // req.ip is the proxy address, so the rate limiter would lump every
  // visitor into one bucket. Override with TRUST_PROXY_HOPS if the
  // topology differs.
  app.set("trust proxy", Number(process.env.TRUST_PROXY_HOPS ?? 1));

  // Helmet: API serves both `/api/v1/*` JSON endpoints and the legacy
  // single-file SPA at `apps/web/public/index.html`. The inline `<script>`
  // blocks in that HTML require `'unsafe-inline'`, so CSP is loosened here.
  // The new Next.js site (apps/site) sets a stricter CSP via next.config.ts
  // headers().
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          "default-src": ["'self'"],
          "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          "font-src": ["'self'", "https://fonts.gstatic.com", "data:"],
          "img-src": ["'self'", "data:", "blob:", "https:"],
          "connect-src": ["'self'", "https:"],
          "frame-ancestors": ["'none'"],
          "object-src": ["'none'"],
          "upgrade-insecure-requests": [],
        },
      },
      crossOriginEmbedderPolicy: false,
      // CORP/COEP would block the SPA's external CDN images.
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );

  // CORS: allow all origins only outside production when none are
  // configured. Production with an empty allowlist rejects cross-origin
  // browser calls (config/env.ts also refuses to boot in that state).
  app.use(
    cors({
      origin(origin, callback) {
        const allowAll = allowedOrigins.length === 0 && !isProduction;
        if (!origin || allowAll || allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error("Origin not allowed"));
      },
      credentials: true
    })
  );
  app.use(requestIdMiddleware);
  app.use(metricsMiddleware);
  app.use(
    pinoHttp({
      // Never write credentials to logs (bearer tokens, cookies, the
      // site→API proxy secret, webhook tokens in query strings).
      redact: {
        paths: [
          "req.headers.authorization",
          "req.headers.cookie",
          "req.headers[\"x-bawabawa-proxy-secret\"]",
          "req.headers[\"x-api-key\"]",
          "req.query.token",
          "res.headers[\"set-cookie\"]"
        ],
        censor: "[redacted]"
      },
      autoLogging: {
        ignore: (req) => (req as any).url?.startsWith?.("/assets") || (req as any).url?.endsWith?.(".html") || (req as any).url?.endsWith?.(".css") || (req as any).url?.endsWith?.(".js")
      }
    })
  );
  app.use(rateLimitMiddleware);

  // Webhook receivers verify signatures over the exact raw bytes, so they
  // must see the request before the global JSON parser consumes the body.
  app.use("/api/v1/webhooks", webhooksRouter);
  app.use(express.json({ limit: "2mb" }));

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
