export function getPromoPublicBaseUrlServer() {
  const raw =
    process.env.NEXT_PUBLIC_PROMO_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:3000";
  return String(raw).replace(/\/$/, "");
}

export function getPromoPublicBaseUrl() {
  if (typeof window !== "undefined") {
    return (
      process.env.NEXT_PUBLIC_PROMO_BASE_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      window.location.origin
    ).replace(/\/$/, "");
  }
  return getPromoPublicBaseUrlServer();
}

export function getPromoLandingUrl(slug: string) {
  const base =
    typeof window !== "undefined" ? getPromoPublicBaseUrl() : getPromoPublicBaseUrlServer();
  return `${base.replace(/\/$/, "")}/promo/${slug}`;
}

export function getPromoPersonalUrl(accessToken: string) {
  const base =
    typeof window !== "undefined" ? getPromoPublicBaseUrl() : getPromoPublicBaseUrlServer();
  return `${base.replace(/\/$/, "")}/promo/view/${accessToken}`;
}
