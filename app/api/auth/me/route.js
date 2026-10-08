import { NextResponse } from "next/server";
import { getServiceRoleSupabase } from "@/lib/supabase-service-lazy";
import { verifyToken } from "@/lib/jwt-auth";
import { summarizeSupabaseError } from "@/lib/supabase-postgrest-errors";

function getTokenFromRequest(request) {
  const cookieToken = request.cookies.get("auth-token")?.value;
  if (cookieToken) return cookieToken;
  if (process.env.NODE_ENV === "development") {
    const auth = request.headers.get("authorization");
    if (auth?.startsWith("Bearer ")) return auth.slice(7);
  }
  return null;
}

export async function GET(request) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { data: user, error: userError } = await getServiceRoleSupabase()
      .from("users")
      .select("id, email, name, role, phone, is_active, force_password_change")
      .eq("id", payload.id)
      .maybeSingle();

    if (userError) {
      console.error("GET /api/auth/me user lookup error:", summarizeSupabaseError(userError));
      return NextResponse.json({ error: "Failed to load user" }, { status: 503 });
    }

    if (!user?.is_active) {
      return NextResponse.json({ error: "User not found or inactive" }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        force_password_change: user.force_password_change || false,
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json({ error: "Failed to get user" }, { status: 500 });
  }
}
