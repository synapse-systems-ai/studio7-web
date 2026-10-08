/** Dev/mobile fallback when browsers (e.g. Brave) ignore Set-Cookie from fetch. */
const STORAGE_KEY = "auth-token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 14;
const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24;

function isDevClient() {
  return process.env.NODE_ENV === "development";
}

export function persistClientAuthToken(token, rememberMe = true) {
  if (!isDevClient() || !token || typeof window === "undefined") return;
  const maxAge = rememberMe ? COOKIE_MAX_AGE : SESSION_COOKIE_MAX_AGE;
  try {
    if (rememberMe) {
      localStorage.setItem(STORAGE_KEY, token);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // ignore
  }
  document.cookie = `auth-token=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export const REMEMBER_ME_STORAGE_KEY = "studio7-remember-me";

export function readRememberMePreference() {
  if (typeof window === "undefined") return true;
  try {
    const raw = localStorage.getItem(REMEMBER_ME_STORAGE_KEY);
    if (raw === null) return true;
    return raw === "1";
  } catch {
    return true;
  }
}

export function persistRememberMePreference(rememberMe) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(REMEMBER_ME_STORAGE_KEY, rememberMe ? "1" : "0");
  } catch {
    // ignore
  }
}

export function clearClientAuthToken() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  document.cookie = "auth-token=; path=/; max-age=0; SameSite=Lax";
}

export function getClientAuthToken() {
  if (!isDevClient() || typeof window === "undefined") return null;
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function getAuthFetchHeaders() {
  const token = getClientAuthToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}
