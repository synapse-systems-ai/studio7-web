"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Studio7Logo } from "@/components/brand/studio7-logo";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function HomeLanding() {
  return (
    <MarketingPageShell>
      <div className="flex min-h-full items-center justify-center p-4 sm:p-8">
        <Card className="w-full max-w-lg border-white/10 bg-white/95 text-zinc-900 shadow-2xl backdrop-blur-xl">
          <CardHeader className="items-center space-y-4 pb-2 text-center">
            <Studio7Logo size={112} priority className="ring-violet-500/20" />
            <div className="space-y-2">
              <p className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-violet-800">
                <Sparkles className="size-3.5" aria-hidden />
                Studio 7
              </p>
              <CardTitle className="text-2xl font-bold tracking-tight sm:text-3xl">
                Event promos &amp; guest lists
              </CardTitle>
              <CardDescription className="max-w-sm text-base text-zinc-600">
                Run QR campaigns, capture signups at the door, and manage your team from one admin workspace.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pt-2">
            <Link
              href="/auth/signin"
              className={cn(buttonVariants({ size: "lg" }), "h-11 w-full text-base")}
            >
              Team admin sign in
              <ArrowRight className="ml-1 size-4" aria-hidden />
            </Link>
            <Link
              href="/auth/signup"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11 w-full text-base")}
            >
              Create account
            </Link>
            <p className="pt-2 text-center text-xs leading-relaxed text-zinc-500">
              Guests use the QR or link for your event - not this homepage.
            </p>
          </CardContent>
        </Card>
      </div>
    </MarketingPageShell>
  );
}
