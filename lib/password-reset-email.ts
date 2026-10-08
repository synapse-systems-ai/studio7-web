import { Resend } from "resend";

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

function fromAddress() {
  return (
    process.env.RESEND_FROM_EMAIL ||
    process.env.RESEND_FROM ||
    "Studio 7 <noreply@example.com>"
  );
}

export async function sendPasswordResetEmail(
  toEmail: string,
  name: string | null | undefined,
  resetUrl: string,
) {
  if (!process.env.RESEND_API_KEY) {
    return { success: false as const, skipped: true as const };
  }
  const resend = getResend();
  if (!resend) return { success: false as const, skipped: true as const };

  const greeting = (name && String(name).trim()) || "there";
  const subject = "Reset your Studio 7 admin password";
  const safeUrl = escapeHtml(resetUrl);

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
  <p style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#71717a;">Studio 7</p>
  <p>Hi ${escapeHtml(greeting)},</p>
  <p>We received a request to reset your admin password. This link expires in 1 hour.</p>
  <p style="margin: 28px 0; text-align: center;">
    <a href="${safeUrl}" style="background:#18181b;color:#fff;padding:14px 28px;text-decoration:none;border-radius:999px;font-weight:600;display:inline-block;">Reset password</a>
  </p>
  <p style="color:#71717a;font-size:14px;">If you did not request this, you can ignore this email.</p>
</body>
</html>`;

  const text = [
    `Hi ${greeting},`,
    "",
    "Reset your Studio 7 admin password (expires in 1 hour):",
    resetUrl,
    "",
    "If you did not request this, ignore this email.",
  ].join("\n");

  try {
    const result = await resend.emails.send({
      from: fromAddress(),
      to: [toEmail],
      subject,
      html,
      text,
    });
    if (result.error) {
      return { success: false as const, error: result.error.message };
    }
    return { success: true as const, messageId: result.data?.id };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Email failed";
    return { success: false as const, error: message };
  }
}
