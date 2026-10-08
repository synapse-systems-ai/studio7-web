import { NextResponse } from "next/server";
import { authenticateWithRole } from "@/lib/api-auth";
import { getServiceRoleSupabase } from "@/lib/supabase-service-lazy";
import { PROMOTIONS_ADMIN_ONLY_ROLES } from "@/lib/promotions-auth";
import { getPromoSignupStatus } from "@/lib/promo-signup";

/** POST /api/admin/promotions/[campaignId]/signups/[signupId]/cancel - admin voids a promo code */
export async function POST(request, { params }) {
  const { user, error } = await authenticateWithRole(request, PROMOTIONS_ADMIN_ONLY_ROLES);
  if (error) return error;

  const { campaignId, signupId } = await params;
  const supabase = getServiceRoleSupabase();

  const { data: signup, error: fetchErr } = await supabase
    .from("promo_signups")
    .select("id, campaign_id, name, discount_code, redeemed_at, cancelled_at, expires_at, created_at")
    .eq("id", signupId)
    .eq("campaign_id", campaignId)
    .maybeSingle();

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  if (!signup) return NextResponse.json({ error: "Signup not found" }, { status: 404 });

  const status = getPromoSignupStatus(signup);
  if (status === "cancelled") {
    return NextResponse.json({ error: "This signup is already cancelled" }, { status: 400 });
  }
  if (status === "used") {
    return NextResponse.json({ error: "Cannot cancel a promo that has already been used" }, { status: 400 });
  }

  const cancelledAt = new Date().toISOString();
  const { data: updated, error: updateErr } = await supabase
    .from("promo_signups")
    .update({
      cancelled_at: cancelledAt,
      cancelled_by: user.id,
    })
    .eq("id", signupId)
    .eq("campaign_id", campaignId)
    .select(
      "id, name, email, phone, contact_method, discount_code, redeemed_at, cancelled_at, expires_at, created_at",
    )
    .single();

  if (updateErr) {
    const msg = updateErr.message || "Update failed";
    if (/cancelled_by|schema cache/i.test(msg)) {
      return NextResponse.json(
        {
          error:
            "Database missing promo_signups.cancelled_by. Run supabase/patch_promo_signups_cancelled_by.sql in Supabase SQL Editor, reload schema, retry.",
        },
        { status: 500 },
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({
    signup: {
      ...updated,
      status: getPromoSignupStatus(updated),
    },
  });
}
