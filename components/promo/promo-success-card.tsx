"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  formatPromoStatusLabel,
  formatPromoValidDuration,
  type PromoSignupStatus,
} from "@/lib/promo-signup";

function PromoCountdown({ expiresAt, validHours }: { expiresAt?: string | null; validHours?: number }) {
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
    <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-left sm:mt-4">
      <div className="flex items-center gap-2 text-amber-900">
        <Clock className="h-4 w-4 shrink-0" />
        <span className="text-xs font-semibold uppercase tracking-wide">
          {remaining.expired ? "Code expired" : `Valid for ${formatPromoValidDuration(validHours ?? 24)}`}
        </span>
      </div>
      {!remaining.expired && (
        <p className="mt-1 font-mono text-lg font-bold tabular-nums text-amber-950">
          {pad(remaining.hours)}:{pad(remaining.minutes)}:{pad(remaining.seconds)}
        </p>
      )}
      <p className="mt-1 text-[11px] text-amber-800">Use your code in-store before the timer runs out.</p>
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
}: {
  message?: string | null;
  discountCode?: string | null;
  expiresAt?: string | null;
  validHours?: number;
  stores?: unknown[];
  status?: PromoSignupStatus;
  headline?: string;
  showStatus?: boolean;
}) {
  const isUsed = status === "used";
  const isExpired = status === "expired";
  const isCancelled = status === "cancelled";
  const isInactive = isUsed || isExpired || isCancelled;

  return (
    <div className="mt-3 rounded-xl border border-green-200 bg-green-50 p-4 text-center sm:mt-0 sm:p-6">
      {isInactive ? (
        <XCircle className="mx-auto h-9 w-9 text-amber-600 sm:h-10 sm:w-10" />
      ) : (
        <CheckCircle2 className="mx-auto h-9 w-9 text-green-600 sm:h-10 sm:w-10" />
      )}
      <p className="mt-2 font-medium text-green-800">
        {isUsed
          ? "This code has been used"
          : isExpired
            ? "This code has expired"
            : isCancelled
              ? "This code has been cancelled"
              : "You're all set!"}
      </p>
      {message && <p className="mt-1 text-sm text-green-700">{message}</p>}
      {headline && !message && <p className="mt-1 text-sm text-green-700">{headline}</p>}
      {showStatus && status && (
        <div className="mt-2">
          <Badge variant={isUsed ? "secondary" : isExpired || isCancelled ? "destructive" : "default"}>
            {formatPromoStatusLabel(status)}
          </Badge>
        </div>
      )}
      {discountCode && (
        <div className="mt-3 rounded-lg border border-green-300 bg-white px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-gray-500">Your code</p>
          <p className="font-mono text-lg font-bold text-gray-900">{discountCode}</p>
        </div>
      )}
      {!isInactive && <PromoCountdown expiresAt={expiresAt} validHours={validHours} />}
    </div>
  );
}
