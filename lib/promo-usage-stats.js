import { getPromoSignupStatus } from "@/lib/promo-signup";

export function summarizePromoSignups(signups) {
  let claimed = 0;
  let redeemed = 0;
  let cancelled = 0;
  let expired = 0;
  let ongoing = 0;

  for (const s of signups || []) {
    const status = getPromoSignupStatus(s);
    if (status === "cancelled") {
      cancelled += 1;
      continue;
    }
    claimed += 1;
    if (status === "used") redeemed += 1;
    else if (status === "expired") expired += 1;
    else if (status === "ongoing") ongoing += 1;
  }

  return { claimed, redeemed, cancelled, expired, ongoing, total: (signups || []).length };
}

/** Group campaigns/signups by configured promo_code (uppercase). */
export function aggregatePromoCodeUsage(campaigns, signups) {
  const campaignById = new Map((campaigns || []).map((c) => [c.id, c]));
  const buckets = new Map();

  const ensure = (code) => {
    const key = code || "";
    if (!buckets.has(key)) {
      buckets.set(key, {
        promo_code: key || null,
        label: key || "No code set",
        campaigns: [],
        campaign_ids: new Set(),
        claimed: 0,
        redeemed: 0,
        cancelled: 0,
      });
    }
    return buckets.get(key);
  };

  for (const c of campaigns || []) {
    const code = String(c.promo_code || "").trim().toUpperCase();
    const bucket = ensure(code);
    if (!bucket.campaign_ids.has(c.id)) {
      bucket.campaign_ids.add(c.id);
      bucket.campaigns.push({ id: c.id, name: c.name, is_active: c.is_active });
    }
  }

  for (const s of signups || []) {
    const camp = campaignById.get(s.campaign_id);
    const code = String(camp?.promo_code || "").trim().toUpperCase();
    const bucket = ensure(code);
    const status = getPromoSignupStatus(s);
    if (status === "cancelled") bucket.cancelled += 1;
    else {
      bucket.claimed += 1;
      if (status === "used") bucket.redeemed += 1;
    }
  }

  return [...buckets.values()]
    .map((b) => ({
      promo_code: b.promo_code,
      label: b.label,
      campaigns: b.campaigns,
      claimed: b.claimed,
      redeemed: b.redeemed,
      cancelled: b.cancelled,
    }))
    .sort((a, b) => b.claimed - a.claimed || String(a.label).localeCompare(String(b.label)));
}
