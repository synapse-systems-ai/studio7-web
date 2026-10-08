import { Resend } from "resend";
import { formatPromoValidDuration } from "@/lib/promo-signup";
import { getPromoEmailCoverImageUrl, getPromoEmailLogoUrl } from "@/lib/promo-public-url";
import { STUDIO7_INSTAGRAM_URL } from "@/lib/studio7-site-assets";

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

/** Studio 7 guest-list confirmation — email only, monochrome, client-safe HTML tables. */
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
  const subject = `Your Studio 7 guest pass · ${discount_percent}% off`;
  const safeCode = escapeHtml(discount_code);
  const safeUrl = escapeHtml(personal_url);
  const safeHeadline = escapeHtml(headline || "You're on the Studio 7 guest list");
  const logoUrl = escapeHtml(getPromoEmailLogoUrl());
  const coverUrl = escapeHtml(getPromoEmailCoverImageUrl());
  const instagramUrl = escapeHtml(STUDIO7_INSTAGRAM_URL);
  const preheader = `Your code ${discount_code} is ready. Valid for ${validLabel}.`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:#ececec;font-family:Georgia,'Times New Roman',serif;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#ececec;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;">
        <tr>
          <td style="padding:0 0 16px;text-align:center;">
            <img src="${logoUrl}" alt="Studio 7" width="96" style="display:inline-block;border:0;height:auto;" />
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e5e5;box-shadow:0 8px 32px rgba(0,0,0,0.06);">
            <img src="${coverUrl}" alt="" width="520" style="display:block;width:100%;height:auto;max-height:200px;object-fit:cover;border:0;" />
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td style="padding:36px 32px 8px;font-family:Arial,Helvetica,sans-serif;color:#171717;">
                  <p style="margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#737373;">Guest list confirmation</p>
                  <h1 style="margin:0 0 20px;font-size:22px;font-weight:600;line-height:1.35;color:#0a0a0a;">${safeHeadline}</h1>
                  <p style="margin:0 0 24px;font-size:15px;line-height:1.65;color:#525252;">Dear ${escapeHtml(greetingName)}, thank you for joining us. Present the code below in-store for <strong style="color:#0a0a0a;">${discount_percent}% off</strong>. Your personal pass link includes a live timer for the offer window.</p>
                </td>
              </tr>
              <tr>
                <td style="padding:0 32px 28px;font-family:Arial,Helvetica,sans-serif;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fafafa;border:1px solid #e5e5e5;border-radius:12px;">
                    <tr>
                      <td style="padding:20px 24px;text-align:center;">
                        <p style="margin:0 0 10px;font-size:10px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:#737373;">Your promo code</p>
                        <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:26px;font-weight:700;letter-spacing:0.12em;color:#0a0a0a;">${safeCode}</p>
                      </td>
                    </tr>
                  </table>
                  <p style="margin:20px 0 0;font-size:13px;line-height:1.5;text-align:center;color:#737373;">Valid for <strong style="color:#404040;">${escapeHtml(validLabel)}</strong> from the time you signed up.</p>
                  <p style="margin:28px 0 0;text-align:center;">
                    <a href="${safeUrl}" style="background-color:#0a0a0a;color:#ffffff;padding:14px 32px;text-decoration:none;border-radius:999px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:600;letter-spacing:0.06em;display:inline-block;">View guest pass &amp; timer</a>
                  </p>
                </td>
              </tr>
              ${terms_text ? `<tr><td style="padding:0 32px 24px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.55;color:#a3a3a3;border-top:1px solid #f0f0f0;">${escapeHtml(terms_text)}</td></tr>` : ""}
              <tr>
                <td style="padding:20px 32px 28px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;text-align:center;color:#a3a3a3;background:#fafafa;border-top:1px solid #f0f0f0;">
                  Studio 7 · Cape Town<br />
                  <a href="${instagramUrl}" style="color:#0a0a0a;text-decoration:none;font-weight:600;">Follow @studio7.rsa on Instagram</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 8px 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.5;text-align:center;color:#a3a3a3;">
            You received this because you signed up for a Studio 7 promotion.<br />
            If you did not request this, you may ignore this message.
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = [
    `Dear ${greetingName},`,
    "",
    headline || "You're on the Studio 7 guest list",
    "",
    `Your promo code: ${discount_code}`,
    `${discount_percent}% off in-store.`,
    `Valid for ${validLabel} from signup.`,
    "",
    `Guest pass & timer: ${personal_url}`,
    "",
    `Instagram: ${STUDIO7_INSTAGRAM_URL}`,
    terms_text ? "" : null,
    terms_text || null,
    "",
    "— Studio 7",
  ]
    .filter((line) => line !== null)
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
