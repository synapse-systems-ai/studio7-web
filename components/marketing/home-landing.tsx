"use client";

import { ArrowRight } from "lucide-react";
import { Studio7InteractiveButton } from "@/components/brand/studio7-interactive-button";
import { Studio7Logo } from "@/components/brand/studio7-logo";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";

export function HomeLanding() {
  return (
    <MarketingPageShell>
      <div className="flex min-h-full flex-col items-center justify-center px-4 py-12 sm:py-16">
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="space-y-5">
            <Studio7Logo size={128} priority className="mx-auto ring-white/25" />
            <div className="space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-zinc-400">Studio7.rsa</p>
              <h1 className="text-2xl font-bold uppercase tracking-[0.12em] text-white sm:text-3xl">
                Event promos
              </h1>
              <p className="mx-auto max-w-sm text-sm leading-relaxed text-zinc-400">
                QR campaigns and guest lists for the crew. Admin sign-in only.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/15 bg-black/60 p-6 shadow-[0_0_60px_rgba(255,255,255,0.06)] backdrop-blur-md">
            <Studio7InteractiveButton href="/auth/signin">
              <span className="inline-flex items-center gap-2">
                Team sign in
                <ArrowRight className="size-4" aria-hidden />
              </span>
            </Studio7InteractiveButton>
            <p className="mt-5 text-[11px] leading-relaxed text-zinc-500">
              Guests use the event QR or link. This page is not the signup form.
            </p>
          </div>
        </div>
      </div>
    </MarketingPageShell>
  );
}
