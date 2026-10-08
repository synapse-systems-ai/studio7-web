import { NextResponse } from "next/server";
import { getServiceRoleSupabase } from "@/lib/supabase-service-lazy";
import { getPromoSignupStatus } from "@/lib/promo-signup";
import { PROMO_BRAND_STUDIO7 } from "@/lib/promo-brands";

/** GET /api/promo/view/[token] - Studio 7 personal promo page data */
export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  if (!token) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const supabase = getServiceRoleSupabase();

  const { data: signup, error } = await supabase
    .from("promo_signups")
    .select(
      "id, name, discount_code, redeemed_at, cancelled_at, expires_at, created_at, promo_campaigns(headline, description, discount_percent, terms_text, slug, image_url, code_valid_hours, brand)",
    )
    .eq("access_token", token)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!signup) return NextResponse.json({ error: "Promo not found" }, { status: 404 });

  const campaignRaw = signup.promo_campaigns as {
    headline?: string;
    description?: string;
    discount_percent?: number;
    terms_text?: string;
    slug?: string;
    image_url?: string;
    code_valid_hours?: number;
    brand?: string;
  } | null;

  if (!campaignRaw || campaignRaw.brand !== PROMO_BRAND_STUDIO7) {
    return NextResponse.json({ error: "Promo not found" }, { status: 404 });
  }

  const status = getPromoSignupStatus(signup);

  return NextResponse.json({
    signup: {
      name: signup.name,
      discount_code: signup.discount_code,
      expires_at: signup.expires_at,
      status,
      created_at: signup.created_at,
    },
    campaign: {
      headline: campaignRaw.headline,
      description: campaignRaw.description,
      discount_percent: campaignRaw.discount_percent,
      terms_text: campaignRaw.terms_text,
      slug: campaignRaw.slug,
      image_url: campaignRaw.image_url,
      code_valid_hours: campaignRaw.code_valid_hours,
    },
    stores: [],
  });
}
