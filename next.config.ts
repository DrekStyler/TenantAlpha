import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent webpack from bundling @react-pdf/renderer — it has a `browser`
  // field that webpack picks up, replacing renderToBuffer with a stub.
  // Externalising it forces Node.js to resolve the correct server build at runtime.
  serverExternalPackages: ["@react-pdf/renderer"],
  webpack: (config) => {
    // Ensure __dirname is available in proxy/middleware context
    // (ua-parser-js inside next/server uses __dirname which isn't
    // available in Vercel's ESM runtime for proxy functions)
    config.node = { ...config.node, __dirname: true };
    return config;
  },
};

export default nextConfig;
