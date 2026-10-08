import { STUDIO7_INSTAGRAM_URL } from "@/lib/studio7-site-assets";

const HANDLE_RE = /^[a-z0-9._]{1,30}$/;

export function normalizeInstagramHandle(raw: string) {
  return String(raw || "")
    .trim()
    .replace(/^@+/, "")
    .toLowerCase();
}

export function isValidInstagramHandle(handle: string) {
  return HANDLE_RE.test(handle);
}

export function instagramProfileUrl(username: string) {
  const handle = normalizeInstagramHandle(username);
  if (!handle) return STUDIO7_INSTAGRAM_URL;
  return `https://www.instagram.com/${encodeURIComponent(handle)}/`;
}

export function instagramDmUrl(username: string) {
  const handle = normalizeInstagramHandle(username);
  if (!handle) return STUDIO7_INSTAGRAM_URL;
  return `https://ig.me/m/${encodeURIComponent(handle)}`;
}

export function displayInstagramHandle(username: string) {
  const handle = normalizeInstagramHandle(username);
  return handle ? `@${handle}` : "@studio7.rsa";
}

/** Placeholder email so legacy NOT NULL columns still accept Instagram-only signups. */
export function syntheticEmailForInstagramSignup(campaignId: string, handle: string) {
  const safe = normalizeInstagramHandle(handle).replace(/[^a-z0-9._]/g, "") || "user";
  return `ig+${safe}+${campaignId.slice(0, 8)}@promo.studio7.local`;
}
