import {
  currentUser,
  isClerkConfigured,
  isDevelopmentAuthFallbackEnabled,
} from "@/lib/auth";
import { onBoardUser } from "@/modules/auth/actions";
import Navbar from "@/modules/home/components/navbar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AppChrome({ children }) {
  const authUser = await currentUser();
  const onboardingResult = authUser ? await onBoardUser() : null;
  const userRole = onboardingResult?.success
    ? String(onboardingResult.user.role)
    : null;

  return (
    <main className="flex min-h-screen flex-col">
      <Navbar
        userRole={userRole}
        isSignedIn={Boolean(authUser)}
        authConfigured={isClerkConfigured()}
        devAuthEnabled={isDevelopmentAuthFallbackEnabled()}
      />
      {authUser && onboardingResult && !onboardingResult.success && (
        <div className="container mx-auto px-4 pt-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Account not synced with database</AlertTitle>
            <AlertDescription>{onboardingResult.error}</AlertDescription>
          </Alert>
        </div>
      )}
      <div className="relative flex flex-1 flex-col px-4 pb-4">
        <div className="absolute inset-0 -z-10 h-full w-full bg-background dark:bg-[radial-gradient(#393e4a_1px,transparent_1px)] dark:bg-[size:16px_16px] bg-[radial-gradient(#dadde2_1px,transparent_1px)] bg-[size:16px_16px]" />
        {children}
      </div>
    </main>
  );
}
