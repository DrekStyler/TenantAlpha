import { clerkMiddleware } from "@clerk/nextjs/server";

// Next.js 16: proxy.ts runs on Node.js runtime (not Edge),
// so all Node.js APIs (crypto, etc.) are available.
// Route protection is handled in (app)/layout.tsx via auth() check.
export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
