import { Suspense } from "react";
import SignInPage from "./signin-form";

export default function SignInRoute() {
  return (
    <Suspense fallback={<div className="flex min-h-dvh items-center justify-center text-white">Loading…</div>}>
      <SignInPage />
    </Suspense>
  );
}
