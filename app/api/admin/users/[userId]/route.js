import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { authenticateWithRole } from "@/lib/api-auth";
import { getServiceRoleSupabase } from "@/lib/supabase-service-lazy";
import { PROMOTIONS_ADMIN_ONLY_ROLES } from "@/lib/promotions-auth";

export async function DELETE(request, { params }) {
  const { user: actor, error } = await authenticateWithRole(request, PROMOTIONS_ADMIN_ONLY_ROLES);
  if (error) return error;

  const { userId } = await params;
  if (String(actor.id) === String(userId)) {
    return NextResponse.json({ error: "You cannot remove your own account" }, { status: 403 });
  }

  const { data, error: updErr } = await getServiceRoleSupabase()
    .from("users")
    .update({ is_active: false })
    .eq("id", userId)
    .select("id, email, name")
    .maybeSingle();

  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({ success: true, user: data });
}

export async function PATCH(request, { params }) {
  const { error } = await authenticateWithRole(request, PROMOTIONS_ADMIN_ONLY_ROLES);
  if (error) return error;

  const { userId } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const patch = {};
  if (body.name !== undefined) patch.name = String(body.name).trim();
  if (body.role !== undefined) patch.role = String(body.role).toLowerCase();
  if (body.phone !== undefined) patch.phone = body.phone ? String(body.phone).trim() : null;
  if (body.is_active !== undefined) patch.is_active = Boolean(body.is_active);
  if (body.password) {
    patch.password_hash = await bcrypt.hash(String(body.password), 10);
  }

  if (!Object.keys(patch).length) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { data, error: updErr } = await getServiceRoleSupabase()
    .from("users")
    .update(patch)
    .eq("id", userId)
    .select("id, email, name, role, phone, is_active")
    .single();

  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });
  return NextResponse.json({ user: data });
}
