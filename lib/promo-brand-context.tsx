"use client";

import { createContext, useContext, useMemo } from "react";
import { getPromoBrand, PROMO_BRAND_STUDIO7, type PromoBrandId } from "@/lib/promo-brands";

const PromoBrandContext = createContext(getPromoBrand(PROMO_BRAND_STUDIO7));

export function PromoBrandProvider({
  brandId = PROMO_BRAND_STUDIO7,
  children,
}: {
  brandId?: PromoBrandId;
  children: React.ReactNode;
}) {
  const value = useMemo(() => getPromoBrand(brandId), [brandId]);
  return <PromoBrandContext.Provider value={value}>{children}</PromoBrandContext.Provider>;
}

export function usePromoBrand() {
  return useContext(PromoBrandContext);
}
