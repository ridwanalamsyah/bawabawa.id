import { existsSync } from "node:fs";
import http from "node:http";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { pathToFileURL } from "node:url";

// Loaded with a runtime import, not bundled: Turbopack bundles workspace
// packages even when listed in serverExternalPackages, and the bundled copy
// can't find the API's `__dirname`-relative SQL migrations. The API's files
// ship via `outputFileTracingIncludes` in next.config.ts, laid out as in the
// repo: the server runs from apps/site, and on Vercel the files sit under
// the function root ($LAMBDA_TASK_ROOT).
function erpApiEntry(): string {
  const candidates = [
    path.join(process.cwd(), "..", "api", "dist", "app.js"),
    ...(process.env.LAMBDA_TASK_ROOT ? [path.join(process.env.LAMBDA_TASK_ROOT, "apps", "api", "dist", "app.js")] : []),
  ];
  const compiled = candidates.find((file) => existsSync(file));
  return compiled ? pathToFileURL(compiled).href : "@erp/api/dist/app.js";
}

/**
 * The ERP API (apps/api, Express) runs inside this Next.js deployment.
 *
 * On first use, each server instance starts the Express app on a random
 * loopback port; `/api/v1/*` (route handler) and the server-side BFF calls
 * (`erpFetch`, token refresh, uploads) talk to it over 127.0.0.1. One Vercel
 * project serves both the site and the API, with no CORS and no second
 * function invocation per BFF call.
 *
 * Set ERP_API_BASE_URL to call a separately running API instead (e.g. local
 * dev against `npm run dev --workspace @erp/api`).
 */

let localOrigin: Promise<string> | undefined;

function startLocalErp(): Promise<string> {
  localOrigin ??= (async () => {
    const { createApp } = (await import(/* turbopackIgnore: true */ erpApiEntry())) as typeof import("@erp/api/dist/app.js");
    const server = http.createServer(createApp());
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", () => resolve());
    });
    server.unref();
    return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  })().catch((error) => {
    localOrigin = undefined;
    throw error;
  });
  return localOrigin;
}

/** Origin (no `/api/v1`) of the in-process ERP API. */
export function erpLocalOrigin(): Promise<string> {
  return startLocalErp();
}

/**
 * Base URL ending in `/api/v1` for server-side ERP calls. `selfOrigin` (the
 * site's public origin) makes the call go over HTTP to this deployment's own
 * `/api/v1` instead — for `proxy.ts`, whose function doesn't ship the API.
 */
export async function erpApiBase(selfOrigin?: string): Promise<string> {
  const configured = (process.env.ERP_API_BASE_URL ?? "").replace(/\/$/, "");
  const base = configured || selfOrigin || (await erpLocalOrigin());
  return base.endsWith("/api/v1") ? base : `${base}/api/v1`;
}
