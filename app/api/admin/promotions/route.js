import { NextResponse } from "next/server";
import { authenticateWithRole } from "@/lib/api-auth";
import { getServiceRoleSupabase } from "@/lib/supabase-service-lazy";
import { PROMOTIONS_ACCESS_ROLES } from "@/lib/promotions-auth";
import { PROMO_BRAND_420, PROMO_BRAND_STUDIO7, getPromoBrand } from "@/lib/promo-brands";

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

  const { data: signupCounts } = await supabase.from("promo_signups").select("campaign_id");

  const countsById = {};
  for (const row of signupCounts || []) {
    countsById[row.campaign_id] = (countsById[row.campaign_id] || 0) + 1;
  }

  return NextResponse.json({
    campaigns: (campaigns || []).map((c) => ({ ...c, signup_count: countsById[c.id] || 0 })),
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

  const { data: campaign, error: insertErr } = await supabase
    .from("promo_campaigns")
    .insert({
      slug,
      name,
      brand,
      headline: body.headline || brandConfig.defaultHeadline,
      description: body.description ?? brandConfig.defaultDescription,
      // No image_url - every campaign uses the fixed brand photo (lib/promo-brand-image.js).
      discount_percent: body.discount_percent || 10,
      terms_text: body.terms_text || null,
      is_active: true,
      created_by: user.id,
    })
    .select()
    .single();

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

  return NextResponse.json({ campaign }, { status: 201 });
}
