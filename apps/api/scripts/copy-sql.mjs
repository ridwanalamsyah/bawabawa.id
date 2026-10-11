// tsc only emits .js. The migrations runner reads its .sql files from
// `__dirname` at runtime, so copy them next to the compiled runner.
import { cpSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
cpSync(path.join(root, "src/infrastructure/db"), path.join(root, "dist/infrastructure/db"), {
  recursive: true,
  filter: (src) => !src.endsWith(".ts")
});
