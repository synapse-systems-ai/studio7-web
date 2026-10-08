import { sendPromoConfirmationEmail } from "@/lib/promo-email";

export async function sendPromoSignupNotifications({
  name,
  email,
  campaignInfo,
}: {
  name: string;
  email: string;
  phone?: string;
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
  const emailResult = await sendPromoConfirmationEmail(email, name, campaignInfo);

  const emailOk = emailResult.success === true;

  if (!emailOk) {
    console.error("[promo signup] email failed:", "error" in emailResult ? emailResult.error : "skipped");
  }

  const emailError =
    !emailOk
      ? ("error" in emailResult && emailResult.error) ||
        ("skipped" in emailResult && emailResult.skipped
          ? "Email not configured (RESEND_API_KEY)"
          : "Email send failed")
      : undefined;

  return { emailOk, emailError };
}
