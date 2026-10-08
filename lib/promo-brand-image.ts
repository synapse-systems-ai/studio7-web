const VIDEO_EXT = /\.(mp4|webm|mov)(\?|$)/i;

export function isPromoVideoUrl(url: string) {
  return Boolean(url && VIDEO_EXT.test(url));
}

export type PromoHero =
  | { type: "video"; url: string }
  | { type: "image"; url: string }
  | { type: "gradient"; url: null };

export function getPromoCampaignHero(campaign: { image_url?: string | null } | null): PromoHero {
  const url = String(campaign?.image_url || "").trim();
  if (url) {
    return { url, type: isPromoVideoUrl(url) ? "video" : "image" };
  }
  return { type: "gradient", url: null };
}

export function getPromoCampaignPreviewImage(campaign: { image_url?: string | null } | null) {
  const url = String(campaign?.image_url || "").trim();
  if (url && !isPromoVideoUrl(url)) return url;
  return null;
}
