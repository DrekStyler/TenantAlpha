import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    // Ensure __dirname is available in proxy/middleware context
    // (ua-parser-js inside next/server uses __dirname which isn't
    // available in Vercel's ESM runtime for proxy functions)
    config.node = { ...config.node, __dirname: true };
    return config;
  },
};

export default nextConfig;
