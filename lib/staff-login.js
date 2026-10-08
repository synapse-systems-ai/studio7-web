import "server-only";

import bcrypt from "bcryptjs";
import { getServiceRoleSupabase } from "@/lib/supabase-service-lazy";
import { createToken, SESSION_MAX_AGE, TOKEN_MAX_AGE } from "@/lib/jwt-token";
import { isSupabaseInfraError, summarizeSupabaseError } from "@/lib/supabase-postgrest-errors";

export { getPostLoginPath } from "@/lib/staff-login-utils";

export async function authenticateStaffCredentials(email, password, { rememberMe = true } = {}) {
  const normalizedEmail = String(email ?? "").trim().toLowerCase();
  const normalizedPassword = String(password ?? "").trim();

  if (!normalizedEmail || !normalizedPassword) {
    return { ok: false, error: "Email and password required", status: 400 };
  }

  const { data: user, error } = await getServiceRoleSupabase()
    .from("users")
    .select("id, email, name, role, store_id, phone, is_active, password_hash, force_password_change")
    .eq("email", normalizedEmail)
    .single();

  if (error) {
    if (isSupabaseInfraError(error)) {
      console.error("Staff login: Supabase unavailable:", summarizeSupabaseError(error));
      return {
        ok: false,
        error: "Database is temporarily down. Please wait 2 minutes and try again.",
        status: 503,
      };
    }
    if (error.code !== "PGRST116") {
      console.error("Staff login: user lookup error:", error.code, error.message?.slice?.(0, 200));
    }
    return { ok: false, error: "Invalid email or password", status: 401 };
  }

  if (!user?.is_active) {
    return { ok: false, error: "Account is inactive. Contact your administrator.", status: 403 };
  }

  if (!user.password_hash) {
    return { ok: false, error: "Password not set. Contact your administrator.", status: 401 };
  }

  const isValidPassword = await bcrypt.compare(normalizedPassword, user.password_hash);
  if (!isValidPassword) {
    return { ok: false, error: "Invalid email or password", status: 401 };
  }

  await getServiceRoleSupabase()
    .from("users")
    .update({ last_login: new Date().toISOString() })
    .eq("id", user.id);

  const userData = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    store_id: user.store_id,
    store_name: null,
    store_code: null,
    phone: user.phone,
    force_password_change: user.force_password_change || false,
    assigned_stores: [],
  };

  const token = await createToken(userData, { rememberMe });
  return { ok: true, userData, token, rememberMe };
}

export function applyAuthCookie(response, token, { rememberMe = true } = {}) {
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  };
  if (rememberMe) {
    options.maxAge = TOKEN_MAX_AGE;
  } else {
    options.maxAge = SESSION_MAX_AGE;
  }
  response.cookies.set("auth-token", token, options);
  return response;
}

export function mapLoginException(error) {
  const msg = error instanceof Error ? error.message : String(error);
  if (isSupabaseInfraError(error)) {
    return {
      error: "Database is temporarily down. Please wait 2 minutes and try again.",
      status: 503,
    };
  }
  const isSupabaseConfigError =
    msg.includes("NEXT_PUBLIC_SUPABASE_URL") ||
    msg.includes("SUPABASE_SERVICE_ROLE_KEY") ||
    msg.includes("supabaseUrl is required");
  if (isSupabaseConfigError) {
    return {
      error:
        process.env.NODE_ENV === "development"
          ? "Server misconfigured: add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local."
          : "Sign-in is temporarily unavailable. Please try again later.",
      status: 503,
    };
  }
  if (msg.includes("JWT_SECRET") || msg.includes("NEXTAUTH_SECRET")) {
    return {
      error:
        process.env.NODE_ENV === "development"
          ? "Server misconfigured: set JWT_SECRET or NEXTAUTH_SECRET in .env.local."
          : "Sign-in is temporarily unavailable. Please try again later.",
      status: 503,
    };
  }
  return {
    error: process.env.NODE_ENV === "development" ? `Authentication failed (${msg})` : "Authentication failed",
    status: 500,
  };
}
