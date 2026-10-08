import { NextResponse } from "next/server";
import { applyAuthCookie, authenticateStaffCredentials, mapLoginException } from "@/lib/staff-login";
import { getPostLoginPath } from "@/lib/staff-login-utils";
import { hasPromotionsAccess } from "@/lib/promotions-auth";

export async function POST(request) {
  try {
    const { email, password, callbackUrl, rememberMe } = await request.json();
    const remember = rememberMe !== false;
    const result = await authenticateStaffCredentials(email, password, { rememberMe: remember });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    if (!hasPromotionsAccess(result.userData)) {
      return NextResponse.json(
        { error: "Your account does not have access to Studio 7 admin." },
        { status: 403 },
      );
    }

    const response = NextResponse.json({
      success: true,
      user: result.userData,
      redirectTo: getPostLoginPath(result.userData.role, callbackUrl),
      ...(process.env.NODE_ENV === "development" ? { token: result.token } : {}),
    });

    applyAuthCookie(response, result.token, { rememberMe: remember });
    return response;
  } catch (error) {
    console.error("Login error:", error);
    const mapped = mapLoginException(error);
    return NextResponse.json({ error: mapped.error }, { status: mapped.status });
  }
}
