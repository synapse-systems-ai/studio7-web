"use client";

import { use, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { PromoHeroBackground } from "@/components/promo/promo-hero-background";
import { PromoSuccessCard } from "@/components/promo/promo-success-card";
import { getPromoBrand } from "@/lib/promo-brands";
import type { PromoSignupStatus } from "@/lib/promo-signup";

function PromoShell({
  campaign,
  children,
}: {
  campaign: { image_url?: string | null } | null;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 h-dvh w-full overflow-hidden text-black">
      <PromoHeroBackground campaign={campaign} />
      <div className="relative z-10 h-full w-full overflow-y-auto">{children}</div>
    </div>
  );
}

export function PromoPersonalClient({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const brand = getPromoBrand();
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
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      </PromoShell>
    );
  }

  if (error || !data) {
    return (
      <PromoShell campaign={null}>
        <div className="flex h-full items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-md rounded-2xl bg-white/95 px-5 py-6 text-center shadow-2xl backdrop-blur-md sm:bg-white">
            <p className="text-lg font-medium">Promo not found</p>
            <p className="mt-2 text-sm text-gray-600">{error || "This link may be invalid or expired."}</p>
          </div>
        </div>
      </PromoShell>
    );
  }

  const { signup, campaign } = data;

  return (
    <PromoShell campaign={campaign}>
      <div className="flex h-full w-full items-center justify-center p-3 sm:p-4">
        <div className="mx-auto my-auto w-full max-w-md rounded-2xl bg-white/92 px-4 py-4 shadow-2xl backdrop-blur-md sm:space-y-5 sm:bg-white sm:px-5 sm:py-7">
          <div className="mb-4 flex flex-col items-center gap-2 text-center">
            <p className="text-xl font-bold tracking-tight text-gray-900">{brand.label}</p>
            <h1 className="text-xl font-bold text-gray-900">{campaign?.headline || "Your promo"}</h1>
            {campaign?.description && <p className="text-sm text-gray-600">{campaign.description}</p>}
          </div>

          <PromoSuccessCard
            headline={
              signup.status === "ongoing"
                ? `Hi ${signup.name?.split(" ")[0] || "there"}, here's your ${campaign?.discount_percent || ""}% off code.`
                : undefined
            }
            discountCode={signup.discount_code}
            expiresAt={signup.expires_at}
            validHours={campaign?.code_valid_hours}
            status={signup.status}
            showStatus
          />

          {campaign?.terms_text && (
            <p className="mt-4 text-center text-[11px] text-gray-500">{campaign.terms_text}</p>
          )}
        </div>
      </div>
    </PromoShell>
  );
}
