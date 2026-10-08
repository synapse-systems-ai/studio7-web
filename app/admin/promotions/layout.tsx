import { PromotionsBrandShell } from "./promotions-brand-shell";

export const instant = false;

export default function Studio7PromotionsLayout({ children }: { children: React.ReactNode }) {
  return <PromotionsBrandShell>{children}</PromotionsBrandShell>;
}
