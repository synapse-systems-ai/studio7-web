"use client";

import type { ReactNode } from "react";
import Aurora from "@/components/Aurora";
import { cn } from "@/lib/utils";

/** Monochrome aurora (Instagram / ST7 poster vibe). */
export const ST7_AURORA_STOPS = ["#ffffff", "#525252", "#0a0a0a"];

export function Studio7AuroraBackground() {
  return (
    <>
      <div className="absolute inset-0 bg-black" aria-hidden />
      <div className="absolute inset-0 opacity-[0.22]" aria-hidden>
        <Aurora colorStops={ST7_AURORA_STOPS} amplitude={0.85} blend={0.45} speed={0.6} />
      </div>
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80" aria-hidden />
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
    <div className={cn("fixed inset-0 h-dvh w-full overflow-hidden bg-black text-white", className)}>
      <Studio7AuroraBackground />
      <div className={cn("relative z-10 h-full w-full overflow-y-auto", contentClassName)}>{children}</div>
    </div>
  );
}
