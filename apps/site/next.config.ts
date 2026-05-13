import path from "node:path";
import type { NextConfig } from "next";

// Resolve the monorepo root (apps/site/../..). npm workspaces hoist
// `next` (and friends) to the top-level node_modules, so Turbopack's
// workspace-root inference has to point one level above the app — otherwise
// builds fail with:
//   "We couldn't find the Next.js package (next/package.json) from the
//    project directory: …/apps/site/src/app"
// Known Next.js 16 quirk: https://github.com/vercel/next.js/issues/92540.
const monorepoRoot = path.resolve(process.cwd(), "..", "..");

const nextConfig: NextConfig = {
  turbopack: {
    root: monorepoRoot,
  },
  outputFileTracingRoot: monorepoRoot,
  images: {
    remotePatterns: [
      // Deterministic SVG avatars used in testimonials / shopper / customer
      // mock data. Server-generated, no external upload required.
      { protocol: "https", hostname: "api.dicebear.com" },
      // Unsplash for product photo placeholders (free, CC0-ish license).
      { protocol: "https", hostname: "images.unsplash.com" },
      // Cloudflare R2 / S3-style buckets used by the ERP for real product
      // photos once shoppers upload them.
      { protocol: "https", hostname: "*.r2.dev" },
      { protocol: "https", hostname: "*.amazonaws.com" },
    ],
  },
};

export default nextConfig;
