const PROMO_CODE_RE = /^[A-Za-z0-9_-]{3,40}$/;

export function normalizeCampaignPromoCode(raw: unknown): string | null {
  const code = String(raw ?? "").trim();
  if (!code || !PROMO_CODE_RE.test(code)) return null;
  return code.toUpperCase();
}

export function campaignPromoCodeOrError(campaign: { promo_code?: string | null }):
  | { ok: true; code: string }
  | { ok: false; error: string } {
  const code = normalizeCampaignPromoCode(campaign.promo_code);
  if (!code) {
    return {
      ok: false,
      error: "This promotion is missing a promo code. Ask the team to configure the campaign.",
    };
  }
  return { ok: true, code };
}
