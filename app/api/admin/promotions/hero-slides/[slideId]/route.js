import { NextResponse } from "next/server";
import { authenticateWithRole } from "@/lib/api-auth";
import { getServiceRoleSupabase } from "@/lib/supabase-service-lazy";
import { PROMOTIONS_ACCESS_ROLES } from "@/lib/promotions-auth";
import {
  deletePromoHeroSlide,
  listPromoHeroSlides,
  updatePromoHeroSlide,
} from "@/lib/promo-hero-slides";
import { PROMO_BRAND_STUDIO7 } from "@/lib/promo-brands";

/** PATCH /api/admin/promotions/hero-slides/[slideId] */
export async function PATCH(request, { params }) {
  const { error } = await authenticateWithRole(request, PROMOTIONS_ACCESS_ROLES);
  if (error) return error;

  const { slideId } = await params;
  if (String(slideId).startsWith("bundled-")) {
    return NextResponse.json(
      { error: "Customize the gallery first (upload or import defaults)." },
      { status: 400 },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const patch = {};
  if (body.image_url != null) patch.image_url = String(body.image_url).trim();
  if (body.alt_text != null) patch.alt_text = String(body.alt_text).trim();
  if (body.sort_order != null) patch.sort_order = Number(body.sort_order);

  const supabase = getServiceRoleSupabase();
  const updated = await updatePromoHeroSlide(supabase, slideId, PROMO_BRAND_STUDIO7, patch);
  if (!updated.ok) {
    return NextResponse.json({ error: updated.error }, { status: updated.error === "Slide not found" ? 404 : 500 });
  }

  const listed = await listPromoHeroSlides(supabase, PROMO_BRAND_STUDIO7);
  return NextResponse.json({
    success: true,
    slide: updated.slide,
    slides: listed.slides,
    customized: listed.customized,
  });
}

/** DELETE /api/admin/promotions/hero-slides/[slideId] */
export async function DELETE(request, { params }) {
  const { error } = await authenticateWithRole(request, PROMOTIONS_ACCESS_ROLES);
  if (error) return error;

  const { slideId } = await params;
  if (String(slideId).startsWith("bundled-")) {
    return NextResponse.json(
      { error: "Customize the gallery first to remove individual photos." },
      { status: 400 },
    );
  }

  const supabase = getServiceRoleSupabase();
  const removed = await deletePromoHeroSlide(supabase, slideId, PROMO_BRAND_STUDIO7);
  if (!removed.ok) {
    return NextResponse.json({ error: removed.error }, { status: removed.error === "Slide not found" ? 404 : 500 });
  }

  const listed = await listPromoHeroSlides(supabase, PROMO_BRAND_STUDIO7);
  return NextResponse.json({
    success: true,
    slides: listed.slides,
    customized: listed.customized,
  });
}
