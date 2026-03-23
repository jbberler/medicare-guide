import type { NextConfig } from "next";

// Content-Security-Policy notes:
//   - 'unsafe-inline' for scripts is required by Next.js App Router for hydration inline scripts.
//   - A nonce-based strict CSP (removing 'unsafe-inline') is feasible with Next.js middleware
//     and is a recommended future improvement for a public launch.
//   - 'unsafe-eval' is intentionally omitted; Next.js 15 production builds do not require it.
//   - All data stays client-side; no external connect-src origins needed.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: CSP },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
