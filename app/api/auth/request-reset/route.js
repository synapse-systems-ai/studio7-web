import { NextResponse } from "next/server";
import { getServiceRoleSupabase } from "@/lib/supabase-service-lazy";
import { createResetToken } from "@/lib/jwt-auth";
import { sendPasswordResetEmail } from "@/lib/password-reset-email";
import { hasPromotionsAccess } from "@/lib/promotions-auth";

function siteBaseUrl(request) {
  if (process.env.NODE_ENV === "development") {
    const origin = request.headers.get("origin");
    if (origin?.startsWith("http")) return origin.replace(/\/$/, "");
    const referer = request.headers.get("referer");
    if (referer) {
      try {
        return new URL(referer).origin;
      } catch {
        // ignore
      }
    }
  }
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  ).replace(/\/$/, "");
}

export async function POST(request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalized = String(email).trim().toLowerCase();
    const { data: user, error } = await getServiceRoleSupabase()
      .from("users")
      .select("id, email, name, role, is_active")
      .eq("email", normalized)
      .maybeSingle();

    const isDev = process.env.NODE_ENV === "development";
    const generic = {
      success: true,
      message: "If an account exists with this email, we sent a reset link.",
    };

    if (error || !user) {
      return NextResponse.json({
        ...generic,
        ...(isDev ? { devHint: "No user found with that email." } : {}),
      });
    }

    if (!user.is_active) {
      return NextResponse.json({
        ...generic,
        ...(isDev ? { devHint: "This account is inactive." } : {}),
      });
    }

    const resetToken = await createResetToken({
      id: user.id,
      email: user.email,
      type: "password_reset",
    });

    const resetUrl = `${siteBaseUrl(request)}/auth/reset-password?token=${encodeURIComponent(resetToken)}`;

    if (process.env.RESEND_API_KEY) {
      try {
        await sendPasswordResetEmail(user.email, user.name, resetUrl);
      } catch (err) {
        console.error("Failed to send password reset email:", err);
      }
    } else if (isDev) {
      console.info("[dev] Password reset link:", resetUrl);
    }

    const canAccessAdmin = hasPromotionsAccess(user);

    return NextResponse.json({
      success: true,
      message: canAccessAdmin
        ? generic.message
        : "Reset link generated. Note: after resetting, you still need an admin or marketing role to sign in here.",
      resetUrl: isDev ? resetUrl : undefined,
      ...(isDev && !canAccessAdmin
        ? {
            devHint: `Account role is "${user.role}" — Studio 7 admin requires admin, marketing, or store_manager.`,
          }
        : {}),
    });
  } catch (error) {
    console.error("Password reset request error:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
