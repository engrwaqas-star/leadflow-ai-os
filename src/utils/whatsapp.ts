/**
 * WhatsApp Deep Link & Chat Helper Service
 * Aligned with Agent Kashi client acquisition principles:
 * - Direct, personal communication (Muhammad Waqas, Frontend Web Developer)
 * - Soft low-pressure CTA ("Mind if I send over a quick 2-minute video walkthrough?")
 * - E.164 phone formatting and deep link construction
 */

/**
 * Formats a phone number for wa.me deep links by stripping non-numeric characters.
 * Handles international codes, stripping non-digits, and normalizes local prefixes.
 */
export function formatPhoneForWhatsApp(phone: string, defaultCountryPrefix: string = '92'): string {
  if (!phone || typeof phone !== 'string') return `${defaultCountryPrefix}3075204612`;
  
  let cleaned = phone.replace(/\D/g, '');
  if (!cleaned) return `${defaultCountryPrefix}3075204612`;

  // If starts with leading zero (e.g. 03075204612), replace zero with default country prefix
  if (cleaned.startsWith('0')) {
    cleaned = defaultCountryPrefix + cleaned.substring(1);
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
 * Generates an initial pitch message for a lead following Agent Kashi principles
 */
export function generateLeadWhatsAppPitch(
  contactPerson: string,
  businessName: string,
  auditScore?: number,
  auditIssue?: string,
  senderName: string = 'Muhammad Waqas'
): string {
  const name = contactPerson && contactPerson !== 'Not found' && contactPerson !== 'Unknown' 
    ? contactPerson 
    : 'there';
  const biz = businessName || 'your business';
  const scoreText = auditScore ? ` Currently, your website performance score is around ${auditScore}/100.` : '';
  const flawText = auditIssue ? ` (${auditIssue})` : '';

  return `Hi ${name}! 👋 I was reviewing ${biz}'s website and noticed some mobile speed bottlenecks${flawText} that may be impacting your visitor conversions.${scoreText}\n\nI'm ${senderName}, a Frontend Web Developer specializing in React and Tailwind with sub-second load times. Mind if I send over a quick 2-minute video walkthrough showing how to fix this?`;
}

/**
 * Generates a discovery call scheduling pitch via WhatsApp
 */
export function generateDiscoveryMeetingWhatsAppPitch(
  contactPerson: string,
  businessName: string,
  senderName: string = 'Muhammad Waqas'
): string {
  const name = contactPerson && contactPerson !== 'Not found' && contactPerson !== 'Unknown' 
    ? contactPerson 
    : 'there';
  const biz = businessName || 'your team';

  return `Hi ${name}! Following up on ${biz}'s frontend performance. Are you free for a brief 15-minute Google Meet this week to walk through our 3-tier modernization scope ($450 Quick Fix vs $1,200 UX Overhaul)?\n\nBest,\n${senderName}`;
}
