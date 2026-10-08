import type { SupabaseClient } from "@supabase/supabase-js";
import { generateQrShortCode, normalizeQrShortCode } from "@/lib/promo-qr";

type CampaignRow = { id: string; qr_short_code?: string | null };

export async function ensureCampaignQrShortCode(
  supabase: SupabaseClient,
  campaign: CampaignRow | null,
): Promise<CampaignRow | null> {
  if (!campaign) return null;
  const existing = normalizeQrShortCode(campaign.qr_short_code);
  if (existing) {
    return { ...campaign, qr_short_code: existing };
  }

  for (let attempt = 0; attempt < 8; attempt++) {
    const qr_short_code = generateQrShortCode();
    const { data, error } = await supabase
      .from("promo_campaigns")
      .update({ qr_short_code, updated_at: new Date().toISOString() })
      .eq("id", campaign.id)
      .is("qr_short_code", null)
      .select("id, qr_short_code")
      .maybeSingle();

    if (!error && data?.qr_short_code) {
      return { ...campaign, qr_short_code: data.qr_short_code };
    }

    const { data: refreshed } = await supabase
      .from("promo_campaigns")
      .select("qr_short_code")
      .eq("id", campaign.id)
      .maybeSingle();
    if (refreshed?.qr_short_code) {
      return { ...campaign, qr_short_code: refreshed.qr_short_code };
    }
  }

  return campaign;
}
