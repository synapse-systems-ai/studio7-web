"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import ClickSpark from "@/components/ClickSpark";
import Magnet from "@/components/Magnet";
import StarBorder from "@/components/StarBorder";
import { cn } from "@/lib/utils";

type Studio7InteractiveButtonProps = {
  href?: string;
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
  variant?: "primary" | "ghost";
};

function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href);
}

export function Studio7InteractiveButton({
  href,
  type = "button",
  onClick,
  disabled = false,
  className,
  children,
  variant = "primary",
}: Studio7InteractiveButtonProps) {
  const isPrimary = variant === "primary";
  const linkProps = href
    ? isExternalHref(href)
      ? { href, target: "_blank", rel: "noopener noreferrer" as const }
      : { href }
    : {};
  const inner = (
    <StarBorder
      as={href ? (isExternalHref(href) ? "a" : Link) : "button"}
      {...(href ? linkProps : { type, onClick, disabled })}
      color="#ffffff"
      speed="5s"
      thickness={1}
      backgroundColor={isPrimary ? "#ffffff" : "#0a0a0a"}
      textColor={isPrimary ? "#000000" : "#ffffff"}
      borderColor={isPrimary ? "#e5e5e5" : "#525252"}
      className={cn("block w-full transition-opacity", disabled && "pointer-events-none opacity-50", className)}
    >
      <span className="flex items-center justify-center gap-2 py-0.5 text-sm font-bold uppercase tracking-[0.22em] [&_*]:tracking-[0.22em]">
        {children}
      </span>
    </StarBorder>
  );

  return (
    <ClickSpark sparkColor="#ffffff" sparkSize={8} sparkCount={10} duration={350}>
      <Magnet padding={72} magnetStrength={2.5} disabled={disabled} wrapperClassName="w-full">
        {inner}
      </Magnet>
    </ClickSpark>
  );
}
