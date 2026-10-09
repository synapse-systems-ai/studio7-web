const VIDEO_EXT = /\.(mp4|webm|mov)(\?|$)/i;

export function isPromoVideoUrl(url: string) {
  return Boolean(url && VIDEO_EXT.test(url));
}

export type PromoHero =
  | { type: "video"; url: string }
  | { type: "image"; url: string }
  | { type: "gradient"; url: null };

/** Full-screen background: campaign video only; photos use the rotating gallery. */
export function getPromoCampaignHero(campaign: { image_url?: string | null } | null): PromoHero {
  const url = String(campaign?.image_url || "").trim();
  if (url && isPromoVideoUrl(url)) {
    return { url, type: "video" };
  }
  return { type: "gradient", url: null };
}

/** Event / promo artwork on the signup card (JPG, PNG, WebP, GIF). */
export function getPromoCampaignCardArt(campaign: { image_url?: string | null } | null): string | null {
  const url = String(campaign?.image_url || "").trim();
  if (url && !isPromoVideoUrl(url)) return url;
  return null;
}

export function getPromoCampaignPreviewImage(campaign: { image_url?: string | null } | null) {
  return getPromoCampaignCardArt(campaign);
}
