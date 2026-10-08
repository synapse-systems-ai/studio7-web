import type { SupabaseClient } from "@supabase/supabase-js";
import { isValidInstagramHandle, normalizeInstagramHandle } from "@/lib/promo-instagram";

const GRAPH_VERSION = "v21.0";
const VERIFICATION_TTL_MS = 60 * 60 * 1000;

export type InstagramVerificationStatus =
  | "pending"
  | "verified"
  | "not_following"
  | "invalid_handle"
  | "not_configured";

export function isInstagramVerificationDisabled() {
  return process.env.PROMO_INSTAGRAM_VERIFY === "off";
}

export function instagramVerificationConfigured() {
  if (isInstagramVerificationDisabled()) return false;
  const token = process.env.INSTAGRAM_GRAPH_ACCESS_TOKEN?.trim();
  const businessId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID?.trim();
  return Boolean(token && businessId);
}

/** Demo follow check when Meta is not wired up (default). Set PROMO_INSTAGRAM_VERIFY=strict to require real verification. */
export function isInstagramDemoVerification() {
  if (isInstagramVerificationDisabled()) return true;
  if (process.env.PROMO_INSTAGRAM_VERIFY === "strict") return false;
  return !instagramVerificationConfigured();
}

function graphAccessToken() {
  return process.env.INSTAGRAM_GRAPH_ACCESS_TOKEN?.trim() || "";
}

function instagramBusinessAccountId() {
  return process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID?.trim() || "";
}

export function verificationExpiresAt(from = new Date()) {
  return new Date(from.getTime() + VERIFICATION_TTL_MS);
}

type ProfileLookup = "found" | "not_found" | "unknown";

/** Best-effort check that an Instagram username exists (Creator/Business via Graph; personal accounts may be unknown). */
export async function instagramProfileLookup(username: string): Promise<ProfileLookup> {
  const handle = normalizeInstagramHandle(username);
  if (!handle) return "not_found";

  const businessId = instagramBusinessAccountId();
  const userToken = graphAccessToken();
  if (businessId && userToken) {
    const fields = `business_discovery.username(${handle}){username,id}`;
    const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/${businessId}`);
    url.searchParams.set("fields", fields);
    url.searchParams.set("access_token", userToken);
    const res = await fetch(url, { next: { revalidate: 0 } });
    const json = (await res.json()) as {
      business_discovery?: { username?: string };
      error?: { message?: string; code?: number; error_subcode?: number };
    };
    if (res.ok && json.business_discovery?.username) return "found";
    const msg = String(json.error?.message || "").toLowerCase();
    if (msg.includes("invalid user") || msg.includes("cannot find") || msg.includes("not found")) {
      return "not_found";
    }
  }

  return "unknown";
}

export async function instagramUsernameForBusinessAccountId(businessAccountId: string) {
  const token = graphAccessToken();
  if (!token || !businessAccountId) return null;
  const url = new URL(`https://graph.instagram.com/${GRAPH_VERSION}/${businessAccountId}`);
  url.searchParams.set("fields", "username");
  url.searchParams.set("access_token", token);
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) return null;
  const json = (await res.json()) as { username?: string };
  return json.username ? normalizeInstagramHandle(json.username) : null;
}

export async function fetchMessagingInstagramProfile(scopedId: string) {
  const token = graphAccessToken();
  if (!token) return null;

  const url = new URL(`https://graph.instagram.com/${GRAPH_VERSION}/${scopedId}`);
  url.searchParams.set("fields", "username,is_user_follow_business,follower_count");
  url.searchParams.set("access_token", token);

  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) return null;
  return (await res.json()) as {
    username?: string;
    is_user_follow_business?: boolean;
    follower_count?: number;
  };
}

export async function upsertInstagramDmVerification(
  supabase: SupabaseClient,
  input: {
    brandInstagramUsername: string;
    instagramUsername: string;
    instagramScopedId?: string | null;
    followsBusiness: boolean;
  },
) {
  const brand = normalizeInstagramHandle(input.brandInstagramUsername);
  const user = normalizeInstagramHandle(input.instagramUsername);
  const now = new Date();
  const expiresAt = verificationExpiresAt(now);

  const { error } = await supabase.from("promo_instagram_verifications").upsert(
    {
      brand_instagram_username: brand,
      instagram_username: user,
      instagram_scoped_id: input.instagramScopedId || null,
      follows_business: input.followsBusiness,
      verified_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    },
    { onConflict: "brand_instagram_username,instagram_username" },
  );

  return { error: error?.message || null, expiresAt };
}

export async function getInstagramDmVerification(
  supabase: SupabaseClient,
  brandInstagramUsername: string,
  handle: string,
) {
  const brand = normalizeInstagramHandle(brandInstagramUsername);
  const user = normalizeInstagramHandle(handle);
  const { data, error } = await supabase
    .from("promo_instagram_verifications")
    .select("instagram_username, follows_business, verified_at, expires_at")
    .eq("brand_instagram_username", brand)
    .ilike("instagram_username", user)
    .maybeSingle();

  if (error) return { error: error.message, row: null };
  if (!data) return { error: null, row: null };

  const expiresAt = new Date(data.expires_at as string);
  if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() < Date.now()) {
    return { error: null, row: null };
  }

  return { error: null, row: data };
}

export async function resolveInstagramVerificationStatus(
  supabase: SupabaseClient,
  brandInstagramUsername: string,
  handle: string,
): Promise<{ status: InstagramVerificationStatus; message: string; simulated?: boolean }> {
  const normalized = normalizeInstagramHandle(handle);
  if (!normalized || !isValidInstagramHandle(normalized)) {
    return { status: "invalid_handle", message: "Enter a valid Instagram handle." };
  }

  if (isInstagramDemoVerification()) {
    return {
      status: "verified",
      simulated: true,
      message: `@${normalized} is verified and following ${displayAt(brandInstagramUsername)}.`,
    };
  }

  if (!instagramVerificationConfigured()) {
    return {
      status: "not_configured",
      message:
        "Instagram follow verification is not configured on the server. Contact Studio 7 or try again later.",
    };
  }

  const lookup = await instagramProfileLookup(normalized);
  if (lookup === "not_found") {
    return {
      status: "invalid_handle",
      message: "We couldn't find that Instagram account. Check the spelling and try again.",
    };
  }

  const { row, error } = await getInstagramDmVerification(supabase, brandInstagramUsername, normalized);
  if (error) {
    return { status: "pending", message: "Could not check verification status. Try again." };
  }

  if (!row) {
    return {
      status: "pending",
      message: `Send us a direct message from @${normalized} on Instagram, then we'll confirm you're following.`,
    };
  }

  if (!row.follows_business) {
    return {
      status: "not_following",
      message: `Follow @${normalizeInstagramHandle(brandInstagramUsername)} on Instagram, then send us a DM from @${normalized} to refresh.`,
    };
  }

  return {
    status: "verified",
    message: `@${normalized} is verified and following ${displayAt(brandInstagramUsername)}.`,
  };
}

function displayAt(username: string) {
  const h = normalizeInstagramHandle(username);
  return h ? `@${h}` : "@studio7.rsa";
}

export async function assertInstagramSignupAllowed(
  supabase: SupabaseClient,
  brandInstagramUsername: string,
  handle: string,
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const result = await resolveInstagramVerificationStatus(supabase, brandInstagramUsername, handle);

  if (result.status === "verified") return { ok: true };

  if (result.status === "not_configured") {
    return {
      ok: false,
      status: 503,
      error: result.message,
    };
  }

  if (result.status === "invalid_handle") {
    return { ok: false, status: 400, error: result.message };
  }

  if (result.status === "not_following") {
    return { ok: false, status: 403, error: result.message };
  }

  return {
    ok: false,
    status: 403,
    error: result.message,
  };
}
