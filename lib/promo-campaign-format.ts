export const PROMO_CAMPAIGN_FORMAT_GUEST_LIST = "guest_list" as const;
export const PROMO_CAMPAIGN_FORMAT_INSTAGRAM = "instagram" as const;

export type PromoCampaignFormat =
  | typeof PROMO_CAMPAIGN_FORMAT_GUEST_LIST
  | typeof PROMO_CAMPAIGN_FORMAT_INSTAGRAM;

export const PROMO_CAMPAIGN_FORMAT_OPTIONS: {
  value: PromoCampaignFormat;
  label: string;
  description: string;
}[] = [
  {
    value: PROMO_CAMPAIGN_FORMAT_GUEST_LIST,
    label: "Guest list",
    description: "Name, email, and phone — confirmation email with code.",
  },
  {
    value: PROMO_CAMPAIGN_FORMAT_INSTAGRAM,
    label: "Instagram",
    description: "Instagram handle — follow account to unlock a discounted ticket link.",
  },
];

export function parsePromoCampaignFormat(value: unknown): PromoCampaignFormat {
  return value === PROMO_CAMPAIGN_FORMAT_INSTAGRAM
    ? PROMO_CAMPAIGN_FORMAT_INSTAGRAM
    : PROMO_CAMPAIGN_FORMAT_GUEST_LIST;
}

export function isInstagramPromoCampaign(campaign: { campaign_format?: string | null }) {
  return parsePromoCampaignFormat(campaign?.campaign_format) === PROMO_CAMPAIGN_FORMAT_INSTAGRAM;
}

export function formatCampaignFormatLabel(format: unknown) {
  return parsePromoCampaignFormat(format) === PROMO_CAMPAIGN_FORMAT_INSTAGRAM ? "Instagram" : "Guest list";
}
