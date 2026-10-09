import { isInstagramPromoCampaign } from "@/lib/promo-campaign-format";

/** Letters, numbers, and common checkout symbols (e.g. Howler codes like STUDIO730!). */
export const PROMO_CODE_RE = /^[A-Za-z0-9!@#$%&*._-]{3,40}$/;

export const PROMO_CODE_VALIDATION_HINT =
  "Promo code must be 3–40 characters (letters, numbers, and ! @ # $ % & * . _ -).";

/** Stored on signups when reward is a pre-discounted ticket URL (not shown to guests). */
export const INSTAGRAM_TICKET_SIGNUP_CODE = "TICKET-LINK";

export function normalizeCampaignPromoCode(raw: unknown): string | null {
  const code = String(raw ?? "").trim();
  if (!code || !PROMO_CODE_RE.test(code)) return null;
  return code;
}

export function normalizeCampaignTicketUrl(raw: unknown): string | null {
  const url = String(raw ?? "").trim();
  if (!url || !/^https?:\/\//i.test(url)) return null;
  return url;
}

export function isHiddenTicketLinkSignupCode(code: unknown) {
  return String(code ?? "").trim().toUpperCase() === INSTAGRAM_TICKET_SIGNUP_CODE;
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

export function campaignTicketUrlOrError(campaign: { ticket_url?: string | null }):
  | { ok: true; url: string }
  | { ok: false; error: string } {
  const url = normalizeCampaignTicketUrl(campaign.ticket_url);
  if (!url) {
    return {
      ok: false,
      error:
        "This promotion is missing a discounted ticket link. Ask the team to configure the campaign.",
    };
  }
  return { ok: true, url };
}

export function resolveCampaignSignupReward(campaign: {
  campaign_format?: string | null;
  promo_code?: string | null;
  ticket_url?: string | null;
}):
  | { ok: true; discountCode: string; ticketUrl: string | null; ticketLinkOnly: boolean }
  | { ok: false; error: string; status: number } {
  const configured = campaignPromoCodeOrError(campaign);
  if (!configured.ok) {
    return { ok: false, error: configured.error, status: 503 };
  }

  if (isInstagramPromoCampaign(campaign)) {
    const ticket = campaignTicketUrlOrError(campaign);
    if (!ticket.ok) {
      return { ok: false, error: ticket.error, status: 503 };
    }
    return {
      ok: true,
      discountCode: configured.code,
      ticketUrl: ticket.url,
      ticketLinkOnly: false,
    };
  }

  return {
    ok: true,
    discountCode: configured.code,
    ticketUrl: normalizeCampaignTicketUrl(campaign.ticket_url),
    ticketLinkOnly: false,
  };
}
