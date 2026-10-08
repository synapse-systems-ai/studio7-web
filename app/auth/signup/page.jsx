"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SignUpScreen } from "@/components/auth/sign-up-screen";
import { persistClientAuthToken } from "@/lib/client-auth-storage";
import { useJWTAuth } from "@/hooks/use-jwt-auth";
import { toast } from "sonner";

export default function SignUpPage() {
  const router = useRouter();
  const { mutate } = useJWTAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email, password }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Sign up failed");
      if (j.token) persistClientAuthToken(j.token);
      await mutate?.();
      toast.success(j.bootstrap ? "Welcome - admin account ready" : "Account created - welcome");
      router.replace("/admin/promotions");
    } catch (err) {
      toast.error(err.message || "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SignUpScreen
      name={name}
      email={email}
      password={password}
      showPassword={showPassword}
      loading={loading}
      onNameChange={(e) => setName(e.target.value)}
      onEmailChange={(e) => setEmail(e.target.value)}
      onPasswordChange={(e) => setPassword(e.target.value)}
      onToggleShowPassword={() => setShowPassword((v) => !v)}
      onSubmit={submit}
    />
  );
}
