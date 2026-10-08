import { NextResponse } from "next/server";
import { authenticateWithRole } from "@/lib/api-auth";
import { getServiceRoleSupabase } from "@/lib/supabase-service-lazy";
import { PROMOTIONS_ADMIN_ONLY_ROLES } from "@/lib/promotions-auth";
import { getPromoSignupStatus, resolvePromoCodeValidHours } from "@/lib/promo-signup";
import { getPromoPersonalUrl } from "@/lib/promo-public-url";
import { sendPromoSignupNotifications } from "@/lib/promo-notifications";

/** POST /api/admin/promotions/[campaignId]/signups/[signupId]/resend — resend the existing code by email + SMS */
export async function POST(request, { params }) {
  const { error } = await authenticateWithRole(request, PROMOTIONS_ADMIN_ONLY_ROLES);
  if (error) return error;

  const { campaignId, signupId } = await params;
  const supabase = getServiceRoleSupabase();

  const { data: signup, error: fetchErr } = await supabase
    .from("promo_signups")
    .select("id, name, email, phone, discount_code, access_token, redeemed_at, cancelled_at, expires_at, created_at")
    .eq("id", signupId)
    .eq("campaign_id", campaignId)
    .maybeSingle();

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  if (!signup) return NextResponse.json({ error: "Signup not found" }, { status: 404 });

  const status = getPromoSignupStatus(signup);
  if (status !== "ongoing") {
    return NextResponse.json({ error: "Can only resend a code that is still ongoing" }, { status: 400 });
  }

  const { data: campaign, error: campaignErr } = await supabase
    .from("promo_campaigns")
    .select("headline, discount_percent, terms_text, code_valid_hours")
    .eq("id", campaignId)
    .maybeSingle();

  if (campaignErr) return NextResponse.json({ error: campaignErr.message }, { status: 500 });

  const campaignInfo = {
    headline: campaign?.headline,
    discount_percent: campaign?.discount_percent,
    discount_code: signup.discount_code,
    terms_text: campaign?.terms_text,
    valid_hours: resolvePromoCodeValidHours(campaign),
    expires_at: signup.expires_at,
    personal_url: getPromoPersonalUrl(signup.access_token),
  };

  const { emailOk, smsOk } = await sendPromoSignupNotifications({
    name: signup.name,
    email: signup.email,
    phone: signup.phone,
    campaignInfo,
  });

  if (!emailOk && !smsOk) {
    return NextResponse.json({ error: "Failed to resend both email and SMS" }, { status: 502 });
  }

  return NextResponse.json({ success: true, emailOk, smsOk });
}
