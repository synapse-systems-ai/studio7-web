import { Resend } from "resend";
import { formatPromoValidDuration } from "@/lib/promo-signup";

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

export async function sendPromoConfirmationEmail(
  toEmail: string,
  name: string | null | undefined,
  campaignInfo: PromoCampaignEmailInfo,
) {
  if (!process.env.RESEND_API_KEY) {
    return { success: false as const, skipped: true as const };
  }
  const resend = getResend();
  if (!resend) {
    return { success: false as const, skipped: true as const };
  }

  const greetingName = (name && String(name).trim()) || "there";
  const { headline, discount_percent, discount_code, terms_text, personal_url } = campaignInfo;
  const validLabel = formatPromoValidDuration(campaignInfo.valid_hours ?? 24);
  const subject = `You're on the Studio 7 guest list — ${discount_percent}% off`;
  const safeCode = escapeHtml(discount_code);
  const safeUrl = escapeHtml(personal_url);

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background:#0a0a0a; color:#f5f5f5;">
  <div style="background:#171717;border-radius:12px;padding:28px;">
    <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#a3a3a3;">Studio 7</p>
    <p style="margin:0 0 16px;">Hi ${escapeHtml(greetingName)},</p>
    <p style="margin:0 0 20px;font-size:18px;font-weight:600;">${escapeHtml(headline || "You're on the guest list")}</p>
    <p style="margin:0 0 8px;text-align:center;color:#a3a3a3;font-size:12px;text-transform:uppercase;">Your code</p>
    <p style="margin:0 0 24px;text-align:center;">
      <span style="display:inline-block;background:#fafafa;color:#0a0a0a;padding:14px 28px;border-radius:8px;font-weight:700;font-size:20px;letter-spacing:2px;">${safeCode}</span>
    </p>
    <p style="margin:0 0 24px;text-align:center;color:#d4d4d4;">${discount_percent}% off — valid for ${validLabel}.</p>
    <p style="margin:0 0 28px;text-align:center;">
      <a href="${safeUrl}" style="background:#fafafa;color:#0a0a0a;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:600;display:inline-block;">View your guest list pass</a>
    </p>
    ${terms_text ? `<p style="margin:0;color:#737373;font-size:12px;line-height:1.5;">${escapeHtml(terms_text)}</p>` : ""}
  </div>
</body>
</html>`;

  const text = [
    `Hi ${greetingName},`,
    "",
    headline || "You're on the Studio 7 guest list",
    "",
    `Your code: ${discount_code} (${discount_percent}% off, valid ${validLabel})`,
    "",
    `Personal link: ${personal_url}`,
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
