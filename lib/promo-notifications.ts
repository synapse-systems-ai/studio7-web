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
  const validLabel = formatPromoValidDuration(valid_hours ?? 24);
  return `Studio 7: ${discount_percent}% off - code ${discount_code}. Valid ${validLabel}. Guest pass & timer: ${personal_url}`;
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
    emailResult.status === "fulfilled" && emailResult.value?.success === true;
  const smsOk = smsResult.status === "fulfilled" && smsResult.value?.success === true;

  if (emailResult.status === "rejected") {
    console.error("[promo signup] email failed:", emailResult.reason);
  }
  if (smsResult.status === "rejected") {
    console.error("[promo signup] SMS failed:", smsResult.reason);
  } else if (!smsOk && smsResult.status === "fulfilled") {
    console.error("[promo signup] SMS failed:", smsResult.value?.error);
  }

  const emailError =
    emailResult.status === "rejected"
      ? String(emailResult.reason)
      : emailResult.status === "fulfilled" && !emailOk
        ? ("error" in emailResult.value && emailResult.value.error) ||
          ("skipped" in emailResult.value && emailResult.value.skipped
            ? "Email not configured (RESEND_API_KEY)"
            : "Email send failed")
        : undefined;
  const smsError =
    smsResult.status === "rejected"
      ? String(smsResult.reason)
      : smsResult.status === "fulfilled" && !smsOk
        ? smsResult.value?.error || "SMS send failed"
        : undefined;

  return { emailOk, smsOk, emailError, smsError };
}
