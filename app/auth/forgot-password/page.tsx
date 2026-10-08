import { Suspense } from "react";
import ForgotPasswordForm from "./forgot-form";

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-dvh items-center justify-center text-white">Loading…</div>}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
