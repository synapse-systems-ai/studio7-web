export const PROMO_CODE_VALID_HOURS_DEFAULT = 24;
export const PROMO_CODE_VALID_HOURS_MAX = 8760;

export function resolvePromoCodeValidHours(
  campaignOrHours?: number | { code_valid_hours?: number | null } | null,
) {
  if (typeof campaignOrHours === "number") {
    const n = Math.floor(campaignOrHours);
    return n > 0 ? Math.min(n, PROMO_CODE_VALID_HOURS_MAX) : PROMO_CODE_VALID_HOURS_DEFAULT;
  }
  const fromCampaign = Number(campaignOrHours?.code_valid_hours);
  if (fromCampaign > 0) return Math.min(Math.floor(fromCampaign), PROMO_CODE_VALID_HOURS_MAX);
  return PROMO_CODE_VALID_HOURS_DEFAULT;
}

export function promoExpiresAtFromSignup(
  createdAt = new Date(),
  validHours = PROMO_CODE_VALID_HOURS_DEFAULT,
) {
  const hours = resolvePromoCodeValidHours(validHours);
  const d = new Date(createdAt);
  d.setHours(d.getHours() + hours);
  return d.toISOString();
}

export function formatPromoValidDuration(hours: number) {
  const h = resolvePromoCodeValidHours(hours);
  if (h % 168 === 0 && h >= 168) {
    const weeks = h / 168;
    return weeks === 1 ? "1 week" : `${weeks} weeks`;
  }
  if (h % 24 === 0 && h >= 24) {
    const days = h / 24;
    return days === 1 ? "1 day" : `${days} days`;
  }
  return h === 1 ? "1 hour" : `${h} hours`;
}

export function getPromoSignupExpiry(
  signup: { expires_at?: string | null; created_at?: string | null } | null,
  campaign?: { code_valid_hours?: number | null } | null,
) {
  if (signup?.expires_at) return new Date(signup.expires_at);
  if (signup?.created_at) {
    return new Date(
      promoExpiresAtFromSignup(new Date(signup.created_at), resolvePromoCodeValidHours(campaign)),
    );
  }
  return null;
}

export type PromoSignupStatus = "used" | "expired" | "cancelled" | "ongoing";

export function getPromoSignupStatus(
  signup: {
    redeemed_at?: string | null;
    cancelled_at?: string | null;
    expires_at?: string | null;
    created_at?: string | null;
  } | null,
  now = new Date(),
): PromoSignupStatus {
  if (!signup) return "expired";
  if (signup.cancelled_at) return "cancelled";
  if (signup.redeemed_at) return "used";
  const expires = getPromoSignupExpiry(signup);
  if (expires && now.getTime() > expires.getTime()) return "expired";
  return "ongoing";
}

export function formatPromoStatusLabel(status: PromoSignupStatus) {
  if (status === "used") return "Used";
  if (status === "expired") return "Expired";
  if (status === "cancelled") return "Cancelled";
  return "Ongoing";
}

/** Parse admin analytics date range from query string. */
export function parsePromoDateRange(searchParams: URLSearchParams) {
  const preset = searchParams.get("range") || "month";
  const customFrom = searchParams.get("from");
  const customTo = searchParams.get("to");
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  if (preset === "custom" && customFrom) {
    const start = new Date(`${customFrom}T00:00:00`);
    const to = customTo ? new Date(`${customTo}T23:59:59.999`) : end;
    return {
      preset,
      from: start.toISOString(),
      to: to.toISOString(),
      fromYmd: customFrom,
      toYmd: customTo || customFrom,
    };
  }

  const days =
    preset === "week" ? 7 : preset === "2weeks" ? 14 : preset === "3months" ? 90 : 30;

  const start = new Date(now);
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);

  return {
    preset,
    from: start.toISOString(),
    to: end.toISOString(),
    fromYmd: start.toISOString().slice(0, 10),
    toYmd: end.toISOString().slice(0, 10),
  };
}
