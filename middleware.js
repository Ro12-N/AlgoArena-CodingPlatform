import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isDevelopmentAuthFallbackEnabled } from "@/lib/auth";

const isPublicRoute = createRouteMatcher([
  "/",
  "/about",
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

const hasClerkCredentials = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.CLERK_SECRET_KEY
);

const clerkHandler = clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export default function middleware(req, event) {
  if (hasClerkCredentials) {
    return clerkHandler(req, event);
  }

  if (isDevelopmentAuthFallbackEnabled()) {
    return NextResponse.next();
  }

  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  const signInUrl = new URL("/sign-in", req.url);
  return NextResponse.redirect(signInUrl);
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
