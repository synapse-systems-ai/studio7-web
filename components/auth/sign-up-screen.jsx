"use client";

import Link from "next/link";
import { Eye, EyeOff, Loader2, Mail, User } from "lucide-react";
import ClickSpark from "@/components/ClickSpark";
import { Studio7InteractiveButton } from "@/components/brand/studio7-interactive-button";
import { Studio7Logo } from "@/components/brand/studio7-logo";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const fieldClass =
  "h-12 border-white/20 bg-black/50 text-base text-white placeholder:text-zinc-600 focus-visible:border-white/50 focus-visible:bg-black/80 focus-visible:ring-white/20";

export function SignUpScreen({
  name,
  email,
  password,
  showPassword,
  loading,
  onNameChange,
  onEmailChange,
  onPasswordChange,
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
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-500">Join the crew</p>
                <h1 className="text-xl font-bold uppercase tracking-[0.15em] text-white sm:text-2xl">Create account</h1>
                <p className="text-sm text-zinc-400">
                  Marketing access by default. Your lead can upgrade roles in Users.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/15 bg-black/70 p-6 shadow-[0_0_48px_rgba(255,255,255,0.05)] backdrop-blur-md sm:p-7">
              <form onSubmit={onSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                    Name
                  </Label>
                  <div className="relative">
                    <User
                      className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-500"
                      aria-hidden
                    />
                    <Input
                      id="name"
                      autoComplete="name"
                      placeholder="Your name"
                      value={name}
                      onChange={onNameChange}
                      required
                      className={cn(fieldClass, "pl-11")}
                    />
                  </div>
                </div>

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
                      className={cn(fieldClass, "pl-11")}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="At least 8 characters"
                      value={password}
                      onChange={onPasswordChange}
                      required
                      minLength={8}
                      className={cn(fieldClass, "pr-12")}
                    />
                    <button
                      type="button"
                      onClick={onToggleShowPassword}
                      className="absolute right-2 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-lg border border-transparent text-zinc-400 transition-colors hover:border-white/15 hover:bg-white/5 hover:text-white"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      aria-pressed={showPassword}
                    >
                      {showPassword ? (
                        <EyeOff className="size-[1.125rem]" strokeWidth={1.5} />
                      ) : (
                        <Eye className="size-[1.125rem]" strokeWidth={1.5} />
                      )}
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div className="flex h-[52px] w-full items-center justify-center rounded-[20px] border border-white/20 bg-white/10 text-sm font-semibold uppercase tracking-widest text-white">
                    <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                    Creating account
                  </div>
                ) : (
                  <Studio7InteractiveButton type="submit">Create account</Studio7InteractiveButton>
                )}
              </form>

              <p className="mt-6 text-center text-sm text-zinc-500">
                Already have an account?{" "}
                <Link
                  href="/auth/signin"
                  className="font-semibold uppercase tracking-wide text-zinc-300 underline-offset-2 hover:text-white hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </ClickSpark>
    </MarketingPageShell>
  );
}
