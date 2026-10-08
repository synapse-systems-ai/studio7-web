import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getServiceRoleSupabase } from "@/lib/supabase-service-lazy";
import { generatePromoDiscountCode } from "@/lib/promo-codes";
import { portalPhoneLookupStrings } from "@/lib/portal-order-access";
import { sendPromoSignupNotifications } from "@/lib/promo-notifications";
import { getPromoPersonalUrl } from "@/lib/promo-public-url";
import { promoExpiresAtFromSignup, resolvePromoCodeValidHours } from "@/lib/promo-signup";
import { getPromoBrand, PROMO_BRAND_STUDIO7 } from "@/lib/promo-brands";
import { campaignIsLive } from "@/lib/promo-campaign-live";

const PUBLIC_CAMPAIGN_SELECT =
  "id, slug, name, headline, description, image_url, discount_percent, terms_text, is_active, starts_at, ends_at, code_valid_hours, brand";

async function findExistingCustomer(
  supabase: ReturnType<typeof getServiceRoleSupabase>,
  { email, phone }: { email: string; phone: string },
) {
  const filters: string[] = [];
  if (email) filters.push(`email.ilike.${email}`);
  if (phone) {
    for (const variant of portalPhoneLookupStrings(phone)) {
      filters.push(`phone.ilike.${variant}`);
    }
  }
  if (!filters.length) return null;
  const { data } = await supabase.from("customers").select("id").or(filters.join(",")).limit(1).maybeSingle();
  return data || null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function looksLikePhone(phone: string) {
  return (String(phone || "").match(/\d/g) || []).length >= 9;
}

async function findExistingSignupForCampaign(
  supabase: ReturnType<typeof getServiceRoleSupabase>,
  { campaignId, email, phone }: { campaignId: string; email: string; phone: string },
) {
  const filters = [`email.ilike.${email}`];
  for (const variant of portalPhoneLookupStrings(phone)) {
    filters.push(`phone.ilike.${variant}`);
  }
  const { data } = await supabase
    .from("promo_signups")
    .select("id")
    .eq("campaign_id", campaignId)
    .is("cancelled_at", null)
    .or(filters.join(","))
    .limit(1)
    .maybeSingle();
  return data || null;
}

const brand = getPromoBrand();
const brandId = PROMO_BRAND_STUDIO7;

export async function promoSlugGET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const supabase = getServiceRoleSupabase();

  const { data: campaign, error } = await supabase
    .from("promo_campaigns")
    .select(PUBLIC_CAMPAIGN_SELECT)
    .eq("slug", slug)
    .eq("brand", brandId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!campaign || !campaignIsLive(campaign)) {
    return NextResponse.json({ error: "This promotion is not available." }, { status: 404 });
  }

  const deviceId = new URL(request.url).searchParams.get("device");
  if (deviceId) {
    const { error: viewErr } = await supabase
      .from("promo_campaign_views")
      .insert({ campaign_id: campaign.id, device_id: deviceId });
    if (viewErr) console.error("promo view log failed (non-fatal):", viewErr.message);
  }

  const { brand: _b, ...publicCampaign } = campaign;
  return NextResponse.json({ campaign: publicCampaign });
}

export async function promoSlugPOST(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const firstName = String(body.first_name || body.firstName || "").trim();
  const lastName = String(body.last_name || body.lastName || body.surname || "").trim();
  const name = [firstName, lastName].filter(Boolean).join(" ");
  const email = body.email ? String(body.email).trim().toLowerCase() : null;
  const phone = body.phone ? String(body.phone).trim() : null;

  if (!firstName) return NextResponse.json({ error: "First name is required" }, { status: 400 });
  if (!lastName) return NextResponse.json({ error: "Surname is required" }, { status: 400 });
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
  }
  if (!phone || !looksLikePhone(phone)) {
    return NextResponse.json({ error: "Please enter a valid phone number" }, { status: 400 });
  }

  const supabase = getServiceRoleSupabase();

  const { data: campaign, error: campErr } = await supabase
    .from("promo_campaigns")
    .select(PUBLIC_CAMPAIGN_SELECT)
    .eq("slug", slug)
    .eq("brand", brandId)
    .maybeSingle();

  if (campErr) return NextResponse.json({ error: campErr.message }, { status: 500 });
  if (!campaign || !campaignIsLive(campaign)) {
    return NextResponse.json({ error: "This promotion is not available." }, { status: 404 });
  }

  const alreadyClaimed = await findExistingSignupForCampaign(supabase, {
    campaignId: campaign.id,
    email,
    phone,
  });
  if (alreadyClaimed) {
    return NextResponse.json(
      { error: "This email or phone number has already signed up for this campaign." },
      { status: 409 },
    );
  }

  let customerId: string | null = null;
  try {
    const existing = await findExistingCustomer(supabase, { email, phone });
    if (existing) {
      customerId = existing.id;
    } else {
      const { data: created } = await supabase
        .from("customers")
        .insert({
          first_name: firstName,
          last_name: lastName,
          email,
          phone,
          is_active: true,
          total_spent: 0,
          loyalty_points: 0,
        })
        .select("id")
        .single();
      customerId = created?.id || null;
    }
  } catch (e) {
    console.error("promo signup: customer match/create failed (non-fatal):", e);
  }

  let discountCode = generatePromoDiscountCode();
  const validHours = resolvePromoCodeValidHours(campaign);
  const expiresAt = promoExpiresAtFromSignup(new Date(), validHours);
  const accessToken = randomUUID();
  let signup: Record<string, unknown> | null = null;

  for (let attempt = 0; attempt < 5 && !signup; attempt++) {
    const { data, error: insertErr } = await supabase
      .from("promo_signups")
      .insert({
        campaign_id: campaign.id,
        customer_id: customerId,
        name,
        email,
        phone,
        contact_method: "both",
        discount_code: discountCode,
        expires_at: expiresAt,
        access_token: accessToken,
      })
      .select()
      .single();

    if (!insertErr) {
      signup = data;
      break;
    }
    if (insertErr.code === "23505") {
      if (String(insertErr.message || "").includes("idx_promo_signups_unique_email_per_campaign")) {
        return NextResponse.json(
          { error: "This email or phone number has already signed up for this campaign." },
          { status: 409 },
        );
      }
      discountCode = generatePromoDiscountCode();
      continue;
    }
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  if (!signup) {
    return NextResponse.json({ error: "Could not complete signup, please try again" }, { status: 500 });
  }

  const personalUrl = getPromoPersonalUrl(accessToken);
  const campaignInfo = {
    headline: campaign.headline,
    discount_percent: campaign.discount_percent,
    discount_code: discountCode,
    terms_text: campaign.terms_text,
    valid_hours: validHours,
    expires_at: expiresAt,
    personal_url: personalUrl,
  };

  const { emailOk, smsOk } = await sendPromoSignupNotifications({ name, email, phone, campaignInfo });
  if (!emailOk && !smsOk) {
    console.error("[promo signup] confirmation not delivered", { email, phone, signupId: signup.id });
  } else if (!emailOk || !smsOk) {
    console.warn("[promo signup] partial delivery", { emailOk, smsOk, email, phone, signupId: signup.id });
  }

  const deliveryNote =
    !emailOk && !smsOk
      ? "Your code is saved below — we couldn't send email or SMS; save it or use your personal link."
      : !emailOk
        ? "Your code is below — we couldn't email it, but SMS should have been sent."
        : !smsOk
          ? "Your code is below — we couldn't text it, but email should have been sent."
          : brand.signupSuccessDefault;

  return NextResponse.json({
    success: true,
    message: deliveryNote,
    discount_code: discountCode,
    expires_at: expiresAt,
    valid_hours: validHours,
    personal_url: personalUrl,
    email_sent: emailOk,
    sms_sent: smsOk,
    stores: [],
  });
}
