import { NextResponse } from "next/server";
import { authenticateWithRole } from "@/lib/api-auth";
import { getServiceRoleSupabase } from "@/lib/supabase-service-lazy";
import { PROMOTIONS_ACCESS_ROLES } from "@/lib/promotions-auth";
import {
  insertPromoHeroSlide,
  listPromoHeroSlides,
  seedBundledPromoHeroSlides,
} from "@/lib/promo-hero-slides";
import { PROMO_BRAND_STUDIO7 } from "@/lib/promo-brands";

/** GET /api/admin/promotions/hero-slides */
export async function GET(request) {
  const { error } = await authenticateWithRole(request, PROMOTIONS_ACCESS_ROLES);
  if (error) return error;

  const supabase = getServiceRoleSupabase();
  const result = await listPromoHeroSlides(supabase, PROMO_BRAND_STUDIO7);
  return NextResponse.json({
    slides: result.slides,
    customized: result.customized,
    tableMissing: result.tableMissing ?? false,
  });
}

/** POST /api/admin/promotions/hero-slides — add slide or seed bundled defaults */
export async function POST(request) {
  const { error } = await authenticateWithRole(request, PROMOTIONS_ACCESS_ROLES);
  if (error) return error;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const supabase = getServiceRoleSupabase();

  if (body.action === "seed") {
    const seed = await seedBundledPromoHeroSlides(supabase, PROMO_BRAND_STUDIO7);
    if (!seed.ok) {
      return NextResponse.json({ error: seed.error }, { status: 500 });
    }
    const listed = await listPromoHeroSlides(supabase, PROMO_BRAND_STUDIO7);
    return NextResponse.json({
      success: true,
      seeded: seed.seeded,
      slides: listed.slides,
      customized: listed.customized,
    });
  }

  const image_url = String(body.image_url || "").trim();
  if (!image_url) {
    return NextResponse.json({ error: "image_url is required" }, { status: 400 });
  }

  const listed = await listPromoHeroSlides(supabase, PROMO_BRAND_STUDIO7);
  if (!listed.customized) {
    await seedBundledPromoHeroSlides(supabase, PROMO_BRAND_STUDIO7);
  }

  const inserted = await insertPromoHeroSlide(supabase, PROMO_BRAND_STUDIO7, {
    image_url,
    alt_text: body.alt_text,
  });
  if (!inserted.ok) {
    return NextResponse.json({ error: inserted.error }, { status: 500 });
  }

  const after = await listPromoHeroSlides(supabase, PROMO_BRAND_STUDIO7);
  return NextResponse.json({
    success: true,
    slide: inserted.slide,
    slides: after.slides,
    customized: after.customized,
  });
}
