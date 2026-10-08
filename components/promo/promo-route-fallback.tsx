import { Loader2 } from "lucide-react";
import { Studio7FallbackHero } from "@/components/promo/studio7-fallback-hero";

export function PromoRouteFallback() {
  return (
    <div className="fixed inset-0 h-dvh w-full overflow-hidden text-black">
      <Studio7FallbackHero />
      <div className="relative z-10 flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    </div>
  );
}
