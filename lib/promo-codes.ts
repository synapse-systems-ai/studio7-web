import { randomInt } from "crypto";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generatePromoDiscountCode(prefix = "PROMO") {
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += CODE_CHARS[randomInt(CODE_CHARS.length)];
  }
  return `${prefix}-${suffix}`;
}
