import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Clerk v6 requires Node.js runtime for middleware (#crypto, #safe-node-apis).
    // This flag tells Vercel's Next.js adapter to package the middleware as a
    // Node.js function instead of an Edge Function. The flag was added in
    // Next.js 15.3 and is still read by the Vercel adapter in Next.js 16 even
    // though the TypeScript types no longer include it.
    // @ts-ignore — valid Vercel/Next.js adapter flag, types lag behind
    nodeMiddleware: true,
  },
};

export default nextConfig;
