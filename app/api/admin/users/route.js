import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { authenticateWithRole } from "@/lib/api-auth";
import { getServiceRoleSupabase } from "@/lib/supabase-service-lazy";
import { PROMOTIONS_ACCESS_ROLES, PROMOTIONS_ADMIN_ONLY_ROLES } from "@/lib/promotions-auth";

const STUDIO7_ROLES = ["admin", "marketing", "store_manager"];

export async function GET(request) {
  const { error } = await authenticateWithRole(request, PROMOTIONS_ACCESS_ROLES);
  if (error) return error;

  const { data, error: listErr } = await getServiceRoleSupabase()
    .from("users")
    .select("id, email, name, role, phone, is_active, created_at, last_login")
    .in("role", STUDIO7_ROLES)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (listErr) return NextResponse.json({ error: listErr.message }, { status: 500 });
  return NextResponse.json({ users: data || [] });
}

export async function POST(request) {
  const { error } = await authenticateWithRole(request, PROMOTIONS_ADMIN_ONLY_ROLES);
  if (error) return error;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const role = String(body.role || "marketing").toLowerCase();

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
  }
  if (!STUDIO7_ROLES.includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const supabase = getServiceRoleSupabase();
  const { data: existing } = await supabase.from("users").select("id").eq("email", email).maybeSingle();
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const password_hash = await bcrypt.hash(password, 10);
  const { data: user, error: insertErr } = await supabase
    .from("users")
    .insert({
      name,
      email,
      password_hash,
      role,
      is_active: body.is_active !== false,
      phone: body.phone ? String(body.phone).trim() : null,
    })
    .select("id, email, name, role, phone, is_active, created_at")
    .single();

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });
  return NextResponse.json({ user }, { status: 201 });
}
