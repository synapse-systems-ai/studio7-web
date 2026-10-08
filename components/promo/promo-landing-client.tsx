"use client";

import { use, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PromoHeroBackground } from "@/components/promo/promo-hero-background";
import { PromoSuccessCard } from "@/components/promo/promo-success-card";
import { getPromoBrand } from "@/lib/promo-brands";

type PublicCampaign = {
  headline?: string;
  description?: string | null;
  terms_text?: string | null;
  discount_percent?: number;
  image_url?: string | null;
};

function PromoShell({ campaign, children }: { campaign: PublicCampaign | null; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 h-dvh w-full overflow-hidden text-black">
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
      // localStorage unavailable — skip click tracking.
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
          <div className="w-full max-w-md rounded-2xl bg-white/95 px-5 py-6 text-center shadow-2xl backdrop-blur-md sm:bg-white">
            <p className="text-lg font-medium">This promotion isn&apos;t available.</p>
            <p className="mt-2 text-sm text-gray-600">{error}</p>
          </div>
        </div>
      </PromoShell>
    );
  }

  return (
    <PromoShell campaign={campaign}>
      <div className="relative z-10 flex h-full w-full items-center justify-center overflow-y-auto p-3 sm:p-4">
        <div className="mx-auto my-auto w-full max-w-md rounded-2xl bg-white/92 px-4 py-4 shadow-2xl backdrop-blur-md sm:space-y-5 sm:bg-white sm:px-5 sm:py-7">
          <div className="flex flex-col items-center gap-2 text-center sm:gap-3">
            <p className="text-lg font-bold tracking-tight text-gray-900 sm:text-xl">{brand.label}</p>
            <div className="min-w-0">
              <h1 className="text-lg font-bold leading-tight sm:text-2xl md:text-3xl">{headline}</h1>
              {campaign?.description && (
                <p className="mt-1 text-xs text-gray-600 sm:text-sm">{campaign.description}</p>
              )}
            </div>
          </div>

          {success ? (
            <PromoSuccessCard
              message={success.message}
              discountCode={success.discount_code}
              expiresAt={success.expires_at}
              validHours={success.valid_hours}
              stores={successStores}
            />
          ) : (
            <form
              onSubmit={handleSubmit}
              className="mt-4 space-y-3 sm:mt-0 sm:space-y-4 sm:rounded-xl sm:border sm:p-5"
            >
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="promo-first-name" className="text-xs sm:text-sm">
                      First name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="promo-first-name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First name"
                      required
                      autoComplete="given-name"
                      className="h-9 text-sm sm:h-10"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="promo-last-name" className="text-xs sm:text-sm">
                      Surname <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="promo-last-name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Surname"
                      required
                      autoComplete="family-name"
                      className="h-9 text-sm sm:h-10"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="promo-email" className="text-xs sm:text-sm">
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="promo-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      autoComplete="email"
                      className="h-9 text-sm sm:h-10"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="promo-phone" className="text-xs sm:text-sm">
                      Phone <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="promo-phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="082 123 4567"
                      autoComplete="tel"
                      className="h-9 text-sm sm:h-10"
                    />
                  </div>
                </div>
              </div>

              <p className="text-center text-[11px] text-gray-500 sm:text-xs">{brand.signupHint}</p>

              {error && <p className="text-xs text-red-600 sm:text-sm">{error}</p>}

              <Button type="submit" className="h-10 w-full text-sm sm:h-11 sm:text-base" disabled={submitting}>
                {submitting ? "Submitting…" : submitLabel}
              </Button>

              {campaign?.terms_text && (
                <p className="text-center text-[10px] leading-tight text-gray-500 sm:text-[11px]">
                  {campaign.terms_text}
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    </PromoShell>
  );
}
