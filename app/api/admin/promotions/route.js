import { NextResponse } from "next/server";
import { authenticateWithRole } from "@/lib/api-auth";
import { getServiceRoleSupabase } from "@/lib/supabase-service-lazy";
import { PROMOTIONS_ACCESS_ROLES } from "@/lib/promotions-auth";
import { PROMO_BRAND_420, PROMO_BRAND_STUDIO7, getPromoBrand } from "@/lib/promo-brands";
import {
  PROMO_CAMPAIGN_FORMAT_GUEST_LIST,
  PROMO_CAMPAIGN_FORMAT_INSTAGRAM,
} from "@/lib/promo-campaign-format";
import { normalizeInstagramHandle } from "@/lib/promo-instagram";
import { getSupabaseProjectLabel } from "@/lib/supabase-project-label";
import { summarizePromoSignups } from "@/lib/promo-usage-stats";
import { generateQrShortCode } from "@/lib/promo-qr";

function parseBrand(value) {
  return value === PROMO_BRAND_STUDIO7 ? PROMO_BRAND_STUDIO7 : PROMO_BRAND_420;
}

/** GET /api/admin/promotions - list campaigns with signup counts */
export async function GET(request) {
  const { user, error } = await authenticateWithRole(request, PROMOTIONS_ACCESS_ROLES);
  if (error) return error;

  const brand = parseBrand(new URL(request.url).searchParams.get("brand"));
  const supabase = getServiceRoleSupabase();

  const { data: campaigns, error: campErr } = await supabase
    .from("promo_campaigns")
    .select("*")
    .eq("brand", brand)
    .order("created_at", { ascending: false });

  if (campErr) return NextResponse.json({ error: campErr.message }, { status: 500 });

  const campaignIds = (campaigns || []).map((c) => c.id);
  let signups = [];
  if (campaignIds.length) {
    const { data: signupRows, error: signupsErr } = await supabase
      .from("promo_signups")
      .select("campaign_id, redeemed_at, cancelled_at, expires_at, created_at")
      .in("campaign_id", campaignIds);
    if (signupsErr) return NextResponse.json({ error: signupsErr.message }, { status: 500 });
    signups = signupRows || [];
  }

  const signupsByCampaign = {};
  for (const row of signups) {
    if (!signupsByCampaign[row.campaign_id]) signupsByCampaign[row.campaign_id] = [];
    signupsByCampaign[row.campaign_id].push(row);
  }

  return NextResponse.json({
    campaigns: (campaigns || []).map((c) => {
      const stats = summarizePromoSignups(signupsByCampaign[c.id] || []);
      return {
        ...c,
        signup_count: stats.total,
        claimed_count: stats.claimed,
        redeemed_count: stats.redeemed,
      };
    }),
  });
}

function slugify(name) {
  return String(name || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** POST /api/admin/promotions - create a new campaign */
export async function POST(request) {
  const { user, error } = await authenticateWithRole(request, PROMOTIONS_ACCESS_ROLES);
  if (error) return error;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = String(body.name || "").trim();
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  const brand = parseBrand(body.brand);
  const brandConfig = getPromoBrand(brand);
  const supabase = getServiceRoleSupabase();

  const baseSlug = slugify(name) || "promo";
  let slug = baseSlug;
  for (let i = 1; i <= 20; i++) {
    const { data: existing } = await supabase.from("promo_campaigns").select("id").eq("slug", slug).maybeSingle();
    if (!existing) break;
    slug = `${baseSlug}-${i + 1}`;
  }

  const campaignFormat =
    body.campaign_format === PROMO_CAMPAIGN_FORMAT_INSTAGRAM
      ? PROMO_CAMPAIGN_FORMAT_INSTAGRAM
      : PROMO_CAMPAIGN_FORMAT_GUEST_LIST;
  const instagramUsername =
    campaignFormat === PROMO_CAMPAIGN_FORMAT_INSTAGRAM
      ? normalizeInstagramHandle(body.instagram_username || "studio7.rsa") || "studio7.rsa"
      : null;

  const defaultHeadline =
    campaignFormat === PROMO_CAMPAIGN_FORMAT_INSTAGRAM
      ? "Get your Instagram discount"
      : brandConfig.defaultHeadline;
  const defaultDescription =
    campaignFormat === PROMO_CAMPAIGN_FORMAT_INSTAGRAM
      ? "Follow us on Instagram to unlock your discounted ticket link."
      : brandConfig.defaultDescription;

  let qr_short_code = null;
  for (let i = 0; i < 10 && !qr_short_code; i++) {
    const candidate = generateQrShortCode();
    const { data: taken } = await supabase
      .from("promo_campaigns")
      .select("id")
      .eq("qr_short_code", candidate)
      .maybeSingle();
    if (!taken) qr_short_code = candidate;
  }
  if (!qr_short_code) {
    return NextResponse.json({ error: "Could not allocate QR short code" }, { status: 500 });
  }

  const { data: campaign, error: insertErr } = await supabase
    .from("promo_campaigns")
    .insert({
      slug,
      name,
      brand,
      campaign_format: campaignFormat,
      instagram_username: instagramUsername,
      headline: body.headline || defaultHeadline,
      description: body.description ?? defaultDescription,
      discount_percent: body.discount_percent || 10,
      terms_text: body.terms_text || null,
      is_active: true,
      created_by: user.id,
      qr_short_code,
    })
    .select()
    .single();

  if (insertErr) {
    const msg = insertErr.message || "Insert failed";
    if (/campaign_format|schema cache/i.test(msg)) {
      const project = getSupabaseProjectLabel();
      return NextResponse.json(
        {
          error: `This app is using Supabase project "${project}". Run supabase/patch_campaign_format_columns.sql in THAT project's SQL Editor (not a different Supabase project), then Settings → API → Reload schema. Raw: ${msg}`,
        },
        { status: 500 },
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ campaign }, { status: 201 });
}
