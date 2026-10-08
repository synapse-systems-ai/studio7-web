"use client";

import { useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  displayInstagramHandle,
  instagramProfileUrl,
  isValidInstagramHandle,
  normalizeInstagramHandle,
} from "@/lib/promo-instagram";

const promoFieldClass =
  "h-10 border-zinc-200 bg-white text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:border-zinc-900 focus-visible:ring-zinc-900/15 sm:h-11";

const promoLabelClass = "text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-600";

const promoSubmitReadyClass =
  "h-12 w-full rounded-xl bg-zinc-950 text-xs font-bold uppercase tracking-[0.2em] text-white shadow-md hover:bg-zinc-800 disabled:opacity-60 sm:text-sm";

const promoSubmitLockedClass =
  "h-12 w-full rounded-xl border border-zinc-300 bg-zinc-200 text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 shadow-none sm:text-sm";

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
  const [followConfirmed, setFollowConfirmed] = useState(false);

  const accountLabel = useMemo(() => displayInstagramHandle(instagramUsername), [instagramUsername]);
  const profileUrl = useMemo(() => instagramProfileUrl(instagramUsername), [instagramUsername]);
  const normalized = normalizeInstagramHandle(handle);
  const handleValid = isValidInstagramHandle(normalized);
  const canSubmit = followConfirmed && handleValid && !submitting;

  return (
    <form
      className="space-y-4 rounded-2xl border border-zinc-200/80 bg-zinc-50/90 p-4 sm:p-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSubmit) return;
        void onSubmit(normalized);
      }}
    >
      <div className="rounded-xl border border-zinc-200 bg-white px-4 py-4 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-zinc-500">Your reward</p>
        <p className="mt-2 text-3xl font-bold tracking-tight text-zinc-950">{discountPercent}% off</p>
        <Badge variant="secondary" className="mt-3 border-zinc-200 bg-zinc-100 text-zinc-800">
          Ticket discount
        </Badge>
      </div>

      <div className="rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-center">
        <p className="text-sm font-medium text-amber-950">Follow {accountLabel} to unlock your code</p>
        <p className="mt-1 text-xs leading-relaxed text-amber-900/90">
          Open Instagram, follow the account, then confirm below to activate submit.
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-3 gap-1.5 border-amber-300 bg-white text-amber-950 hover:bg-amber-100"
          onClick={() => {
            window.open(profileUrl, "_blank", "noopener,noreferrer");
            setFollowStarted(true);
          }}
        >
          Follow on Instagram
          <ExternalLink className="h-3.5 w-3.5" />
        </Button>
      </div>

      {followStarted ? (
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-3">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-zinc-300"
            checked={followConfirmed}
            onChange={(e) => setFollowConfirmed(e.target.checked)}
          />
          <span className="text-left text-sm text-zinc-700">
            I follow {accountLabel} on Instagram and want my {discountPercent}% discount code.
          </span>
        </label>
      ) : (
        <p className="text-center text-[11px] text-zinc-500">Tap Follow on Instagram first — then you can submit.</p>
      )}

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
          disabled={!followConfirmed}
        />
        {handle && !handleValid ? (
          <p className="text-xs text-red-600">Use letters, numbers, dots, and underscores only.</p>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center text-xs text-red-800 sm:text-sm">
          {error}
        </p>
      ) : null}

      <Button type="submit" className={cn(canSubmit ? promoSubmitReadyClass : promoSubmitLockedClass)} disabled={!canSubmit}>
        {submitting ? "Getting your code…" : canSubmit ? "Get my discount code" : "Follow to unlock"}
      </Button>

      {termsText ? (
        <p className="text-center text-[10px] leading-relaxed text-zinc-500 sm:text-[11px]">{termsText}</p>
      ) : null}
    </form>
  );
}
