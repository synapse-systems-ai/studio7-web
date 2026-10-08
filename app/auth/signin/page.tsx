import { Suspense } from "react";
import SignInPage from "./signin-form";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { Loader2 } from "lucide-react";

function SignInLoading() {
  return (
    <MarketingPageShell>
      <div className="flex min-h-full flex-col items-center justify-center gap-3 text-zinc-200">
        <Loader2 className="size-8 animate-spin text-violet-300" aria-hidden />
        <p className="text-sm">Loading sign in…</p>
      </div>
    </MarketingPageShell>
  );
}

export default function SignInRoute() {
  return (
    <Suspense fallback={<SignInLoading />}>
      <SignInPage />
    </Suspense>
  );
}
