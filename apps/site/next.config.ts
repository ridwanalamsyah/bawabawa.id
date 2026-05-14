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

// HTTP security headers. Helmet equivalent applied at the Next.js layer so
// Vercel-hosted edges respond with sane defaults out of the box.
//
// CSP is intentionally restrictive but allows: inline styles (Tailwind
// generates some), framer-motion injected styles, fonts/images from Google
// & Unsplash & R2, and the Plausible analytics endpoint when configured.
//
// Tighten further once we stop using inline `<script>` blocks (theme init in
// layout.tsx).
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bawabawa.id";
const ERP_API_BASE = process.env.ERP_API_BASE_URL ?? "https://bawabawa-id-api.vercel.app";
const PLAUSIBLE_HOST = "https://plausible.io";
// Google Identity Services origins — accounts.google.com serves the GSI
// client script + ID token verifier UI, and the button is rendered inside
// a same-origin iframe pointing to https://accounts.google.com/gsi/button.
const GOOGLE_GSI = "https://accounts.google.com https://www.gstatic.com";

const csp = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline' ${PLAUSIBLE_HOST} ${GOOGLE_GSI}`,
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com`,
  `img-src 'self' data: blob: https://api.dicebear.com https://images.unsplash.com https://*.r2.dev https://*.amazonaws.com https://*.googleusercontent.com`,
  `font-src 'self' https://fonts.gstatic.com data:`,
  `connect-src 'self' ${SITE_URL} ${ERP_API_BASE} ${PLAUSIBLE_HOST} https://accounts.google.com`,
  `frame-src 'self' https://accounts.google.com`,
  `frame-ancestors 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `object-src 'none'`,
  `upgrade-insecure-requests`,
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

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
      // Vercel Blob: replaces base64 photo uploads from /request flow once
      // BLOB_READ_WRITE_TOKEN is configured in env.
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
