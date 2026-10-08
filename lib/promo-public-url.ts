function stripTrailingSlash(url: string) {
  return String(url ?? "").replace(/\/$/, "");
}

function isLocalhostBase(url: string) {
  if (!url) return false;
  try {
    const withProtocol = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    const { hostname } = new URL(withProtocol);
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

/** Prefer explicit production env; ignore localhost env on Vercel. */
export function getPromoPublicBaseUrlServer() {
  const fromEnv = stripTrailingSlash(
    process.env.NEXT_PUBLIC_PROMO_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || "",
  );

  if (fromEnv && !isLocalhostBase(fromEnv)) {
    return fromEnv;
  }

  // Never prefer preview deployment URLs in email/SMS (they often require Vercel login).
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return stripTrailingSlash(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
  }

  if (process.env.VERCEL_URL && process.env.VERCEL_ENV === "production") {
    return stripTrailingSlash(`https://${process.env.VERCEL_URL}`);
  }

  if (process.env.VERCEL_URL && process.env.VERCEL_ENV !== "preview") {
    return stripTrailingSlash(`https://${process.env.VERCEL_URL}`);
  }

  if (fromEnv) {
    return fromEnv;
  }

  return "http://localhost:3000";
}

/** In the browser, prefer the live origin when env still points at localhost. */
export function getPromoPublicBaseUrl() {
  if (typeof window !== "undefined") {
    const origin = stripTrailingSlash(window.location.origin);
    const fromEnv = stripTrailingSlash(
      process.env.NEXT_PUBLIC_PROMO_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || "",
    );

    if (fromEnv && !isLocalhostBase(fromEnv)) {
      return fromEnv;
    }

    return origin;
  }

  return getPromoPublicBaseUrlServer();
}

export function getPromoLandingUrl(slug: string) {
  const base = typeof window !== "undefined" ? getPromoPublicBaseUrl() : getPromoPublicBaseUrlServer();
  return `${stripTrailingSlash(base)}/promo/${slug}`;
}

export function getPromoPersonalUrl(accessToken: string) {
  const base = typeof window !== "undefined" ? getPromoPublicBaseUrl() : getPromoPublicBaseUrlServer();
  return `${stripTrailingSlash(base)}/promo/view/${accessToken}`;
}

/** Absolute URL for logo in Resend HTML (must be publicly reachable). */
export function getPromoEmailLogoUrl() {
  return `${getPromoPublicBaseUrlServer()}/studio7/site/logo.png`;
}

/** Hero cover image for promo confirmation emails (studio7rsa.com photography). */
export function getPromoEmailCoverImageUrl() {
  return `${getPromoPublicBaseUrlServer()}/studio7/site/hero/photo-1.jpg`;
}
