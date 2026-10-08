"use client";

import { getPromoCampaignHero } from "@/lib/promo-brand-image";
import { Studio7FallbackHero } from "@/components/promo/studio7-fallback-hero";

type Campaign = { image_url?: string | null } | null;

export function PromoHeroBackground({ campaign }: { campaign: Campaign }) {
  const hero = getPromoCampaignHero(campaign);

  return (
    <div className="absolute inset-0">
      {hero.type === "video" ? (
        <video
          className="h-full w-full object-cover"
          src={hero.url}
          autoPlay
          muted
          loop
          playsInline
        />
      ) : hero.type === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={hero.url} alt="" className="h-full w-full object-cover" />
      ) : (
        <Studio7FallbackHero />
      )}
      {hero.type !== "gradient" ? (
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-black/10 sm:from-black/50 sm:via-black/35 sm:to-black/25" />
      ) : null}
    </div>
  );
}
