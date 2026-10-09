"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock, Copy, ExternalLink, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { promoSubmitClass } from "@/components/promo/promo-card-theme";
import { cn } from "@/lib/utils";
import {
  formatPromoStatusLabel,
  formatPromoValidDuration,
  type PromoSignupStatus,
} from "@/lib/promo-signup";
import { isHiddenTicketLinkSignupCode } from "@/lib/promo-campaign-code";

function PromoCountdown({
  expiresAt,
  validHours,
  ticketCheckout,
}: {
  expiresAt?: string | null;
  validHours?: number;
  ticketCheckout?: boolean;
}) {
  const [remaining, setRemaining] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    expired: boolean;
  } | null>(null);

  useEffect(() => {
    if (!expiresAt) return undefined;
    const tick = () => {
      const ms = new Date(expiresAt).getTime() - Date.now();
      if (ms <= 0) {
        setRemaining({ hours: 0, minutes: 0, seconds: 0, expired: true });
        return;
      }
      const totalSec = Math.floor(ms / 1000);
      setRemaining({
        hours: Math.floor(totalSec / 3600),
        minutes: Math.floor((totalSec % 3600) / 60),
        seconds: totalSec % 60,
        expired: false,
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (!remaining) return null;

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="mt-3 rounded-lg border border-amber-700/50 bg-amber-950/40 px-3 py-2.5 text-left sm:mt-4">
      <div className="flex items-center gap-2 text-amber-200">
        <Clock className="h-4 w-4 shrink-0" />
        <span className="text-xs font-semibold uppercase tracking-wide">
          {remaining.expired
            ? ticketCheckout
              ? "Link expired"
              : "Code expired"
            : `Valid for ${formatPromoValidDuration(validHours ?? 24)}`}
        </span>
      </div>
      {!remaining.expired && (
        <p className="mt-1 font-mono text-lg font-bold tabular-nums text-amber-100">
          {pad(remaining.hours)}:{pad(remaining.minutes)}:{pad(remaining.seconds)}
        </p>
      )}
      <p className="mt-1 text-[11px] text-amber-300/90">
        {ticketCheckout
          ? "Paste your code at checkout on Howler before the timer runs out."
          : "Use your code in-store before the timer runs out."}
      </p>
    </div>
  );
}

function PromoCodeCopy({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      try {
        const input = document.createElement("textarea");
        input.value = code;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2200);
      } catch {
        /* ignore */
      }
    }
  };

  return (
    <div className="mt-3 space-y-2">
      <button
        type="button"
        onClick={() => void copy()}
        className="w-full rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-3 text-left transition-colors hover:border-zinc-500 hover:bg-zinc-900"
      >
        <p className="text-[10px] uppercase tracking-wide text-zinc-500">Your promo code</p>
        <p className="mt-1 font-mono text-lg font-bold tracking-wide text-white">{code}</p>
        <p className="mt-2 flex items-center justify-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
          <Copy className="h-3.5 w-3.5" />
          {copied ? "Copied!" : "Tap to copy"}
        </p>
      </button>
    </div>
  );
}

export function PromoSuccessCard({
  message,
  discountCode,
  expiresAt,
  validHours,
  status,
  headline,
  showStatus = false,
  ticketUrl,
  ticketLinkOnly,
}: {
  message?: string | null;
  discountCode?: string | null;
  expiresAt?: string | null;
  validHours?: number;
  stores?: unknown[];
  status?: PromoSignupStatus;
  headline?: string;
  showStatus?: boolean;
  ticketUrl?: string | null;
  ticketLinkOnly?: boolean;
}) {
  const isUsed = status === "used";
  const isExpired = status === "expired";
  const isCancelled = status === "cancelled";
  const isInactive = isUsed || isExpired || isCancelled;
  const checkoutUrl = ticketUrl?.trim() || null;
  const showPromoCode =
    Boolean(discountCode) && !ticketLinkOnly && !isHiddenTicketLinkSignupCode(discountCode);

  return (
    <div className="mt-3 rounded-xl border border-emerald-800/60 bg-emerald-950/35 p-4 text-center sm:mt-0 sm:p-6">
      {isInactive ? (
        <XCircle className="mx-auto h-9 w-9 text-amber-600 sm:h-10 sm:w-10" />
      ) : (
        <CheckCircle2 className="mx-auto h-9 w-9 text-emerald-400 sm:h-10 sm:w-10" />
      )}
      <p className="mt-2 font-medium text-emerald-100">
        {isUsed
          ? "This code has been used"
          : isExpired
            ? "This code has expired"
            : isCancelled
              ? "This code has been cancelled"
              : "You're all set!"}
      </p>
      {message && <p className="mt-1 text-sm text-emerald-200/90">{message}</p>}
      {headline && !message && <p className="mt-1 text-sm text-emerald-200/90">{headline}</p>}
      {showStatus && status && (
        <div className="mt-2">
          <Badge variant={isUsed ? "secondary" : isExpired || isCancelled ? "destructive" : "default"}>
            {formatPromoStatusLabel(status)}
          </Badge>
        </div>
      )}
      {showPromoCode && !isInactive ? <PromoCodeCopy code={discountCode!} /> : null}
      {showPromoCode && isInactive ? (
        <div className="mt-3 rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-zinc-500">Code</p>
          <p className="font-mono text-lg font-bold text-white">{discountCode}</p>
        </div>
      ) : null}
      {!isInactive && checkoutUrl ? (
        <Button asChild className={cn(promoSubmitClass, "mt-4 w-full")}>
          <a href={checkoutUrl} target="_blank" rel="noopener noreferrer">
            {ticketLinkOnly || !showPromoCode ? "Get discounted tickets" : "Redeem code"}
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
      ) : null}
      {!isInactive && (
        <PromoCountdown expiresAt={expiresAt} validHours={validHours} ticketCheckout={Boolean(checkoutUrl)} />
      )}
    </div>
  );
}
