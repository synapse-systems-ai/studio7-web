import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getServiceRoleSupabase } from "@/lib/supabase-service-lazy";
import { applyAuthCookie, authenticateStaffCredentials } from "@/lib/staff-login";
import { authenticateWithRole } from "@/lib/api-auth";
import { PROMOTIONS_ADMIN_ONLY_ROLES } from "@/lib/promotions-auth";

const STUDIO7_ROLES = new Set(["admin", "marketing", "store_manager"]);

async function canBootstrapAdmin() {
  if (process.env.STUDIO7_ALLOW_BOOTSTRAP_SIGNUP === "true") return true;
  const { count, error } = await getServiceRoleSupabase()
    .from("users")
    .select("id", { count: "exact", head: true })
    .in("role", ["admin", "marketing"]);
  if (error) return false;
  return (count ?? 0) === 0;
}

/** Bootstrap first admin or create user (admin-only after bootstrap). */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const role = String(body.role || "admin").toLowerCase();

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }
  if (!STUDIO7_ROLES.has(role)) {
    return NextResponse.json({ error: "Invalid role for Studio 7 admin" }, { status: 400 });
  }

  const bootstrap = await canBootstrapAdmin();

  if (!bootstrap) {
    const { user, error } = await authenticateWithRole(request, PROMOTIONS_ADMIN_ONLY_ROLES);
    if (error) return error;
    if (!user) {
      return NextResponse.json({ error: "Admin authentication required" }, { status: 403 });
    }
  }

  const supabase = getServiceRoleSupabase();
  const { data: existing } = await supabase.from("users").select("id").eq("email", email).maybeSingle();
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const password_hash = await bcrypt.hash(password, 10);
  const { data: created, error: insertErr } = await supabase
    .from("users")
    .insert({
      name,
      email,
      password_hash,
      role,
      is_active: true,
    })
    .select("id, email, name, role")
    .single();

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  if (bootstrap) {
    const login = await authenticateStaffCredentials(email, password);
    if (login.ok) {
      const response = NextResponse.json({
        success: true,
        user: created,
        bootstrap: true,
        ...(process.env.NODE_ENV === "development" ? { token: login.token } : {}),
      });
      applyAuthCookie(response, login.token);
      return response;
    }
  }

  return NextResponse.json({ success: true, user: created }, { status: 201 });
}
