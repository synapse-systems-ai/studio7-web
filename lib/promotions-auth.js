// Campaign create/edit, analytics, and signup lists.
export const PROMOTIONS_ACCESS_ROLES = ["admin", "marketing"];

/** Void/resend/delete signups - admins only. */
export const PROMOTIONS_ADMIN_ONLY_ROLES = ["admin"];

export const MARKETING_ROLE = "marketing";

export function isMarketingRole(role) {
  return String(role || "").toLowerCase() === MARKETING_ROLE;
}

export function hasPromotionsAccess(user) {
  return PROMOTIONS_ACCESS_ROLES.includes(String(user?.role || "").toLowerCase());
}

export function hasPromotionsAdminAccess(user) {
  return PROMOTIONS_ADMIN_ONLY_ROLES.includes(String(user?.role || "").toLowerCase());
}
