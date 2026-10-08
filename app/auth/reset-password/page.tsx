import { Suspense } from "react";
import ResetPasswordForm from "./reset-form";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-dvh items-center justify-center text-white">Loading…</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
