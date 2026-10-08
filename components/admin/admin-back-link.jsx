"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Navigation back control styled as a button. Use Link + buttonVariants (not Button asChild)
 * so icon and label stay on one row and the control does not shrink in flex headers.
 */
export function AdminBackLink({ href, label, shortLabel = "Back", className }) {
  return (
    <Link
      href={href}
      className={cn(
        buttonVariants({ variant: "outline", size: "lg" }),
        "inline-flex w-fit max-w-none shrink-0 flex-row items-center gap-2 self-start sm:self-center",
        className,
      )}
    >
      <ArrowLeft className="size-4 shrink-0" aria-hidden />
      <span className="sm:hidden">{shortLabel}</span>
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}
