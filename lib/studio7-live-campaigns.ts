import { getServiceRoleSupabase } from "@/lib/supabase-service-lazy";
import { PROMO_BRAND_STUDIO7 } from "@/lib/promo-brands";
import { campaignIsLive } from "@/lib/promo-campaign-live";

export type Studio7CampaignLink = {
  slug: string;
  headline: string | null;
  name: string | null;
};

/** Live Studio 7 campaigns for dev/homepage links (server-only). */
export async function listLiveStudio7Campaigns(): Promise<Studio7CampaignLink[]> {
  try {
    const supabase = getServiceRoleSupabase();
    const { data, error } = await supabase
      .from("promo_campaigns")
      .select("slug, name, headline, is_active, starts_at, ends_at")
      .eq("brand", PROMO_BRAND_STUDIO7)
      .eq("is_active", true)
      .order("starts_at", { ascending: false, nullsFirst: false });

    if (error) {
      console.error("[studio7 campaigns list]", error.message);
      return [];
    }

    return (data || [])
      .filter((row) => campaignIsLive(row))
      .map((row) => ({
        slug: row.slug,
        headline: row.headline,
        name: row.name,
      }));
  } catch {
    return [];
  }
}
