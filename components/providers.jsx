"use client";

import { JWTAuthProvider } from "@/hooks/use-jwt-auth";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }) {
  return (
    <ThemeProvider>
      <JWTAuthProvider>
        {children}
        <Toaster richColors position="top-center" />
      </JWTAuthProvider>
    </ThemeProvider>
  );
}
