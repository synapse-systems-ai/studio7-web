import crypto from "crypto";
import { NextResponse } from "next/server";
import { getServiceRoleSupabase } from "@/lib/supabase-service-lazy";
import {
  fetchMessagingInstagramProfile,
  instagramUsernameForBusinessAccountId,
  upsertInstagramDmVerification,
} from "@/lib/promo-instagram-verification";
import { normalizeInstagramHandle } from "@/lib/promo-instagram";

function verifyMetaSignature(rawBody: string, signatureHeader: string | null) {
  const secret = process.env.META_APP_SECRET?.trim();
  if (!secret || !signatureHeader?.startsWith("sha256=")) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const received = signatureHeader.slice("sha256=".length);
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(received, "utf8"));
  } catch {
    return false;
  }
}

async function brandUsernameForEntry(entryId: string | undefined) {
  if (entryId) {
    const fromGraph = await instagramUsernameForBusinessAccountId(entryId);
    if (fromGraph) return fromGraph;
  }
  return normalizeInstagramHandle(process.env.INSTAGRAM_BRAND_USERNAME || "studio7.rsa");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  const expected = process.env.META_WEBHOOK_VERIFY_TOKEN?.trim();

  if (mode === "subscribe" && expected && token === expected && challenge) {
    return new Response(challenge, { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

type MessagingEntry = {
  id?: string;
  messaging?: Array<{
    sender?: { id?: string };
    recipient?: { id?: string };
    message?: { text?: string };
  }>;
};

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  if (!verifyMetaSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  let payload: { object?: string; entry?: MessagingEntry[] };
  try {
    payload = JSON.parse(rawBody) as { object?: string; entry?: MessagingEntry[] };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (payload.object !== "instagram" || !Array.isArray(payload.entry)) {
    return NextResponse.json({ ok: true });
  }

  const supabase = getServiceRoleSupabase();

  for (const entry of payload.entry) {
    const brandUsername = await brandUsernameForEntry(entry.id);
    const messaging = entry.messaging || [];
    for (const event of messaging) {
      const scopedId = event.sender?.id;
      if (!scopedId) continue;

      const profile = await fetchMessagingInstagramProfile(scopedId);
      if (!profile?.username) continue;

      await upsertInstagramDmVerification(supabase, {
        brandInstagramUsername: brandUsername,
        instagramUsername: profile.username,
        instagramScopedId: scopedId,
        followsBusiness: profile.is_user_follow_business === true,
      });
    }
  }

  return NextResponse.json({ ok: true });
}
