"use client";

import { use, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Studio7Logo } from "@/components/brand/studio7-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PromoCampaignArt } from "@/components/promo/promo-campaign-art";
import { PromoHeroBackground } from "@/components/promo/promo-hero-background";
import { PromoSuccessCard } from "@/components/promo/promo-success-card";
import { PromoInstagramSignupForm } from "@/components/promo/promo-instagram-signup-form";
import { getPromoBrand, PROMO_BRAND_STUDIO7 } from "@/lib/promo-brands";
import { isInstagramPromoCampaign } from "@/lib/promo-campaign-format";
import { cn } from "@/lib/utils";
import {
  promoCardClass,
  promoFieldClass,
  promoFormShellClass,
  promoLabelClass,
  promoSubmitClass,
} from "@/components/promo/promo-card-theme";

type PublicCampaign = {
  headline?: string;
  description?: string | null;
  terms_text?: string | null;
  discount_percent?: number;
  image_url?: string | null;
  campaign_format?: string | null;
  instagram_username?: string | null;
  ticket_url?: string | null;
};

function PromoShell({ campaign, children }: { campaign: PublicCampaign | null; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 h-dvh w-full overflow-hidden text-white">
      <PromoHeroBackground campaign={campaign} />
      {children}
    </div>
  );
}

export function PromoLandingClient({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const brand = useMemo(() => getPromoBrand(), []);
  const apiBase = brand.publicApiPrefix;

  const [campaign, setCampaign] = useState<PublicCampaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{
    message?: string;
    discount_code?: string;
    expires_at?: string;
    valid_hours?: number;
    personal_url?: string;
    ticket_url?: string | null;
    ticket_link_only?: boolean;
    email_sent?: boolean;
    stores?: unknown[];
  } | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (!slug) return;
    let deviceId: string | null = null;
    const deviceKey = `promo-device-id-${brand.id}`;
    try {
      deviceId = localStorage.getItem(deviceKey);
      if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem(deviceKey, deviceId);
      }
    } catch {
      // localStorage unavailable - skip click tracking.
    }

    const url = new URL(`${apiBase}/${slug}`, window.location.origin);
    if (deviceId) url.searchParams.set("device", deviceId);

    fetch(url.toString())
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          return;
        }
        setCampaign(data.campaign);
      })
      .catch(() => setError("Failed to load this promotion"))
      .finally(() => setLoading(false));
  }, [slug, apiBase, brand.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      setError("Please enter your first name");
      return;
    }
    if (!lastName.trim()) {
      setError("Please enter your surname");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address");
      return;
    }
    if ((phone.match(/\d/g) || []).length < 9) {
      setError("Please enter a valid phone number");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          phone: phone.trim(),
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Submission failed");
      setSuccess(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const headline = useMemo(() => campaign?.headline, [campaign]);
  const submitLabel = campaign ? brand.submitLabel(campaign) : "Submit";
  const successStores = brand.showStoresOnSuccess ? success?.stores : [];
  const isInstagram = campaign ? isInstagramPromoCampaign(campaign) : false;

  const submitInstagram = async (instagramHandle: string) => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instagram_handle: instagramHandle,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Submission failed");
      setSuccess(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PromoShell campaign={null}>
        <div className="relative z-10 flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      </PromoShell>
    );
  }

  if (error && !campaign) {
    return (
      <PromoShell campaign={null}>
        <div className="relative z-10 flex h-full items-center justify-center p-3 sm:p-4">
          <div className={cn(promoCardClass, "px-6 py-8 text-center")}>
            <p className="text-lg font-semibold text-white">This promotion isn&apos;t available.</p>
            <p className="mt-2 text-sm text-zinc-400">{error}</p>
          </div>
        </div>
      </PromoShell>
    );
  }

  return (
    <PromoShell campaign={campaign}>
      <div className="relative z-10 flex h-full w-full items-center justify-center overflow-y-auto p-3 sm:p-4">
        <div className={promoCardClass}>
          <PromoCampaignArt campaign={campaign} className="mx-4 mt-4 sm:mx-5 sm:mt-5" />
          <div className="border-b border-zinc-800 px-5 pb-5 pt-6 text-center sm:px-7 sm:pt-8">
            {brand.id === PROMO_BRAND_STUDIO7 ? (
              <Studio7Logo size={96} priority variant="promo" className="mx-auto mb-1" />
            ) : (
              <p className="text-lg font-bold tracking-tight text-white sm:text-xl">{brand.label}</p>
            )}
            {brand.id === PROMO_BRAND_STUDIO7 ? (
              <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.35em] text-zinc-500">
                {isInstagram ? "Instagram promo" : "Guest list"}
              </p>
            ) : null}
            <h1
              className={cn(
                "text-xl font-bold leading-snug tracking-tight text-white sm:text-2xl",
                brand.id === PROMO_BRAND_STUDIO7 ? "mt-2" : "mt-4",
              )}
            >
              {headline}
            </h1>
            {campaign?.description ? (
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-zinc-400">{campaign.description}</p>
            ) : null}
          </div>

          <div className="px-4 py-5 sm:px-6 sm:py-6">
            {success ? (
              <PromoSuccessCard
                message={success.message}
                discountCode={success.discount_code}
                expiresAt={success.expires_at}
                validHours={success.valid_hours}
                stores={successStores}
                ticketUrl={success.ticket_url ?? campaign?.ticket_url}
                ticketLinkOnly={Boolean(success.ticket_link_only)}
              />
            ) : isInstagram ? (
              <PromoInstagramSignupForm
                discountPercent={campaign?.discount_percent ?? 10}
                instagramUsername={campaign?.instagram_username || "studio7.rsa"}
                termsText={campaign?.terms_text}
                submitting={submitting}
                error={error}
                onSubmit={submitInstagram}
              />
            ) : (
              <form onSubmit={handleSubmit} className={promoFormShellClass}>
                <div className="grid grid-cols-1 gap-3 sm:gap-4">
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="promo-first-name" className={promoLabelClass}>
                        First name <span className="text-red-600">*</span>
                      </Label>
                      <Input
                        id="promo-first-name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="First name"
                        required
                        autoComplete="given-name"
                        className={promoFieldClass}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="promo-last-name" className={promoLabelClass}>
                        Surname <span className="text-red-600">*</span>
                      </Label>
                      <Input
                        id="promo-last-name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Surname"
                        required
                        autoComplete="family-name"
                        className={promoFieldClass}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="promo-email" className={promoLabelClass}>
                        Email <span className="text-red-600">*</span>
                      </Label>
                      <Input
                        id="promo-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        autoComplete="email"
                        className={promoFieldClass}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="promo-phone" className={promoLabelClass}>
                        Phone <span className="text-red-600">*</span>
                      </Label>
                      <Input
                        id="promo-phone"
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="082 123 4567"
                        autoComplete="tel"
                        className={promoFieldClass}
                      />
                    </div>
                  </div>
                </div>

                <p className="text-center text-[11px] leading-relaxed text-zinc-500 sm:text-xs">{brand.signupHint}</p>

                {error ? (
                  <p className="rounded-lg border border-red-900/80 bg-red-950/50 px-3 py-2 text-center text-xs text-red-200 sm:text-sm">
                    {error}
                  </p>
                ) : null}

                <Button type="submit" className={promoSubmitClass} disabled={submitting}>
                  {submitting ? "Submitting…" : submitLabel}
                </Button>

                {campaign?.terms_text ? (
                  <p className="text-center text-[10px] leading-relaxed text-zinc-500 sm:text-[11px]">
                    {campaign.terms_text}
                  </p>
                ) : null}
              </form>
            )}
          </div>
        </div>
      </div>
    </PromoShell>
  );
}
