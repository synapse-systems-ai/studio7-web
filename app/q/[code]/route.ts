import { NextResponse } from "next/server";
import { getServiceRoleSupabase } from "@/lib/supabase-service-lazy";
import {
  normalizeQrShortCode,
  parseDeviceTypeFromUserAgent,
  resolveQrRedirectDestination,
} from "@/lib/promo-qr";
import { getPromoPublicBaseUrlServer } from "@/lib/promo-public-url";

export async function GET(request: Request, context: { params: Promise<{ code: string }> }) {
  const { code: rawCode } = await context.params;
  const code = normalizeQrShortCode(rawCode);
  if (!code) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const supabase = getServiceRoleSupabase();
  const { data: campaign, error } = await supabase
    .from("promo_campaigns")
    .select("id, slug, brand, is_active, qr_destination_url, qr_short_code")
    .eq("qr_short_code", code)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!campaign) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const userAgent = request.headers.get("user-agent");
  const deviceType = parseDeviceTypeFromUserAgent(userAgent);

  const { error: scanErr } = await supabase.from("promo_qr_scans").insert({
    campaign_id: campaign.id,
    device_type: deviceType,
    user_agent: userAgent ? userAgent.slice(0, 512) : null,
  });
  if (scanErr) {
    console.error("promo QR scan log failed (non-fatal):", scanErr.message);
  }

  const destination = resolveQrRedirectDestination(campaign, getPromoPublicBaseUrlServer());
  const redirectUrl = new URL(destination);

  const incoming = new URL(request.url);
  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) {
    const val = incoming.searchParams.get(key);
    if (val) redirectUrl.searchParams.set(key, val);
  }

  return NextResponse.redirect(redirectUrl.toString(), 302);
}
