"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/auth/auth-shell";
import { toast } from "sonner";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState(null);
  const [devHint, setDevHint] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setDevLink(null);
    setDevHint(null);
    try {
      const r = await fetch("/api/auth/request-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Request failed");
      setSent(true);
      if (j.resetUrl) setDevLink(j.resetUrl);
      if (j.devHint) setDevHint(j.devHint);
      toast.success(j.message || "Check your email");
    } catch (err) {
      toast.error(err.message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Reset password"
      subtitle={
        sent
          ? "If your email is on file, we sent a link to reset your password."
          : "Enter your admin email and we will send a reset link."
      }
      footer={
        <p className="mt-6 text-center text-xs text-zinc-500">
          <Link href="/auth/signin" className="font-medium text-zinc-900 underline-offset-2 hover:underline">
            Back to sign in
          </Link>
        </p>
      }
    >
      {sent ? (
        <div className="space-y-4 text-center text-sm text-zinc-600">
          <p>{devLink ? "Use the link below to set a new password." : "Did not get it? Check spam or try again."}</p>
          {devHint && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-left text-xs text-amber-950">
              {devHint}
            </p>
          )}
          {devLink && (
            <p className="break-all rounded-lg bg-zinc-100 p-3 text-left text-xs text-zinc-800">
              <span className="font-medium">Dev reset link:</span>
              <br />
              <a href={devLink} className="text-violet-700 underline">
                {devLink}
              </a>
            </p>
          )}
          <Button type="button" variant="outline" className="w-full" onClick={() => setSent(false)}>
            Try another email
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4 sm:rounded-xl sm:border sm:border-zinc-200 sm:p-5">
          <div className="space-y-1">
            <Label htmlFor="reset-email">Email</Label>
            <Input
              id="reset-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-10"
            />
          </div>
          <Button type="submit" className="h-11 w-full" disabled={loading}>
            {loading ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
