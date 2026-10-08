import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input"> & { suppressHydrationWarning?: boolean }
>(function Input({ className, type = "text", suppressHydrationWarning, ...props }, ref) {
  return (
    <input
      ref={ref}
      type={type}
      data-slot="input"
      suppressHydrationWarning={suppressHydrationWarning ?? true}
      className={cn(
        "placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[1px]",
        className,
      )}
      {...props}
    />
  );
});

export { Input };
