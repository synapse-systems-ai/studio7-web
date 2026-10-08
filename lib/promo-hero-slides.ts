import { STUDIO7_SITE_HERO_PHOTOS } from "@/lib/studio7-site-assets";
import { PROMO_BRAND_STUDIO7, type PromoBrandId } from "@/lib/promo-brands";
import type { SupabaseClient } from "@supabase/supabase-js";

export type PromoHeroSlide = {
  id: string;
  src: string;
  alt: string;
  sort_order: number;
};

export type PromoHeroSlideRow = {
  id: string;
  brand: string;
  image_url: string;
  alt_text: string;
  sort_order: number;
  created_at: string;
};

function bundledSlides(): PromoHeroSlide[] {
  return STUDIO7_SITE_HERO_PHOTOS.map((photo, index) => ({
    id: `bundled-${index}`,
    src: photo.src,
    alt: photo.alt,
    sort_order: index * 10,
  }));
}

function isMissingTableError(message: string) {
  return /promo_hero_slides|relation.*does not exist|schema cache/i.test(message);
}

function rowToSlide(row: PromoHeroSlideRow): PromoHeroSlide {
  return {
    id: row.id,
    src: row.image_url,
    alt: row.alt_text || "",
    sort_order: row.sort_order,
  };
}

/** Public + admin read: DB slides for brand, else bundled defaults. */
export async function listPromoHeroSlides(
  supabase: SupabaseClient,
  brand: PromoBrandId = PROMO_BRAND_STUDIO7,
): Promise<{ slides: PromoHeroSlide[]; customized: boolean; tableMissing?: boolean }> {
  const { data, error } = await supabase
    .from("promo_hero_slides")
    .select("id, brand, image_url, alt_text, sort_order, created_at")
    .eq("brand", brand)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    if (isMissingTableError(error.message)) {
      return { slides: bundledSlides(), customized: false, tableMissing: true };
    }
    console.error("[promo hero slides] list failed:", error.message);
    return { slides: bundledSlides(), customized: false };
  }

  if (!data?.length) {
    return { slides: bundledSlides(), customized: false };
  }

  return {
    slides: data.map((row) => rowToSlide(row as PromoHeroSlideRow)),
    customized: true,
  };
}

export async function seedBundledPromoHeroSlides(
  supabase: SupabaseClient,
  brand: PromoBrandId = PROMO_BRAND_STUDIO7,
) {
  const { count, error: countErr } = await supabase
    .from("promo_hero_slides")
    .select("id", { count: "exact", head: true })
    .eq("brand", brand);

  if (countErr) {
    return { ok: false as const, error: countErr.message };
  }
  if ((count ?? 0) > 0) {
    return { ok: true as const, seeded: false };
  }

  const rows = STUDIO7_SITE_HERO_PHOTOS.map((photo, index) => ({
    brand,
    image_url: photo.src,
    alt_text: photo.alt,
    sort_order: index * 10,
  }));

  const { error } = await supabase.from("promo_hero_slides").insert(rows);
  if (error) {
    return { ok: false as const, error: error.message };
  }
  return { ok: true as const, seeded: true };
}

export async function insertPromoHeroSlide(
  supabase: SupabaseClient,
  brand: PromoBrandId,
  { image_url, alt_text }: { image_url: string; alt_text?: string },
) {
  const { data: maxRow } = await supabase
    .from("promo_hero_slides")
    .select("sort_order")
    .eq("brand", brand)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const sort_order = (maxRow?.sort_order ?? -10) + 10;

  const { data, error } = await supabase
    .from("promo_hero_slides")
    .insert({
      brand,
      image_url,
      alt_text: alt_text?.trim() || "",
      sort_order,
    })
    .select("id, brand, image_url, alt_text, sort_order, created_at")
    .single();

  if (error) {
    return { ok: false as const, error: error.message };
  }
  return { ok: true as const, slide: rowToSlide(data as PromoHeroSlideRow) };
}

export async function updatePromoHeroSlide(
  supabase: SupabaseClient,
  id: string,
  brand: PromoBrandId,
  patch: { image_url?: string; alt_text?: string; sort_order?: number },
) {
  const { data, error } = await supabase
    .from("promo_hero_slides")
    .update(patch)
    .eq("id", id)
    .eq("brand", brand)
    .select("id, brand, image_url, alt_text, sort_order, created_at")
    .maybeSingle();

  if (error) {
    return { ok: false as const, error: error.message };
  }
  if (!data) {
    return { ok: false as const, error: "Slide not found" };
  }
  return { ok: true as const, slide: rowToSlide(data as PromoHeroSlideRow) };
}

export async function deletePromoHeroSlide(supabase: SupabaseClient, id: string, brand: PromoBrandId) {
  const { data, error } = await supabase
    .from("promo_hero_slides")
    .delete()
    .eq("id", id)
    .eq("brand", brand)
    .select("id");

  if (error) {
    return { ok: false as const, error: error.message };
  }
  if (!data?.length) {
    return { ok: false as const, error: "Slide not found" };
  }
  return { ok: true as const };
}
