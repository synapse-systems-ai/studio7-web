export function formatPhoneE164(phoneNumber: string | null | undefined) {
  if (!phoneNumber) return null;
  let cleaned = phoneNumber.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("0")) cleaned = "+27" + cleaned.substring(1);
  else if (cleaned.startsWith("27")) cleaned = "+" + cleaned;
  else if (!cleaned.startsWith("+")) cleaned = "+27" + cleaned;
  return cleaned;
}

export function portalPhoneLookupStrings(phone: string | null | undefined) {
  if (!phone) return [];
  const p = String(phone).trim();
  const out = new Set<string>([p]);
  const e164 = formatPhoneE164(phone);
  if (e164) {
    out.add(e164);
    out.add(e164.replace(/^\+/, ""));
  }
  const d = p.replace(/\D/g, "");
  if (d.length >= 9) {
    out.add(d);
    if (d.startsWith("27") && d.length >= 11) {
      out.add(`0${d.slice(2)}`);
    }
    if (d.startsWith("0")) {
      out.add(`+27${d.slice(1)}`);
      out.add(`27${d.slice(1)}`);
    }
  }
  return [...out].filter(Boolean);
}
