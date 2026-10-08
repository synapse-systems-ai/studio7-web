"use client";

import { PromoBrandProvider } from "@/lib/promo-brand-context";
import { PROMO_BRAND_STUDIO7 } from "@/lib/promo-brands";

export default function Studio7PromotionsLayout({ children }) {
  return <PromoBrandProvider brandId={PROMO_BRAND_STUDIO7}>{children}</PromoBrandProvider>;
}
