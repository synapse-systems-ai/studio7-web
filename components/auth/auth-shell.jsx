"use client";

import Link from "next/link";
import { Studio7Logo } from "@/components/brand/studio7-logo";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function AuthShell({ title, subtitle, children, footer }) {
  return (
    <MarketingPageShell>
      <div className="flex min-h-full flex-col items-center justify-center p-4 sm:p-6">
        <Card className="w-full max-w-md border-white/10 bg-white/95 text-zinc-900 shadow-2xl backdrop-blur-xl">
          <CardHeader className="items-center space-y-3 pb-0 text-center">
            <Studio7Logo size={88} priority href="/" />
            <div className="space-y-1.5">
              <CardTitle className="text-2xl font-bold tracking-tight sm:text-[1.65rem]">{title}</CardTitle>
              {subtitle ? <CardDescription className="text-sm text-zinc-600">{subtitle}</CardDescription> : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {children}
            {footer}
          </CardContent>
        </Card>
        <p className="mt-5 text-center text-xs text-zinc-300">
          <Link href="/" className="underline-offset-4 hover:text-white hover:underline">
            Back to site
          </Link>
        </p>
      </div>
    </MarketingPageShell>
  );
}
