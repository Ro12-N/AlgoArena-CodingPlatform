"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

const SignInCta = ({
  label = "Sign In",
  variant = "outline",
  size = "default",
  className,
}) => {
  return (
    <Button asChild variant={variant} size={size} className={className}>
      <Link href="/sign-in">{label}</Link>
    </Button>
  );
};

export default SignInCta;
