import { Resend } from "resend";
import { formatPromoValidDuration } from "@/lib/promo-signup";
import { getPromoEmailCoverImageUrl, getPromoEmailLogoUrl } from "@/lib/promo-public-url";

let resendSingleton: Resend | null = null;

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!resendSingleton) resendSingleton = new Resend(key);
  return resendSingleton;
}

function escapeHtml(str: string) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function resendFromAddress() {
  return (
    process.env.RESEND_FROM_EMAIL ||
    process.env.RESEND_FROM ||
    "Studio 7 <noreply@example.com>"
  );
}

export type PromoCampaignEmailInfo = {
  headline?: string | null;
  discount_percent: number;
  discount_code: string;
  terms_text?: string | null;
  valid_hours?: number;
  personal_url: string;
};

/** Same layout as 420 Doctor promo emails; Studio 7 monochrome branding. */
export async function sendPromoConfirmationEmail(
  toEmail: string,
  name: string | null | undefined,
  campaignInfo: PromoCampaignEmailInfo,
) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[promo email] RESEND_API_KEY not set — skipping send");
    return { success: false as const, skipped: true as const };
  }
  const resend = getResend();
  if (!resend) {
    return { success: false as const, skipped: true as const };
  }

  const greetingName = (name && String(name).trim()) || "there";
  const { headline, discount_percent, discount_code, terms_text, personal_url } = campaignInfo;
  const validHours = campaignInfo.valid_hours ?? 24;
  const validLabel = formatPromoValidDuration(validHours);
  const subject = `Your ${discount_percent}% off code - Studio 7`;
  const safeCode = escapeHtml(discount_code);
  const safeUrl = escapeHtml(personal_url);
  const logoUrl = escapeHtml(getPromoEmailLogoUrl());
  const coverUrl = escapeHtml(getPromoEmailCoverImageUrl());

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f3f4f6;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="padding:0;background:#0a0a0a;">
            <img src="${coverUrl}" alt="" width="560" style="display:block;width:100%;height:auto;max-height:300px;object-fit:cover;border:0;opacity:0.92;" />
            <div style="padding:20px 24px 24px;text-align:center;background:linear-gradient(180deg,rgba(10,10,10,0.2) 0%,#0a0a0a 100%);margin-top:-48px;position:relative;">
              <img src="${logoUrl}" alt="Studio 7" width="140" style="display:inline-block;border:0;" />
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 28px 8px;color:#111827;font-size:16px;line-height:1.6;">
            <p style="margin:0 0 16px;">Hi ${escapeHtml(greetingName)},</p>
            <p style="margin:0 0 20px;font-size:18px;font-weight:600;color:#0a0a0a;">${escapeHtml(headline || `You're on the Studio 7 guest list`)}</p>
            <p style="margin:0 0 8px;text-align:center;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Your promo code</p>
            <p style="margin:0 0 24px;text-align:center;">
              <span style="display:inline-block;background-color:#0a0a0a;color:#ffffff;padding:16px 32px;border-radius:8px;font-weight:700;font-size:22px;letter-spacing:2px;">${safeCode}</span>
            </p>
            <p style="margin:0 0 24px;text-align:center;color:#374151;">Show this code for <strong>${discount_percent}% off</strong> at the event.</p>
            <p style="margin:0 0 28px;text-align:center;">
              <a href="${safeUrl}" style="background-color:#0a0a0a;color:#ffffff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:600;display:inline-block;">View your guest list pass</a>
            </p>
            <p style="margin:0;text-align:center;color:#6b7280;font-size:14px;">Valid for <strong>${validLabel}</strong> from signup. Your personal link shows your code and time remaining.</p>
          </td>
        </tr>
        ${terms_text ? `<tr><td style="padding:0 28px 24px;color:#9ca3af;font-size:12px;line-height:1.5;">${escapeHtml(terms_text)}</td></tr>` : ""}
        <tr>
          <td style="background-color:#f9fafb;padding:20px 28px;text-align:center;color:#9ca3af;font-size:12px;border-top:1px solid #e5e7eb;">
            Studio 7 · <a href="${safeUrl}" style="color:#0a0a0a;">Open your guest pass</a>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = [
    `Hi ${greetingName},`,
    "",
    headline || "You're on the Studio 7 guest list",
    "",
    `Your code: ${discount_code}`,
    "",
    `Show this code for ${discount_percent}% off.`,
    `Valid for ${validLabel} from signup.`,
    "",
    `View your pass & timer: ${personal_url}`,
    terms_text || "",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const result = await resend.emails.send({
      from: resendFromAddress(),
      to: [toEmail],
      subject,
      html,
      text,
    });
    if (result.error) {
      console.error("[promo email] Resend error:", result.error);
      return { success: false as const, error: result.error.message || "Email send failed" };
    }
    return { success: true as const, messageId: result.data?.id };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Email send failed";
    console.error("[promo email] send failed:", e);
    return { success: false as const, error: message };
  }
}
