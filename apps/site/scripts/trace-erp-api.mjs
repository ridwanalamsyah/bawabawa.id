// Lists every file the compiled ERP API (apps/api/dist) needs at runtime —
// its own modules, SQL migrations and node_modules dependencies — so
// next.config.ts can ship them with the server functions. Next.js cannot
// trace them itself because the API is loaded with a runtime import (see
// src/lib/erp-internal.ts). Runs after the API build, before `next build`.
import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { nodeFileTrace } = require("next/dist/compiled/@vercel/nft");

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = path.resolve(siteDir, "../..");
const apiDist = path.join(root, "apps/api/dist");

const { fileList } = await nodeFileTrace([path.join(apiDist, "app.js")], { base: root });
const files = [...fileList]
  .map((file) => path.relative(siteDir, path.join(root, file)).split(path.sep).join("/"))
  .sort();

writeFileSync(path.join(siteDir, ".erp-api-trace.json"), `${JSON.stringify(files, null, 1)}\n`);
console.log(`[trace-erp-api] ${files.length} files`);
