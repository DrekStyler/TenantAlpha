// Minimal middleware — no Clerk imports.
// @clerk/nextjs v6 uses Node-only APIs (#crypto, #safe-node-apis) that
// are incompatible with Vercel's Edge runtime where middleware runs.
// Auth protection is handled server-side in src/app/(app)/layout.tsx
// using Clerk's auth() helper, which runs in the Node.js server runtime.
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};
