import { NextResponse } from "next/server";
import { getServiceRoleSupabase } from "@/lib/supabase-service-lazy";
import { normalizeInstagramHandle, isValidInstagramHandle } from "@/lib/promo-instagram";
import { resolveInstagramVerificationStatus } from "@/lib/promo-instagram-verification";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const account = normalizeInstagramHandle(searchParams.get("account") || "studio7.rsa");
  const handle = normalizeInstagramHandle(searchParams.get("handle") || "");

  if (!isValidInstagramHandle(handle)) {
    return NextResponse.json({
      status: "invalid_handle",
      message: "Enter a valid Instagram handle.",
      follows: false,
    });
  }

  const supabase = getServiceRoleSupabase();
  const result = await resolveInstagramVerificationStatus(supabase, account, handle);

  return NextResponse.json({
    status: result.status,
    message: result.message,
    follows: result.status === "verified",
    simulated: result.simulated === true,
    handle,
    account,
  });
}
