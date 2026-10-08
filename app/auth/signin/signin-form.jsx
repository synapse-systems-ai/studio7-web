"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SignInScreen } from "@/components/auth/sign-in-screen";
import { toast } from "sonner";
import { useJWTAuth } from "@/hooks/use-jwt-auth";
import {
  persistRememberMePreference,
  readRememberMePreference,
} from "@/lib/client-auth-storage";

export default function SignInForm() {
  const router = useRouter();
  const { signIn } = useJWTAuth();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/admin/promotions";
  const authError = searchParams.get("error");

  const sessionMessage = useMemo(() => {
    if (authError === "session_expired") {
      return "Your session expired. Sign in again to continue.";
    }
    return null;
  }, [authError]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setRememberMe(readRememberMePreference());
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      persistRememberMePreference(rememberMe);
      const result = await signIn(email, password, { rememberMe });
      if (result.error) throw new Error(result.error);
      toast.success("Welcome back");
      router.replace(callbackUrl);
    } catch (err) {
      toast.error(err.message || "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SignInScreen
      email={email}
      password={password}
      rememberMe={rememberMe}
      showPassword={showPassword}
      loading={loading}
      sessionMessage={sessionMessage}
      onEmailChange={(e) => setEmail(e.target.value)}
      onPasswordChange={(e) => setPassword(e.target.value)}
      onRememberMeChange={setRememberMe}
      onToggleShowPassword={() => setShowPassword((v) => !v)}
      onSubmit={submit}
    />
  );
}
