"use client";

import { use, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Studio7Logo } from "@/components/brand/studio7-logo";
import { Studio7InteractiveButton } from "@/components/brand/studio7-interactive-button";
import { PromoCampaignArt } from "@/components/promo/promo-campaign-art";
import { PromoHeroBackground } from "@/components/promo/promo-hero-background";
import { PromoSuccessCard } from "@/components/promo/promo-success-card";
import { isHiddenTicketLinkSignupCode } from "@/lib/promo-campaign-code";
import { Badge } from "@/components/ui/badge";
import { getPromoBrand, PROMO_BRAND_STUDIO7 } from "@/lib/promo-brands";
import type { PromoSignupStatus } from "@/lib/promo-signup";
import { STUDIO7_INSTAGRAM_URL } from "@/lib/studio7-site-assets";
import { cn } from "@/lib/utils";
import { promoCardClass } from "@/components/promo/promo-card-theme";

function PromoShell({
  campaign,
  children,
}: {
  campaign: { image_url?: string | null } | null;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 h-dvh w-full overflow-hidden text-white">
      <PromoHeroBackground campaign={campaign} />
      <div className="relative z-10 flex h-full w-full overflow-y-auto">{children}</div>
    </div>
  );
}

export function PromoPersonalClient({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const brand = useMemo(() => getPromoBrand(), []);
  const [data, setData] = useState<{
    signup: {
      name?: string;
      discount_code?: string;
      expires_at?: string;
      status: PromoSignupStatus;
    };
    campaign: {
      headline?: string;
      description?: string;
      discount_percent?: number;
      terms_text?: string;
      image_url?: string | null;
      code_valid_hours?: number;
      ticket_url?: string | null;
    };
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/promo/view/${token}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.error) {
          setError(json.error);
          return;
        }
        setData(json);
      })
      .catch(() => setError("Failed to load your promo"))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <PromoShell campaign={null}>
        <div className="flex h-full w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      </PromoShell>
    );
  }

  if (error || !data) {
    return (
      <PromoShell campaign={null}>
        <div className="flex h-full w-full items-center justify-center p-3 sm:p-4">
          <div className={cn(promoCardClass, "px-6 py-8 text-center")}>
            <p className="text-lg font-semibold text-white">Pass not found</p>
            <p className="mt-2 text-sm text-zinc-400">{error || "This link may be invalid or expired."}</p>
          </div>
        </div>
      </PromoShell>
    );
  }

  const { signup, campaign } = data;
  const firstName = signup.name?.split(" ")[0] || "there";
  const isOngoing = signup.status === "ongoing";

  return (
    <PromoShell campaign={campaign}>
      <div className="flex h-full w-full items-center justify-center p-3 sm:p-4">
        <div className={promoCardClass}>
          <PromoCampaignArt campaign={campaign} className="mx-4 mt-4 sm:mx-5 sm:mt-5" />
          <div className="border-b border-zinc-800 px-5 pb-5 pt-6 text-center sm:px-7 sm:pt-8">
            {brand.id === PROMO_BRAND_STUDIO7 ? (
              <Studio7Logo size={96} priority variant="promo" className="mx-auto mb-1" />
            ) : (
              <p className="text-lg font-bold tracking-tight text-white">{brand.label}</p>
            )}
            {brand.id === PROMO_BRAND_STUDIO7 ? (
              <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.35em] text-zinc-500">Guest pass</p>
            ) : null}
            <h1 className="mt-2 text-xl font-bold leading-snug tracking-tight text-white sm:text-2xl">
              {campaign?.headline || "Your Studio 7 promo"}
            </h1>
            {isOngoing && campaign?.discount_percent != null ? (
              <Badge variant="secondary" className="mt-3 border-zinc-600 bg-zinc-800 text-zinc-200">
                {campaign.discount_percent}% off in-store
              </Badge>
            ) : null}
            {campaign?.description ? (
              <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-zinc-400">{campaign.description}</p>
            ) : null}
          </div>

          <div className="px-4 py-5 sm:px-6 sm:py-6">
            <PromoSuccessCard
              message={
                isOngoing
                  ? `Hi ${firstName}, your code and timer are below. Show this pass at the door.`
                  : undefined
              }
              discountCode={signup.discount_code}
              expiresAt={signup.expires_at}
              validHours={campaign?.code_valid_hours}
              status={signup.status}
              showStatus
              ticketUrl={campaign?.ticket_url}
              ticketLinkOnly={isHiddenTicketLinkSignupCode(signup.discount_code)}
            />

            {brand.id === PROMO_BRAND_STUDIO7 ? (
              <div className="mt-5 space-y-3 border-t border-zinc-800 pt-5">
                <p className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  Stay in the loop
                </p>
                <Studio7InteractiveButton href={STUDIO7_INSTAGRAM_URL} variant="ghost">
                  <span className="text-base leading-none" aria-hidden>
                    @
                  </span>
                  Follow @studio7.rsa
                </Studio7InteractiveButton>
              </div>
            ) : null}

            {campaign?.terms_text ? (
              <p className="mt-4 text-center text-[11px] leading-relaxed text-zinc-500">{campaign.terms_text}</p>
            ) : null}
          </div>
        </div>
      </div>
    </PromoShell>
  );
}
