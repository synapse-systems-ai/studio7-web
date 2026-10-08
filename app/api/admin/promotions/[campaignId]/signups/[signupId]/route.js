import { NextResponse } from "next/server";
import { authenticateWithRole } from "@/lib/api-auth";
import { getServiceRoleSupabase } from "@/lib/supabase-service-lazy";
import { PROMOTIONS_ADMIN_ONLY_ROLES } from "@/lib/promotions-auth";
import { getPromoSignupStatus } from "@/lib/promo-signup";

/** DELETE /api/admin/promotions/[campaignId]/signups/[signupId] - only once cancelled */
export async function DELETE(request, { params }) {
  const { error } = await authenticateWithRole(request, PROMOTIONS_ADMIN_ONLY_ROLES);
  if (error) return error;

  const { campaignId, signupId } = await params;
  const supabase = getServiceRoleSupabase();

  const { data: existing, error: fetchErr } = await supabase
    .from("promo_signups")
    .select("id, redeemed_at, cancelled_at, expires_at, created_at")
    .eq("id", signupId)
    .eq("campaign_id", campaignId)
    .maybeSingle();

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  if (!existing) return NextResponse.json({ error: "Signup not found" }, { status: 404 });

  const status = getPromoSignupStatus(existing);
  if (status !== "cancelled") {
    return NextResponse.json({ error: "Cancel this signup before deleting it" }, { status: 400 });
  }

  const { error: deleteErr } = await supabase
    .from("promo_signups")
    .delete()
    .eq("id", signupId)
    .eq("campaign_id", campaignId);

  if (deleteErr) return NextResponse.json({ error: deleteErr.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
