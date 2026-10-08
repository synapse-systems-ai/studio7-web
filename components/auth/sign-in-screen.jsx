"use client";

import Link from "next/link";
import { CheckCircle2, Eye, EyeOff, Loader2, Lock, Mail, Sparkles } from "lucide-react";
import { Studio7Logo } from "@/components/brand/studio7-logo";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const HIGHLIGHTS = [
  "Launch and edit QR promo campaigns",
  "Track guest signups in real time",
  "Manage team roles and access",
];

export function SignInScreen({
  email,
  password,
  rememberMe,
  showPassword,
  loading,
  sessionMessage,
  onEmailChange,
  onPasswordChange,
  onRememberMeChange,
  onToggleShowPassword,
  onSubmit,
}) {
  return (
    <MarketingPageShell contentClassName="flex min-h-full flex-col lg:flex-row">
      <aside className="relative hidden w-full max-w-xl flex-col justify-between border-r border-white/10 bg-black/50 p-10 backdrop-blur-sm lg:flex xl:max-w-2xl xl:p-14">
        <div className="space-y-10">
          <Studio7Logo size={72} href="/" className="ring-white/20" />
          <div className="space-y-4">
            <p className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-violet-200">
              <Sparkles className="size-3.5" aria-hidden />
              Team workspace
            </p>
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-white xl:text-4xl">
              Sign in to run
              <span className="block text-violet-300">Studio 7 events</span>
            </h1>
            <p className="max-w-md text-base leading-relaxed text-zinc-300">
              Your hub for campaigns, guest lists, and crew access — built for fast nights and clean handoffs.
            </p>
          </div>
          <ul className="space-y-3">
            {HIGHLIGHTS.map((line) => (
              <li key={line} className="flex items-start gap-3 text-sm text-zinc-200">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-violet-400" aria-hidden />
                {line}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-zinc-500">© Studio 7 · Admin access only</p>
      </aside>

      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-8">
        <Card className="w-full max-w-[420px] border-white/15 bg-white/[0.97] shadow-2xl ring-1 ring-black/5">
          <CardHeader className="space-y-4 pb-2 text-center">
            <div className="flex justify-center lg:hidden">
              <Studio7Logo size={80} href="/" priority className="ring-violet-500/25" />
            </div>
            <div className="space-y-1.5">
              <CardTitle className="text-2xl font-bold tracking-tight">Welcome back</CardTitle>
              <CardDescription className="text-sm text-zinc-600">
                Use your team email and password to open the admin dashboard.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-5 pt-2">
            {sessionMessage ? (
              <div
                role="alert"
                className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-950"
              >
                {sessionMessage}
              </div>
            ) : null}

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-zinc-800">
                  Email
                </Label>
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
                    aria-hidden
                  />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={onEmailChange}
                    required
                    className="h-11 border-zinc-200 bg-zinc-50/80 pl-10 text-base focus-visible:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="password" className="text-sm font-medium text-zinc-800">
                    Password
                  </Label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs font-semibold text-violet-700 underline-offset-2 hover:text-violet-900 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
                    aria-hidden
                  />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={onPasswordChange}
                    required
                    className="h-11 border-zinc-200 bg-zinc-50/80 pl-10 pr-11 text-base focus-visible:bg-white"
                  />
                  <button
                    type="button"
                    onClick={onToggleShowPassword}
                    className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-100 bg-zinc-50/80 px-3 py-2.5">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-zinc-800">Remember me</p>
                  <p className="text-xs text-zinc-500">Stay signed in for 14 days on this device</p>
                </div>
                <Switch
                  id="remember-me"
                  checked={rememberMe}
                  onCheckedChange={onRememberMeChange}
                  aria-label="Remember me"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className={cn("h-11 w-full text-base font-semibold", loading && "opacity-90")}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                    Signing in…
                  </>
                ) : (
                  "Sign in to dashboard"
                )}
              </Button>
            </form>

            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center" aria-hidden>
                <span className="w-full border-t border-zinc-200" />
              </div>
              <p className="relative mx-auto w-fit bg-white px-3 text-xs uppercase tracking-wide text-zinc-400">
                New to Studio 7?
              </p>
            </div>

            <p className="text-center text-sm text-zinc-600">
              <Link
                href="/auth/signup"
                className="font-semibold text-violet-700 underline-offset-2 hover:text-violet-900 hover:underline"
              >
                Create an account
              </Link>
            </p>
          </CardContent>
        </Card>

        <Link
          href="/"
          className="mt-6 text-sm text-zinc-300 underline-offset-4 transition-colors hover:text-white hover:underline"
        >
          ← Back to site
        </Link>
      </div>
    </MarketingPageShell>
  );
}
