import { CLINIC_NAME } from "./clinicInfo";

/**
 * إرسال رسائل واتساب عبر Twilio WhatsApp Business API.
 * لازم تضيف في .env:
 * TWILIO_ACCOUNT_SID=
 * TWILIO_AUTH_TOKEN=
 * TWILIO_WHATSAPP_FROM=whatsapp:+14155238886  (رقم Twilio Sandbox أو رقمك المعتمد)
 */

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID!;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN!;
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM!;

export async function sendWhatsAppMessage(phone: string, message: string) {
  // يفترض إن الرقم متخزن بصيغة دولية زي 201012345678
  const to = phone.startsWith("+") ? phone : `+${phone}`;

  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

  const body = new URLSearchParams({
    From: TWILIO_WHATSAPP_FROM,
    To: `whatsapp:${to}`,
    Body: message,
  });

  const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("WhatsApp send failed:", errText);
    throw new Error(`فشل إرسال رسالة واتساب: ${res.status}`);
  }

  return res.json();
}

// قوالب الرسائل الجاهزة
export const messageTemplates = {
  threeLeft: (estimatedMinutes: number) =>
    `تنبيه من ${CLINIC_NAME}: باقي 3 حالات قبل دورك. الوقت المتوقع لدخولك حوالي ${Math.round(
      estimatedMinutes
    )} دقيقة. برجاء الحضور للعيادة.`,

  delayAlert: (delayMinutes: number) =>
    `نأسف للإبلاغ عن تأخير قدره ${delayMinutes} دقيقة تقريبًا بسبب ظروف طبية طارئة. شكرًا لتفهمك.`,

  reminder: (dateStr: string, timeStr: string) =>
    `تذكير بموعدك في ${CLINIC_NAME} يوم ${dateStr} الساعة ${timeStr}. برجاء تأكيد الحضور.`,

  prescriptionReady: () =>
    `تم الانتهاء من الكشف. الروشتة والتعليمات مرفقة. نتمنى لك الشفاء العاجل.`,
};
