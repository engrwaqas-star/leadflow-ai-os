/**
 * WhatsApp Deep Link & Chat Helper Service
 */

/**
 * Formats a phone number for wa.me deep links by stripping non-numeric characters.
 * E.g. "+92 307 5204612" -> "923075204612", "03075204612" -> "923075204612" (assumes PK country code 92 if starting with 0)
 */
export function formatPhoneForWhatsApp(phone: string): string {
  if (!phone) return '923075204612';
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '92' + cleaned.substring(1);
  }
  return cleaned;
}

/**
 * Generates a WhatsApp deep link URL (https://wa.me/PHONE?text=ENCODED_TEXT)
 */
export function createWhatsAppDeepLink(phone: string, textMessage?: string): string {
  const formattedPhone = formatPhoneForWhatsApp(phone);
  if (!textMessage) {
    return `https://wa.me/${formattedPhone}`;
  }
  const encodedText = encodeURIComponent(textMessage);
  return `https://wa.me/${formattedPhone}?text=${encodedText}`;
}

/**
 * Generates a default pitch or outreach message for a lead
 */
export function generateLeadWhatsAppPitch(
  contactPerson: string,
  businessName: string,
  auditScore?: number
): string {
  const name = contactPerson || 'there';
  const biz = businessName || 'your business';
  const scoreText = auditScore ? ` Currently, your site performance score is around ${auditScore}/100.` : '';

  return `Hi ${name}! 👋 I was reviewing ${biz}'s website and noticed some mobile speed bottlenecks that might be impacting your conversions.${scoreText}\n\nOur team specializes in building high-speed React applications that cut load times to under 1.2s. Would you be open to reviewing a 2-minute video audit or package options?`;
}
