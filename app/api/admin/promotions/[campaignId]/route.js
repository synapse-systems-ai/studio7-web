import { NextResponse } from "next/server";
import { authenticateWithRole } from "@/lib/api-auth";
import { getServiceRoleSupabase } from "@/lib/supabase-service-lazy";
import { PROMOTIONS_ACCESS_ROLES } from "@/lib/promotions-auth";
import { PROMO_CODE_VALID_HOURS_MAX } from "@/lib/promo-signup";
import { ensureCampaignQrShortCode } from "@/lib/promo-qr-campaign";

const EDITABLE_FIELDS = [
  "name",
  "headline",
  "description",
  "image_url",
  "discount_percent",
  "terms_text",
  "is_active",
  "starts_at",
  "ends_at",
  "code_valid_hours",
  "instagram_username",
  "ticket_url",
  "promo_code",
  "qr_destination_url",
];

/** GET /api/admin/promotions/[campaignId] */
export async function GET(request, { params }) {
  const { error } = await authenticateWithRole(request, PROMOTIONS_ACCESS_ROLES);
  if (error) return error;

  const { campaignId } = await params;
  const supabase = getServiceRoleSupabase();

  const { data: campaign, error: campErr } = await supabase
    .from("promo_campaigns")
    .select("*")
    .eq("id", campaignId)
    .maybeSingle();

  if (campErr) return NextResponse.json({ error: campErr.message }, { status: 500 });
  if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

  const withQr = await ensureCampaignQrShortCode(supabase, campaign);
  return NextResponse.json({ campaign: withQr || campaign });
}

/** PATCH /api/admin/promotions/[campaignId] - edit landing page content */
export async function PATCH(request, { params }) {
  const { error } = await authenticateWithRole(request, PROMOTIONS_ACCESS_ROLES);
  if (error) return error;

  const { campaignId } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const patch = {};
  for (const key of EDITABLE_FIELDS) {
    if (body[key] !== undefined) patch[key] = body[key];
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  if (patch.image_url !== undefined) {
    if (patch.image_url === null || patch.image_url === "") {
      patch.image_url = null;
    } else {
      const url = String(patch.image_url).trim();
      if (!/^https?:\/\//i.test(url)) {
        return NextResponse.json({ error: "image_url must be a valid http(s) URL" }, { status: 400 });
      }
      patch.image_url = url;
    }
  }

  if (patch.code_valid_hours !== undefined) {
    const hours = Math.floor(Number(patch.code_valid_hours));
    if (!Number.isFinite(hours) || hours < 1 || hours > PROMO_CODE_VALID_HOURS_MAX) {
      return NextResponse.json(
        { error: `code_valid_hours must be between 1 and ${PROMO_CODE_VALID_HOURS_MAX}` },
        { status: 400 },
      );
    }
    patch.code_valid_hours = hours;
  }

  if (patch.starts_at !== undefined && patch.starts_at !== null && patch.starts_at !== "") {
    const t = new Date(patch.starts_at).getTime();
    if (Number.isNaN(t)) return NextResponse.json({ error: "Invalid starts_at" }, { status: 400 });
    patch.starts_at = new Date(t).toISOString();
  } else if (patch.starts_at === "" || patch.starts_at === null) {
    patch.starts_at = null;
  }

  if (patch.ends_at !== undefined && patch.ends_at !== null && patch.ends_at !== "") {
    const t = new Date(patch.ends_at).getTime();
    if (Number.isNaN(t)) return NextResponse.json({ error: "Invalid ends_at" }, { status: 400 });
    patch.ends_at = new Date(t).toISOString();
  } else if (patch.ends_at === "" || patch.ends_at === null) {
    patch.ends_at = null;
  }

  if (patch.starts_at && patch.ends_at && new Date(patch.starts_at) > new Date(patch.ends_at)) {
    return NextResponse.json({ error: "Campaign end must be after start" }, { status: 400 });
  }

  if (patch.instagram_username !== undefined) {
    const handle = String(patch.instagram_username || "")
      .trim()
      .replace(/^@+/, "")
      .toLowerCase();
    patch.instagram_username = handle || "studio7.rsa";
  }

  if (patch.ticket_url !== undefined) {
    if (patch.ticket_url === null || patch.ticket_url === "") {
      patch.ticket_url = null;
    } else {
      const url = String(patch.ticket_url).trim();
      if (!/^https?:\/\//i.test(url)) {
        return NextResponse.json({ error: "ticket_url must be a valid http(s) URL" }, { status: 400 });
      }
      patch.ticket_url = url;
    }
  }

  if (patch.promo_code !== undefined) {
    if (patch.promo_code === null || patch.promo_code === "") {
      patch.promo_code = null;
    } else {
      const code = String(patch.promo_code).trim().toUpperCase();
      if (!/^[A-Z0-9_-]{3,40}$/.test(code)) {
        return NextResponse.json(
          { error: "promo_code must be 3–40 characters (letters, numbers, hyphen, underscore)" },
          { status: 400 },
        );
      }
      patch.promo_code = code;
    }
  }

  if (patch.qr_destination_url !== undefined) {
    if (patch.qr_destination_url === null || patch.qr_destination_url === "") {
      patch.qr_destination_url = null;
    } else {
      const url = String(patch.qr_destination_url).trim();
      if (!/^https?:\/\//i.test(url)) {
        return NextResponse.json({ error: "qr_destination_url must be a valid http(s) URL" }, { status: 400 });
      }
      patch.qr_destination_url = url;
    }
  }

  patch.updated_at = new Date().toISOString();

  const supabase = getServiceRoleSupabase();
  const { data: campaign, error: updateErr } = await supabase
    .from("promo_campaigns")
    .update(patch)
    .eq("id", campaignId)
    .select()
    .single();

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });
  return NextResponse.json({ campaign });
}

/** DELETE /api/admin/promotions/[campaignId] */
export async function DELETE(request, { params }) {
  const { error } = await authenticateWithRole(request, PROMOTIONS_ACCESS_ROLES);
  if (error) return error;

  const { campaignId } = await params;
  const supabase = getServiceRoleSupabase();

  const { data: existing, error: fetchErr } = await supabase
    .from("promo_campaigns")
    .select("id")
    .eq("id", campaignId)
    .maybeSingle();

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  if (!existing) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

  const { error: deleteErr } = await supabase
    .from("promo_campaigns")
    .delete()
    .eq("id", campaignId);

  if (deleteErr) return NextResponse.json({ error: deleteErr.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
