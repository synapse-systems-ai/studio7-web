import { NextResponse } from "next/server";
import { authenticateWithRole } from "@/lib/api-auth";
import { getServiceRoleSupabase } from "@/lib/supabase-service-lazy";
import { PROMOTIONS_ACCESS_ROLES } from "@/lib/promotions-auth";
import { PROMO_BRAND_420, PROMO_BRAND_STUDIO7 } from "@/lib/promo-brands";
import { aggregatePromoCodeUsage } from "@/lib/promo-usage-stats";

function parseBrand(value) {
  return value === PROMO_BRAND_STUDIO7 ? PROMO_BRAND_STUDIO7 : PROMO_BRAND_420;
}

/** GET /api/admin/promotions/promo-usage?brand=studio7 */
export async function GET(request) {
  const { error } = await authenticateWithRole(request, PROMOTIONS_ACCESS_ROLES);
  if (error) return error;

  const brand = parseBrand(new URL(request.url).searchParams.get("brand"));
  const supabase = getServiceRoleSupabase();

  const { data: campaigns, error: campErr } = await supabase
    .from("promo_campaigns")
    .select("id, name, promo_code, is_active")
    .eq("brand", brand);

  if (campErr) return NextResponse.json({ error: campErr.message }, { status: 500 });

  const ids = (campaigns || []).map((c) => c.id);
  if (!ids.length) {
    return NextResponse.json({ promo_usage: [] });
  }

  const { data: signups, error: signupsErr } = await supabase
    .from("promo_signups")
    .select("campaign_id, redeemed_at, cancelled_at, expires_at, created_at")
    .in("campaign_id", ids);

  if (signupsErr) return NextResponse.json({ error: signupsErr.message }, { status: 500 });

  return NextResponse.json({
    promo_usage: aggregatePromoCodeUsage(campaigns, signups),
  });
}
