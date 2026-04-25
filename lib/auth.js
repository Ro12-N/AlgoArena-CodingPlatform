import { currentUser as clerkCurrentUser } from "@clerk/nextjs/server";

const DEFAULT_DEV_EMAIL = "developer@local.test";
const DEFAULT_DEV_ROLE = "ADMIN";

export function isClerkConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
      process.env.CLERK_SECRET_KEY
  );
}

export function isDevelopmentAuthFallbackEnabled() {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.ALLOW_DEV_AUTH_FALLBACK === "true"
  );
}

export function isAuthEnabled() {
  return isClerkConfigured() || isDevelopmentAuthFallbackEnabled();
}

export function getDevelopmentRole() {
  const role = process.env.DEV_USER_ROLE?.toUpperCase();
  return role === "USER" ? "USER" : DEFAULT_DEV_ROLE;
}

export function getDevelopmentUser() {
  return {
    id: "dev-local-user",
    firstName: "Local",
    lastName: "Developer",
    imageUrl: null,
    emailAddresses: [
      {
        emailAddress: process.env.DEV_USER_EMAIL || DEFAULT_DEV_EMAIL,
      },
    ],
  };
}

export async function currentUser() {
  if (isClerkConfigured()) {
    return clerkCurrentUser();
  }

  if (isDevelopmentAuthFallbackEnabled()) {
    return getDevelopmentUser();
  }

  return null;
}
