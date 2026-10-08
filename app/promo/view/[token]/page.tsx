import { Suspense } from "react";
import { PromoPersonalClient } from "@/components/promo/promo-personal-client";
import { PromoRouteFallback } from "@/components/promo/promo-route-fallback";

export default function PromoPersonalPage({ params }: { params: Promise<{ token: string }> }) {
  return (
    <Suspense fallback={<PromoRouteFallback />}>
      <PromoPersonalClient params={params} />
    </Suspense>
  );
}
