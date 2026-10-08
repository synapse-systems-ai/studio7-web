import { sendPromoConfirmationEmail } from "@/lib/promo-email";
import { formatPromoValidDuration } from "@/lib/promo-signup";
import { sendRawSMS } from "@/lib/sms";

function buildSignupSmsBody(campaignInfo: {
  discount_percent: number;
  discount_code: string;
  valid_hours?: number;
  personal_url: string;
}) {
  const { discount_percent, discount_code, valid_hours, personal_url } = campaignInfo;
  return `Studio 7: You're on the guest list - ${discount_percent}% off, code ${discount_code}. Valid ${formatPromoValidDuration(valid_hours ?? 24)}. Details: ${personal_url}`;
}

export async function sendPromoSignupNotifications({
  name,
  email,
  phone,
  campaignInfo,
}: {
  name: string;
  email: string;
  phone: string;
  campaignInfo: {
    headline?: string | null;
    discount_percent: number;
    discount_code: string;
    terms_text?: string | null;
    valid_hours?: number;
    expires_at: string;
    personal_url: string;
  };
}) {
  const smsBody = buildSignupSmsBody(campaignInfo);

  const [emailResult, smsResult] = await Promise.allSettled([
    sendPromoConfirmationEmail(email, name, campaignInfo),
    sendRawSMS(phone, smsBody),
  ]);

  const emailOk =
    emailResult.status === "fulfilled" &&
    emailResult.value?.success !== false &&
    !("skipped" in emailResult.value && emailResult.value.skipped);
  const smsOk = smsResult.status === "fulfilled" && smsResult.value?.success === true;

  if (emailResult.status === "rejected") {
    console.error("[promo signup] email failed:", emailResult.reason);
  }
  if (smsResult.status === "rejected") {
    console.error("[promo signup] SMS failed:", smsResult.reason);
  } else if (!smsOk && smsResult.status === "fulfilled") {
    console.error("[promo signup] SMS failed:", smsResult.value?.error);
  }

  return { emailOk, smsOk };
}
