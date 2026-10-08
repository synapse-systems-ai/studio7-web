"use client";

import Link from "next/link";
import { Studio7FallbackHero } from "@/components/promo/studio7-fallback-hero";

export function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="fixed inset-0 h-dvh w-full overflow-hidden text-zinc-900">
      <Studio7FallbackHero />
      <div className="relative z-10 flex h-full w-full items-center justify-center overflow-y-auto p-3 sm:p-4">
        <div className="mx-auto my-auto w-full max-w-md">
          <div className="rounded-2xl bg-white/92 px-4 py-6 shadow-2xl backdrop-blur-md sm:bg-white sm:px-6 sm:py-8">
            <div className="mb-6 flex flex-col items-center gap-2 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-violet-700/80">Studio 7</p>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
              {subtitle && <p className="max-w-sm text-sm text-zinc-600">{subtitle}</p>}
            </div>
            {children}
            {footer}
          </div>
          <p className="mt-4 text-center text-xs text-zinc-300 sm:text-zinc-500">
            <Link href="/" className="underline-offset-2 hover:underline">
              Back to site
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
