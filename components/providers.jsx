"use client";

import { JWTAuthProvider } from "@/hooks/use-jwt-auth";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }) {
  return (
    <JWTAuthProvider>
      {children}
      <Toaster richColors position="top-center" />
    </JWTAuthProvider>
  );
}
