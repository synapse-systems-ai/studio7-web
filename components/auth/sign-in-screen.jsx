"use client";

import Link from "next/link";
import { Eye, EyeOff, Loader2, Mail } from "lucide-react";
import ClickSpark from "@/components/ClickSpark";
import { Studio7InteractiveButton } from "@/components/brand/studio7-interactive-button";
import { Studio7Logo } from "@/components/brand/studio7-logo";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const fieldClass =
  "h-12 border-white/20 bg-black/50 pl-11 text-base text-white placeholder:text-zinc-600 focus-visible:border-white/50 focus-visible:bg-black/80 focus-visible:ring-white/20";

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
    <MarketingPageShell>
      <ClickSpark sparkColor="#ffffff" sparkCount={6} duration={300}>
        <div className="flex min-h-full flex-col items-center justify-center px-4 py-10 sm:py-14">
          <div className="w-full max-w-[400px] space-y-8">
            <div className="flex flex-col items-center space-y-4 text-center">
              <Studio7Logo size={100} priority href="/" className="ring-white/30" />
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-500">Admin</p>
                <h1 className="text-xl font-bold uppercase tracking-[0.15em] text-white sm:text-2xl">
                  Sign in
                </h1>
                <p className="text-sm text-zinc-400">Team email and password</p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/15 bg-black/70 p-6 shadow-[0_0_48px_rgba(255,255,255,0.05)] backdrop-blur-md sm:p-7">
              {sessionMessage ? (
                <div
                  role="alert"
                  className="mb-5 rounded-lg border border-amber-500/40 bg-amber-950/40 px-3 py-2.5 text-sm text-amber-100"
                >
                  {sessionMessage}
                </div>
              ) : null}

              <form onSubmit={onSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail
                      className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-500"
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
                      className={fieldClass}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label
                      htmlFor="password"
                      className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400"
                    >
                      Password
                    </Label>
                    <Link
                      href="/auth/forgot-password"
                      className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 underline-offset-2 hover:text-white hover:underline"
                    >
                      Forgot?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={onPasswordChange}
                      required
                      className={cn(fieldClass, "pr-12")}
                    />
                    <button
                      type="button"
                      onClick={onToggleShowPassword}
                      className="absolute right-2 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-lg border border-transparent text-zinc-400 transition-colors hover:border-white/15 hover:bg-white/5 hover:text-white"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      aria-pressed={showPassword}
                    >
                      {showPassword ? <EyeOff className="size-[1.125rem]" strokeWidth={1.5} /> : <Eye className="size-[1.125rem]" strokeWidth={1.5} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-300">Remember me</p>
                    <p className="text-[11px] text-zinc-500">14 days on this device</p>
                  </div>
                  <Switch
                    id="remember-me"
                    checked={rememberMe}
                    onCheckedChange={onRememberMeChange}
                    aria-label="Remember me"
                  />
                </div>

                {loading ? (
                  <div className="flex h-[52px] w-full items-center justify-center rounded-[20px] border border-white/20 bg-white/10 text-sm font-semibold uppercase tracking-widest text-white">
                    <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                    Signing in
                  </div>
                ) : (
                  <Studio7InteractiveButton type="submit">Enter dashboard</Studio7InteractiveButton>
                )}
              </form>
            </div>
          </div>
        </div>
      </ClickSpark>
    </MarketingPageShell>
  );
}
