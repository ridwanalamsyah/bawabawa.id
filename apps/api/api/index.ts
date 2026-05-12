/**
 * Vercel serverless entrypoint for the Bawabawa ERP Express API.
 *
 * Vercel's runtime invokes the default export as a `(req, res)` handler.
 * Express apps are themselves Node `http.RequestListener` functions, so
 * exporting `createApp()` directly is enough — no `express-serverless-http`
 * wrapper needed.
 *
 * The vercel.json rewrites every incoming path to `/api`, so this single
 * function fields the entire surface (`/api/v1/*`, the SPA shell at `/`,
 * `/robots.txt`, etc.). Express's own routing then dispatches to the right
 * handler.
 *
 * Cold-start cost: `pg.Pool` is instantiated lazily on the first DB query
 * via `getPool()` and cached at the module level, so subsequent invocations
 * within the same container reuse the connection pool. Neon's serverless
 * pooler endpoint (`-pooler.…neon.tech`) keeps the upstream connection count
 * bounded across concurrent lambda containers.
 */

import "dotenv/config";
import type { IncomingMessage, ServerResponse } from "node:http";
import { createApp } from "../src/app";

const app = createApp();

export default function handler(req: IncomingMessage, res: ServerResponse) {
  return (app as unknown as (
    req: IncomingMessage,
    res: ServerResponse
  ) => void)(req, res);
}
