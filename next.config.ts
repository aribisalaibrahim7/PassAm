import type { NextConfig } from "next";
// @ts-expect-error - next-pwa has missing types for some versions
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

const nextConfig: NextConfig = {
  turbopack: {},

  // Add security and header-budget response headers to every route
  async headers() {
    return [
      {
        // Apply to all routes
        source: "/(.*)",
        headers: [
          // Restrict cookie access from JavaScript where not needed
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // Prevents the browser from caching sensitive pages
          {
            key: "Cache-Control",
            value: "no-store, max-age=0",
          },
          // Documents our cookie budget policy for monitoring tools
          {
            key: "X-PassAm-Cookie-Policy",
            value: "max-single=3800B; max-total=14000B; limit=Vercel-16KB",
          },
        ],
      },
      {
        // session-reset must never be cached — always serve fresh
        source: "/session-reset",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default withPWA(nextConfig);
