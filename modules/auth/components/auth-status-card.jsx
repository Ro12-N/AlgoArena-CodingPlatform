import Link from "next/link";
import { Lock, Settings2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AuthStatusCard = ({
  title,
  description,
  authConfigured,
  ctaLabel = "Sign In",
}) => {
  const Icon = authConfigured ? Lock : Settings2;

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{description}</p>

        {!authConfigured && (
          <div className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
            Add <code>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> and{" "}
            <code>CLERK_SECRET_KEY</code> in your deployment settings.
          </div>
        )}

        <Button asChild>
          <Link href="/sign-in">
            {authConfigured ? ctaLabel : "Open Setup Notice"}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default AuthStatusCard;
