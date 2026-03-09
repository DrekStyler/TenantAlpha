"use client";

import { SignUp } from "@clerk/nextjs";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function SignUpFallback() {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-navy-200 border-t-navy-900" />
      <p className="text-sm text-navy-500">Loading sign-up...</p>
    </div>
  );
}

function SignUpForm() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect_url");

  return (
    <SignUp forceRedirectUrl={redirectUrl || "/dashboard"} />
  );
}

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-50">
      <Suspense fallback={<SignUpFallback />}>
        <SignUpForm />
      </Suspense>
    </div>
  );
}
