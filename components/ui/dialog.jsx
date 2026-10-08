"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef(({ className, children, hideCloseButton, onPointerDownOutside, onInteractOutside, onFocusOutside, ...props }, ref) => {
  const allowOutsideSelector = (event) => {
    const t = event?.target;
    if (!t || typeof t.closest !== "function") return false;
    return Boolean(
      t.closest(".hierarchical-selector-menu") ||
        t.closest(".hierarchical-selector") ||
        t.closest("[data-slot='select-content']") ||
        // Google Places Autocomplete (.pac-container) is appended straight
        // to document.body by Google's own widget, outside this dialog's
        // DOM — without this, clicking a suggestion reads as an outside
        // click and closes the whole dialog before the click registers.
        t.closest(".pac-container")
    );
  };

  return (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        /* Fade only — zoom/slide animate-in utilities replace `transform` and break left-1/2 centering. */
        "fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 sm:rounded-lg",
        /* Do not set overflow-x-hidden on small viewports: it breaks horizontal touch scrolling in nested table regions. min-w-0 + fixed width keep layout contained. */
        "max-sm:max-h-[85vh] max-sm:min-w-0 max-sm:overflow-y-auto max-sm:p-4",
        className,
        "max-sm:w-[calc(100vw-2rem)] max-sm:max-w-[calc(100vw-2rem)]"
      )}
      onPointerDownOutside={(e) => {
        if (allowOutsideSelector(e)) e.preventDefault();
        onPointerDownOutside?.(e);
      }}
      onInteractOutside={(e) => {
        if (allowOutsideSelector(e)) e.preventDefault();
        onInteractOutside?.(e);
      }}
      onFocusOutside={(e) => {
        if (allowOutsideSelector(e)) e.preventDefault();
        onFocusOutside?.(e);
      }}
      {...props}
    >
      {children}
      {!hideCloseButton && (
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </DialogPortal>
  );
});
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({ className, ...props }) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left pr-12 min-w-0", className)} {...props} />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({ className, ...props }) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:space-x-0", className)} {...props} />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Description ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
