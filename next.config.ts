import type { NextConfig } from "next";

const securityHeaders = [
  // Prevent MIME sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Prevent clickjacking
  { key: "X-Frame-Options", value: "DENY" },
  // XSS filter (legacy browsers)
  { key: "X-XSS-Protection", value: "1; mode=block" },
  // Control referrer information
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Enforce HTTPS
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Restrict browser features
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

const nextConfig: NextConfig = {
  // Prevent webpack from bundling @react-pdf/renderer — it has a `browser`
  // field that webpack picks up, replacing renderToBuffer with a stub.
  // Externalising it forces Node.js to resolve the correct server build at runtime.
  serverExternalPackages: ["@react-pdf/renderer"],
  turbopack: {},
  webpack: (config) => {
    // Ensure __dirname is available in proxy/middleware context
    // (ua-parser-js inside next/server uses __dirname which isn't
    // available in Vercel's ESM runtime for proxy functions)
    config.node = { ...config.node, __dirname: true };
    return config;
  },
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
