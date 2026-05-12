import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
