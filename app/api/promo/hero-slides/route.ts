import { NextResponse } from "next/server";
import { getServiceRoleSupabase } from "@/lib/supabase-service-lazy";
import { listPromoHeroSlides } from "@/lib/promo-hero-slides";
import { PROMO_BRAND_STUDIO7 } from "@/lib/promo-brands";

/** GET /api/promo/hero-slides — rotating hero photos for public promo pages */
export async function GET() {
  const supabase = getServiceRoleSupabase();
  const { slides } = await listPromoHeroSlides(supabase, PROMO_BRAND_STUDIO7);
  return NextResponse.json({
    slides: slides.map(({ src, alt }) => ({ src, alt })),
  });
}
