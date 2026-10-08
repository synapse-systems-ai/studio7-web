export function resolvePathnameForStaffAuthGuard(pathnameFromHook) {
  if (typeof window !== "undefined") {
    const live = window.location?.pathname;
    if (typeof live === "string" && live.length > 0) return live;
  }
  return typeof pathnameFromHook === "string" ? pathnameFromHook : "";
}

export function isPromoPublicPath(pathname) {
  if (pathname == null || pathname === "") return false;
  return pathname === "/promo" || pathname.startsWith("/promo/");
}

/** Routes that must not trigger staff sign-in redirects. */
export function isPublicGuestPath(pathname) {
  if (pathname == null || pathname === "") return false;
  if (pathname === "/" || pathname.startsWith("/auth/")) return true;
  return isPromoPublicPath(pathname);
}
