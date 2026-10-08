import { Suspense } from "react";
import { PromoLandingClient } from "@/components/promo/promo-landing-client";
import { PromoRouteFallback } from "@/components/promo/promo-route-fallback";

export default function PromoLandingPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<PromoRouteFallback />}>
      <PromoLandingClient params={params} />
    </Suspense>
  );
}
