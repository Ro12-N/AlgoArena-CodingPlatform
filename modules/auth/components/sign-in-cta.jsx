"use client";

import Link from "next/link";
import { SignInButton } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";

const SignInCta = ({
  authConfigured,
  label = "Sign In",
  variant = "outline",
  size = "default",
  className,
}) => {
  if (!authConfigured) {
    return (
      <Button asChild variant={variant} size={size} className={className}>
        <Link href="/sign-in">{label}</Link>
      </Button>
    );
  }

  return (
    <SignInButton
      mode="modal"
      fallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
    >
      <Button variant={variant} size={size} className={className}>
        {label}
      </Button>
    </SignInButton>
  );
};

export default SignInCta;
