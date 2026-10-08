import twilio from "twilio";

const twilioClient =
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

function formatPhoneNumber(phoneNumber: string) {
  let cleaned = phoneNumber.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("0")) cleaned = "+27" + cleaned.substring(1);
  else if (cleaned.startsWith("27")) cleaned = "+" + cleaned;
  else if (!cleaned.startsWith("+")) cleaned = "+27" + cleaned;
  return cleaned;
}

export async function sendRawSMS(phoneNumber: string, message: string) {
  try {
    if (!twilioClient) {
      console.warn("[promo SMS] TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN not set");
      return { success: false as const, error: "Twilio not configured" };
    }
    if (!process.env.TWILIO_PHONE_NUMBER) {
      console.warn("[promo SMS] TWILIO_PHONE_NUMBER not set");
      return { success: false as const, error: "TWILIO_PHONE_NUMBER not configured" };
    }
    if (!phoneNumber) {
      return { success: false as const, error: "No phone number provided" };
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);
    const result = await twilioClient.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER!,
      to: formattedPhone,
      body: message,
    });

    return { success: true as const, messageId: result.sid, status: result.status };
  } catch (error) {
    const message = error instanceof Error ? error.message : "SMS failed";
    console.error("Failed to send raw SMS:", error);
    return { success: false as const, error: message };
  }
}
