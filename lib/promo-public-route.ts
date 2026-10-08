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
import { isInstagramPromoCampaign } from "@/lib/promo-campaign-format";
import {
  isValidInstagramHandle,
  normalizeInstagramHandle,
  syntheticEmailForInstagramSignup,
} from "@/lib/promo-instagram";
import { assertInstagramSignupAllowed } from "@/lib/promo-instagram-verification";

const PUBLIC_CAMPAIGN_SELECT =
  "id, slug, name, headline, description, image_url, discount_percent, terms_text, is_active, starts_at, ends_at, code_valid_hours, brand, campaign_format, instagram_username";

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

async function findExistingInstagramSignup(
  supabase: ReturnType<typeof getServiceRoleSupabase>,
  { campaignId, handle }: { campaignId: string; handle: string },
) {
  const { data } = await supabase
    .from("promo_signups")
    .select("id")
    .eq("campaign_id", campaignId)
    .is("cancelled_at", null)
    .ilike("instagram_handle", handle)
    .limit(1)
    .maybeSingle();
  return data || null;
}

type CampaignRow = {
  id: string;
  headline?: string | null;
  discount_percent: number;
  terms_text?: string | null;
  code_valid_hours?: number | null;
  campaign_format?: string | null;
  instagram_username?: string | null;
};

async function insertPromoSignupWithCode(
  supabase: ReturnType<typeof getServiceRoleSupabase>,
  row: Record<string, unknown>,
) {
  let discountCode = generatePromoDiscountCode();
  let signup: Record<string, unknown> | null = null;

  for (let attempt = 0; attempt < 5 && !signup; attempt++) {
    const { data, error: insertErr } = await supabase
      .from("promo_signups")
      .insert({ ...row, discount_code: discountCode })
      .select()
      .single();

    if (!insertErr) {
      signup = data;
      break;
    }
    if (insertErr.code === "23505") {
      const msg = String(insertErr.message || "");
      if (
        msg.includes("idx_promo_signups_unique_email_per_campaign") ||
        msg.includes("idx_promo_signups_unique_instagram_per_campaign")
      ) {
        return { error: "duplicate" as const };
      }
      discountCode = generatePromoDiscountCode();
      continue;
    }
    return { error: insertErr.message };
  }

  if (!signup) {
    return { error: "Could not complete signup, please try again" };
  }
  return { signup, discountCode };
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

  const validHours = resolvePromoCodeValidHours(campaign);
  const expiresAt = promoExpiresAtFromSignup(new Date(), validHours);
  const accessToken = randomUUID();
  const campaignRow = campaign as CampaignRow;

  if (isInstagramPromoCampaign(campaign)) {
    const handle = normalizeInstagramHandle(String(body.instagram_handle || body.instagram || ""));
    if (!isValidInstagramHandle(handle)) {
      return NextResponse.json({ error: "Please enter a valid Instagram handle." }, { status: 400 });
    }

    const brandIg = normalizeInstagramHandle(campaignRow.instagram_username || "studio7.rsa");
    const eligibility = await assertInstagramSignupAllowed(supabase, brandIg, handle);
    if (!eligibility.ok) {
      return NextResponse.json({ error: eligibility.error }, { status: eligibility.status });
    }

    const alreadyIg = await findExistingInstagramSignup(supabase, { campaignId: campaign.id, handle });
    if (alreadyIg) {
      return NextResponse.json(
        { error: "This Instagram handle has already claimed a code for this campaign." },
        { status: 409 },
      );
    }

    const email = syntheticEmailForInstagramSignup(campaign.id, handle);
    const inserted = await insertPromoSignupWithCode(supabase, {
      campaign_id: campaign.id,
      customer_id: null,
      name: `@${handle}`,
      email,
      phone: "—",
      instagram_handle: handle,
      contact_method: "instagram",
      expires_at: expiresAt,
      access_token: accessToken,
    });

    if ("error" in inserted) {
      if (inserted.error === "duplicate") {
        return NextResponse.json(
          { error: "This Instagram handle has already claimed a code for this campaign." },
          { status: 409 },
        );
      }
      return NextResponse.json({ error: inserted.error }, { status: 500 });
    }

    const { signup, discountCode } = inserted;
    const personalUrl = getPromoPersonalUrl(accessToken);

    return NextResponse.json({
      success: true,
      message: `Thanks @${handle}! Here's your ${campaignRow.discount_percent}% ticket discount — save your code below.`,
      discount_code: discountCode,
      expires_at: expiresAt,
      valid_hours: validHours,
      personal_url: personalUrl,
      email_sent: false,
      stores: [],
    });
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

  const inserted = await insertPromoSignupWithCode(supabase, {
    campaign_id: campaign.id,
    customer_id: customerId,
    name,
    email,
    phone,
    contact_method: "email",
    expires_at: expiresAt,
    access_token: accessToken,
  });

  if ("error" in inserted) {
    if (inserted.error === "duplicate") {
      return NextResponse.json(
        { error: "This email or phone number has already signed up for this campaign." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: inserted.error }, { status: 500 });
  }

  const { signup, discountCode } = inserted;
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

  const { emailOk, emailError } = await sendPromoSignupNotifications({
    name,
    email,
    campaignInfo,
  });
  if (!emailOk) {
    console.error("[promo signup] confirmation email not delivered", {
      email,
      signupId: signup.id,
      emailError,
    });
  }

  const deliveryNote = emailOk
    ? brand.signupSuccessDefault
    : "Your code is below — we couldn't send email. Save it or ask the team to resend from admin.";

  return NextResponse.json({
    success: true,
    message: deliveryNote,
    discount_code: discountCode,
    expires_at: expiresAt,
    valid_hours: validHours,
    personal_url: personalUrl,
    email_sent: emailOk,
    stores: [],
  });
}
