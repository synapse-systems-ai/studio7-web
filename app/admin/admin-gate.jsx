"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/use-jwt-auth";
import { hasPromotionsAccess } from "@/lib/promotions-auth";

export function AdminGate({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const canAccess = hasPromotionsAccess(session?.user);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user || !canAccess) {
      router.replace("/auth/signin?callbackUrl=/admin/promotions");
    }
  }, [status, canAccess, router, session?.user]);

  if (status === "loading" || !session?.user || !canAccess) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-zinc-500">Loading…</div>
    );
  }

  return children;
}
