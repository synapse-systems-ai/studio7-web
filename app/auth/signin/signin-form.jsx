"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/auth/auth-shell";
import { toast } from "sonner";
import { useJWTAuth } from "@/hooks/use-jwt-auth";
import {
  persistRememberMePreference,
  readRememberMePreference,
} from "@/lib/client-auth-storage";

export default function SignInForm() {
  const router = useRouter();
  const { signIn } = useJWTAuth();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/admin/promotions";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setRememberMe(readRememberMePreference());
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      persistRememberMePreference(rememberMe);
      const result = await signIn(email, password, { rememberMe });
      if (result.error) throw new Error(result.error);
      toast.success("Welcome back");
      router.replace(callbackUrl);
    } catch (err) {
      toast.error(err.message || "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Admin sign in"
      subtitle="Manage campaigns, guest lists, and team access."
      footer={
        <p className="mt-6 text-center text-xs text-zinc-500">
          New here?{" "}
          <Link href="/auth/signup" className="font-medium text-zinc-900 underline-offset-2 hover:underline">
            Create an account
          </Link>
        </p>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="email" className="text-xs sm:text-sm">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-10"
          />
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="password" className="text-xs sm:text-sm">
              Password
            </Label>
            <Link
              href="/auth/forgot-password"
              className="text-xs font-medium text-violet-700 underline-offset-2 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="h-10"
          />
        </div>
        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-zinc-600">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="size-4 rounded border-zinc-300 text-zinc-900 focus:ring-violet-600"
          />
          Remember me
        </label>
        <Button type="submit" className="h-11 w-full text-base" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </AuthShell>
  );
}
