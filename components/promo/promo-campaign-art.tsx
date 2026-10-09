"use client";

import { getPromoCampaignCardArt } from "@/lib/promo-brand-image";
import { cn } from "@/lib/utils";

type Campaign = { image_url?: string | null } | null;

export function PromoCampaignArt({
  campaign,
  className,
}: {
  campaign: Campaign;
  className?: string;
}) {
  const src = getPromoCampaignCardArt(campaign);
  if (!src) return null;

  return (
    <div className={cn("overflow-hidden rounded-xl border border-zinc-700/80 bg-zinc-900", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="aspect-[16/10] w-full object-cover" />
    </div>
  );
}
