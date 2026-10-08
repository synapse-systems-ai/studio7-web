"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  isPublicGuestPath,
  resolvePathnameForStaffAuthGuard,
} from "@/lib/customer-area-path";
import {
  clearClientAuthToken,
  getAuthFetchHeaders,
  persistClientAuthToken,
} from "@/lib/client-auth-storage";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

const AuthContext = createContext();

// Check auth every 5 minutes
const AUTH_POLL_INTERVAL = 5 * 60 * 1000;
// Try to refresh token every 30 minutes
const REFRESH_INTERVAL = 30 * 60 * 1000;

export function JWTAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const redirectingRef = useRef(false);
  /** Ignores stale /api/auth/me results when multiple checks run (Strict Mode, focus, etc.) */
  const authCheckGenerationRef = useRef(0);
  const userRef = useRef(null);
  userRef.current = user;

  const handleExpiredSession = useCallback(() => {
    if (redirectingRef.current) return;
    redirectingRef.current = true;
    setUser(null);
    router.push("/auth/signin?error=session_expired");
  }, [router]);

  const checkAuth = useCallback(async ({ silent = false } = {}) => {
    const routePath = resolvePathnameForStaffAuthGuard(pathname);
    if (isPublicGuestPath(routePath)) {
      // Public routes don't require staff JWT; keep any existing session for post-login navigation.
      ++authCheckGenerationRef.current;
      redirectingRef.current = false;
      setLoading(false);
      return false;
    }

    if (!silent) {
      setLoading(true);
    }
    const generation = ++authCheckGenerationRef.current;
    try {
      const response = await fetchWithTimeout("/api/auth/me", {
        credentials: "include",
        headers: getAuthFetchHeaders(),
      });

      if (generation !== authCheckGenerationRef.current) {
        return false;
      }

      if (response.ok) {
        const data = await response.json();
        if (generation !== authCheckGenerationRef.current) {
          return false;
        }
        setUser(data.user);
        redirectingRef.current = false;
        return true;
      }

      if (response.status === 401) {
        if (generation !== authCheckGenerationRef.current) {
          return false;
        }
        handleExpiredSession();
        return false;
      }

      // 5xx / other - do not clear session; next poll or navigation can retry
      return false;
    } catch (error) {
      console.error("Auth check failed:", error);
      return false;
    } finally {
      if (!silent && generation === authCheckGenerationRef.current) {
        setLoading(false);
      }
    }
  }, [handleExpiredSession, pathname]);

  /** Best-effort cookie extension; never signs the user out (checkAuth owns session validity). */
  const refreshToken = useCallback(async () => {
    try {
      await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
        headers: getAuthFetchHeaders(),
      });
    } catch {
      // Network error - skip
    }
  }, []);

  // Auth check on mount and when staff route changes (silent if already signed in)
  useEffect(() => {
    checkAuth({ silent: userRef.current != null });
  }, [checkAuth]);

  // Periodic auth polling - catches expired sessions
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      checkAuth({ silent: true });
    }, AUTH_POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [user, checkAuth]);

  // Periodic token refresh - extends session before it expires
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      refreshToken();
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [user, refreshToken]);

  // Re-check auth when tab becomes visible (avoid parallel refresh + checkAuth races)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && user) {
        checkAuth({ silent: true }).then((ok) => {
          if (ok) refreshToken();
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [user, checkAuth, refreshToken]);

  const signIn = async (email, password, { rememberMe = true } = {}) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: String(email ?? "").trim().toLowerCase(),
          password: String(password ?? "").trim(),
          rememberMe: rememberMe !== false,
        }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || "Sign in failed" };
      }

      redirectingRef.current = false;
      setUser(data.user);
      if (data.token) {
        persistClientAuthToken(data.token, rememberMe !== false);
      }
      return { error: null, user: data.user, token: data.token ?? null };
    } catch (error) {
      console.error("Sign in error:", error);
      return {
        error:
          "Network error - use http://192.168.x.x:3000 on your phone (not localhost), same Wi‑Fi as this PC.",
      };
    }
  };

  const signOut = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        clearClientAuthToken();
        setUser(null);
        return { error: null };
      }

      return { error: "Sign out failed" };
    } catch (error) {
      console.error("Sign out error:", error);
      return { error: "Network error" };
    }
  };

  const mutate = async () => {
    await checkAuth();
  };

  const value = {
    user,
    loading,
    signIn,
    signOut,
    checkAuth,
    mutate,
    data: { user },
    status: loading ? "loading" : user ? "authenticated" : "unauthenticated",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useJWTAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useJWTAuth must be used within JWTAuthProvider");
  }
  return context;
};

export const useSession = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useSession must be used within JWTAuthProvider");
  }
  return {
    data: { user: context.user },
    status: context.status,
  };
};

// Alias for compatibility
export const useAuth = useJWTAuth;
