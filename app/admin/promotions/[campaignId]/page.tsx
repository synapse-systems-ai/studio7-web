import { Suspense } from "react";
import PromoCampaignEditor from "@/components/admin/promo-campaign-editor";

export default function PromoCampaignDetailPage({ params }: { params: Promise<{ campaignId: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">Loading…</div>
      }
    >
      <PromoCampaignEditor params={params} />
    </Suspense>
  );
}
