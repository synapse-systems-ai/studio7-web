"use client";

import type { ReactNode } from "react";
import Aurora from "@/components/Aurora";
import { cn } from "@/lib/utils";

/** Violet / ink palette tuned for the ST7 brand mark. */
export const ST7_AURORA_STOPS = ["#7c3aed", "#4c1d95", "#0a0a0b"];

export function Studio7AuroraBackground() {
  return (
    <>
      <div className="absolute inset-0 bg-black" aria-hidden />
      <div className="absolute inset-0 opacity-95" aria-hidden>
        <Aurora colorStops={ST7_AURORA_STOPS} amplitude={1.05} blend={0.55} speed={0.85} />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/35 to-black/20" aria-hidden />
    </>
  );
}

type MarketingPageShellProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function MarketingPageShell({ children, className, contentClassName }: MarketingPageShellProps) {
  return (
    <div className={cn("fixed inset-0 h-dvh w-full overflow-hidden text-white", className)}>
      <Studio7AuroraBackground />
      <div className={cn("relative z-10 h-full w-full overflow-y-auto", contentClassName)}>{children}</div>
    </div>
  );
}
