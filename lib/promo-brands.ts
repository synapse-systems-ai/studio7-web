export const PROMO_BRAND_420 = "420_doctor" as const;
export const PROMO_BRAND_STUDIO7 = "studio7" as const;

export type PromoBrandId = typeof PROMO_BRAND_420 | typeof PROMO_BRAND_STUDIO7;

const STUDIO7 = {
  id: PROMO_BRAND_STUDIO7,
  label: "Studio 7",
  adminBasePath: "/admin/promotions",
  adminApiBase: "/api/admin/promotions",
  publicPathPrefix: "/promo",
  publicApiPrefix: "/api/promo",
  listTitle: "Studio 7 campaigns",
  listSubtitle:
    "QR campaigns for events and parties - capture guest signups and track them in the background.",
  defaultHeadline: "Join the Studio 7 guest list",
  defaultDescription: "Sign up for our next event or party.",
  signupHint: "We'll confirm by email and SMS - you're on the list.",
  submitLabel: (_campaign?: { discount_percent?: number | null }) => "Join the guest list",
  signupSuccessDefault: "You're on the list - check your email and phone for details.",
  showStoresOnSuccess: false,
  use420Logo: false,
} as const;

const DOCTOR420 = {
  id: PROMO_BRAND_420,
  label: "420 Doctor",
  adminBasePath: "/admin/promotions",
  adminApiBase: "/api/admin/promotions",
  publicPathPrefix: "/promo",
  publicApiPrefix: "/api/promo",
  listTitle: "Promotions",
  listSubtitle: "QR-code promo campaigns.",
  defaultHeadline: "Get 10% off your next order",
  defaultDescription: null,
  signupHint: "Your code will be sent to your email and phone.",
  submitLabel: (campaign?: { discount_percent?: number | null }) =>
    `Get ${campaign?.discount_percent ?? 10}% off`,
  signupSuccessDefault: "Check your email and phone - we've sent your discount code both ways.",
  showStoresOnSuccess: true,
  use420Logo: true,
} as const;

export const PROMO_BRANDS = {
  [PROMO_BRAND_420]: DOCTOR420,
  [PROMO_BRAND_STUDIO7]: STUDIO7,
} as const;

export const STUDIO7_PROMO_BRAND = STUDIO7;

export function getPromoBrand(id?: string | null) {
  if (id === PROMO_BRAND_STUDIO7) return PROMO_BRANDS[PROMO_BRAND_STUDIO7];
  if (id === PROMO_BRAND_420) return PROMO_BRANDS[PROMO_BRAND_420];
  return PROMO_BRANDS[PROMO_BRAND_STUDIO7];
}

export function getPromoLandingPath(brandId: PromoBrandId, slug: string) {
  const brand = getPromoBrand(brandId);
  return `${brand.publicPathPrefix}/${slug}`;
}
