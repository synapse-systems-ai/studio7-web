import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getServiceRoleSupabase } from "@/lib/supabase-service-lazy";
import { verifyToken } from "@/lib/jwt-auth";

export async function POST(request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 });
    }

    if (String(password).length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const payload = await verifyToken(token);
    if (!payload || payload.type !== "password_reset") {
      return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 401 });
    }

    const hashedPassword = await bcrypt.hash(String(password), 12);
    const { error } = await getServiceRoleSupabase()
      .from("users")
      .update({
        password_hash: hashedPassword,
        force_password_change: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payload.id);

    if (error) {
      console.error("Password update error:", error);
      return NextResponse.json({ error: "Failed to update password" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Password update error:", error);
    return NextResponse.json({ error: "Failed to update password" }, { status: 500 });
  }
}
