export function getPostLoginPath(role, callbackUrl) {
  const safeCallback =
    typeof callbackUrl === "string" && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")
      ? callbackUrl
      : null;

  if (safeCallback) return safeCallback;
  return "/admin/promotions";
}
