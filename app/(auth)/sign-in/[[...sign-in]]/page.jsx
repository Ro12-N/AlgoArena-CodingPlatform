import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  isClerkConfigured,
  isDevelopmentAuthFallbackEnabled,
} from "@/lib/auth";
import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

export default function Page() {
  if (!isClerkConfigured() && isDevelopmentAuthFallbackEnabled()) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Local development mode</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Clerk is optional here. The app is using the built-in local
            development user because Clerk keys are not configured.
          </p>
          <Button asChild className="w-full">
            <Link href="/">Open the app</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!isClerkConfigured()) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Clerk Configuration Required</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This deployment needs Clerk environment variables before sign-in can
            work.
          </p>
          <div className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
            Add <code>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> and{" "}
            <code>CLERK_SECRET_KEY</code> in Vercel project settings.
          </div>
          <Button asChild className="w-full">
            <Link href="/">Go Home</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <SignIn />;
}
