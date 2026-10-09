"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  displayInstagramHandle,
  instagramDmUrl,
  instagramProfileUrl,
  isValidInstagramHandle,
  normalizeInstagramHandle,
} from "@/lib/promo-instagram";
import {
  promoFieldClass,
  promoFormShellClass,
  promoLabelClass,
  promoSubmitClass,
  promoSubmitLockedClass,
} from "@/components/promo/promo-card-theme";

type VerificationStatus =
  | "idle"
  | "checking"
  | "pending"
  | "verified"
  | "not_following"
  | "invalid_handle"
  | "not_configured";

type Props = {
  discountPercent: number;
  instagramUsername: string;
  termsText?: string | null;
  submitting: boolean;
  error: string | null;
  onSubmit: (handle: string) => void | Promise<void>;
};

export function PromoInstagramSignupForm({
  discountPercent,
  instagramUsername,
  termsText,
  submitting,
  error,
  onSubmit,
}: Props) {
  const [handle, setHandle] = useState("");
  const [followStarted, setFollowStarted] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<VerificationStatus>("idle");
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);

  const accountLabel = useMemo(() => displayInstagramHandle(instagramUsername), [instagramUsername]);
  const profileUrl = useMemo(() => instagramProfileUrl(instagramUsername), [instagramUsername]);
  const dmUrl = useMemo(() => instagramDmUrl(instagramUsername), [instagramUsername]);
  const normalized = normalizeInstagramHandle(handle);
  const handleValid = isValidInstagramHandle(normalized);
  const verified = verifyStatus === "verified";
  const canSubmit = verified && handleValid && !submitting;

  const [debouncedHandle, setDebouncedHandle] = useState("");
  const verifyStatusRef = useRef(verifyStatus);
  verifyStatusRef.current = verifyStatus;

  useEffect(() => {
    if (!handleValid) {
      setDebouncedHandle("");
      return;
    }
    const timer = window.setTimeout(() => setDebouncedHandle(normalized), 450);
    return () => window.clearTimeout(timer);
  }, [handleValid, normalized]);

  useEffect(() => {
    if (!followStarted) {
      setVerifyStatus("idle");
      setVerifyMessage(null);
      return;
    }
    if (!debouncedHandle) {
      setVerifyStatus("idle");
      setVerifyMessage(null);
      return;
    }

    let cancelled = false;
    const account = normalizeInstagramHandle(instagramUsername);

    const check = async (showChecking: boolean) => {
      if (!showChecking && verifyStatusRef.current === "verified") return true;

      if (showChecking) {
        setVerifyStatus("checking");
        setVerifyMessage("Checking your follow on Instagram…");
      }

      const started = Date.now();
      try {
        const params = new URLSearchParams({ account, handle: debouncedHandle });
        const res = await fetch(`/api/promo/instagram/verification?${params}`);
        const data = (await res.json()) as {
          status?: VerificationStatus;
          message?: string;
          simulated?: boolean;
        };
        if (cancelled) return verifyStatusRef.current === "verified";
        if (data.status === "verified" && data.simulated) {
          const wait = Math.max(0, 1400 - (Date.now() - started));
          await new Promise((resolve) => setTimeout(resolve, wait));
          if (cancelled) return verifyStatusRef.current === "verified";
        }
        const status = (data.status || "pending") as VerificationStatus;
        setVerifyStatus(status);
        setVerifyMessage(data.message || null);
        return status === "verified";
      } catch {
        if (!cancelled && verifyStatusRef.current !== "verified") {
          setVerifyStatus("pending");
          setVerifyMessage("Could not verify yet. Try sending a DM from this account.");
        }
        return false;
      }
    };

    void check(true);
    const interval = window.setInterval(() => {
      void check(false).then((done) => {
        if (done) window.clearInterval(interval);
      });
    }, 4000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [followStarted, debouncedHandle, instagramUsername]);

  return (
    <form
      className={promoFormShellClass}
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSubmit) return;
        void onSubmit(normalized);
      }}
    >
      <div className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-4 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-zinc-500">Your reward</p>
        <p className="mt-2 text-3xl font-bold tracking-tight text-white">{discountPercent}% off</p>
        <Badge variant="secondary" className="mt-3 border-zinc-600 bg-zinc-800 text-zinc-200">
          Ticket discount
        </Badge>
      </div>

      <div className="rounded-xl border border-amber-700/50 bg-amber-950/40 px-4 py-3 text-center">
        <p className="text-sm font-medium text-amber-100">Follow {accountLabel}, then message us</p>
        <p className="mt-1 text-xs leading-relaxed text-amber-200/90">
          We verify your handle and that you follow {accountLabel} through Instagram (not the honor system).
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button
            type="button"
            variant="outline"
            className="gap-1.5 border-amber-600/80 bg-zinc-950 text-amber-100 hover:bg-amber-950/80"
            onClick={() => {
              window.open(profileUrl, "_blank", "noopener,noreferrer");
              setFollowStarted(true);
            }}
          >
            Follow on Instagram
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="outline"
            className="gap-1.5 border-amber-600/80 bg-zinc-950 text-amber-100 hover:bg-amber-950/80"
            onClick={() => {
              window.open(dmUrl, "_blank", "noopener,noreferrer");
              setFollowStarted(true);
            }}
          >
            Send us a DM
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {!followStarted ? (
        <p className="text-center text-[11px] text-zinc-500">
          Start with Follow, then send any DM from the same account you&apos;ll enter below.
        </p>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="promo-instagram-handle" className={promoLabelClass}>
          Your Instagram handle <span className="text-red-600">*</span>
        </Label>
        <Input
          id="promo-instagram-handle"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          placeholder="@yourname"
          autoComplete="username"
          className={promoFieldClass}
          disabled={!followStarted}
        />
        {handle && !handleValid ? (
          <p className="text-xs text-red-600">Use letters, numbers, dots, and underscores only.</p>
        ) : null}
        {followStarted ? (
          <div
            className={cn(
              "flex min-h-11 items-start gap-2 rounded-lg border px-3 py-2 text-xs transition-colors duration-300 sm:min-h-12 sm:text-sm",
              !handleValid || verifyStatus === "idle"
                ? "border-transparent bg-transparent text-transparent"
                : verified
                  ? "border-emerald-800/60 bg-emerald-950/40 text-emerald-100"
                  : verifyStatus === "not_following" || verifyStatus === "invalid_handle"
                    ? "border-red-900/70 bg-red-950/40 text-red-200"
                    : verifyStatus === "not_configured"
                      ? "border-amber-700/50 bg-amber-950/40 text-amber-100"
                      : "border-zinc-700 bg-zinc-900 text-zinc-300",
            )}
            aria-live="polite"
          >
            {verifyStatus === "checking" ? (
              <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-zinc-400" />
            ) : (
              <span className="mt-0.5 inline-block h-4 w-4 shrink-0" aria-hidden />
            )}
            <p className={cn(!handleValid || verifyStatus === "idle" ? "invisible" : "")}>
              {verifyMessage || "Checking Instagram verification…"}
            </p>
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-lg border border-red-900/80 bg-red-950/50 px-3 py-2 text-center text-xs text-red-200 sm:text-sm">
          {error}
        </p>
      ) : null}

      <Button type="submit" className={cn(canSubmit ? promoSubmitClass : promoSubmitLockedClass)} disabled={!canSubmit}>
        {submitting ? "One moment…" : canSubmit ? "Get discounted tickets" : "Verify follow to unlock"}
      </Button>

      {termsText ? (
        <p className="text-center text-[10px] leading-relaxed text-zinc-500 sm:text-[11px]">{termsText}</p>
      ) : null}
    </form>
  );
}
