import { randomInt } from "crypto";
import { getPromoPublicBaseUrl, getPromoPublicBaseUrlServer } from "@/lib/promo-public-url";

const QR_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateQrShortCode(length = 8) {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += QR_CODE_CHARS[randomInt(QR_CODE_CHARS.length)];
  }
  return code;
}

export function normalizeQrShortCode(raw: unknown) {
  return String(raw || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

export function getPromoDynamicQrUrl(shortCode: string, server = false) {
  const base = server ? getPromoPublicBaseUrlServer() : getPromoPublicBaseUrl();
  const code = normalizeQrShortCode(shortCode);
  return `${base.replace(/\/$/, "")}/q/${encodeURIComponent(code)}`;
}

export function resolveQrRedirectDestination(
  campaign: { slug: string; qr_destination_url?: string | null },
  baseUrl?: string,
) {
  const override = String(campaign.qr_destination_url || "").trim();
  if (override && /^https?:\/\//i.test(override)) {
    return override;
  }
  const base = (baseUrl || getPromoPublicBaseUrlServer()).replace(/\/$/, "");
  return `${base}/promo/${encodeURIComponent(campaign.slug)}`;
}

export function parseDeviceTypeFromUserAgent(userAgent: string | null | undefined) {
  const ua = String(userAgent || "").toLowerCase();
  if (!ua) return "unknown";
  if (/ipad|tablet|playbook|silk|(android(?!.*mobile))/.test(ua)) return "tablet";
  if (/mobile|iphone|ipod|android.*mobile|windows phone|blackberry/.test(ua)) return "mobile";
  if (/bot|crawl|spider|slurp|preview/.test(ua)) return "bot";
  return "desktop";
}
