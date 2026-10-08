import { NextResponse } from "next/server";
import { authenticateWithRole } from "@/lib/api-auth";
import { getServiceRoleSupabase } from "@/lib/supabase-service-lazy";
import { PROMOTIONS_ACCESS_ROLES } from "@/lib/promotions-auth";
import { getPromoSignupStatus, parsePromoDateRange } from "@/lib/promo-signup";

/** GET /api/admin/promotions/[campaignId]/analytics?range=week|2weeks|month|3months|custom&from=&to=&search= */
export async function GET(request, { params }) {
  const { error } = await authenticateWithRole(request, PROMOTIONS_ACCESS_ROLES);
  if (error) return error;

  const { campaignId } = await params;
  const { searchParams } = new URL(request.url);
  const range = parsePromoDateRange(searchParams);
  const search = String(searchParams.get("search") || "")
    .trim()
    .toLowerCase();

  const supabase = getServiceRoleSupabase();

  const { data: signupsRaw, error: signupsErr } = await supabase
    .from("promo_signups")
    .select("id, name, email, phone, instagram_handle, contact_method, discount_code, redeemed_at, cancelled_at, expires_at, created_at")
    .eq("campaign_id", campaignId)
    .gte("created_at", range.from)
    .lte("created_at", range.to)
    .order("created_at", { ascending: false });

  if (signupsErr) return NextResponse.json({ error: signupsErr.message }, { status: 500 });

  let signups = (signupsRaw || []).map((s) => ({
    ...s,
    status: getPromoSignupStatus(s),
  }));

  if (search) {
    signups = signups.filter((s) => {
      const hay = [s.name, s.email, s.phone, s.instagram_handle, s.discount_code, s.status]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(search);
    });
  }

  const { count: clicksCount, error: clicksErr } = await supabase
    .from("promo_campaign_views")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", campaignId)
    .gte("created_at", range.from)
    .lte("created_at", range.to);

  if (clicksErr) return NextResponse.json({ error: clicksErr.message }, { status: 500 });

  const signupCount = signups.length;
  const clicks = clicksCount ?? 0;
  // Clicks are unique-device landing-page views; signups can exceed them
  // (shared links, a click write that failed to log) but the rate shown to
  // admins should never look like more than 100% "converted".
  const conversion_rate = clicks > 0 ? Math.min(100, Math.round((signupCount / clicks) * 1000) / 10) : null;

  return NextResponse.json({
    range,
    signups,
    clicks_count: clicks,
    signups_count: signupCount,
    conversion_rate,
  });
}
