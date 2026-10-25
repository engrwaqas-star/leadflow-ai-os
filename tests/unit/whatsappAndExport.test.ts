import { describe, it, expect } from 'vitest';
import {
  formatPhoneForWhatsApp,
  createWhatsAppDeepLink,
  generateLeadWhatsAppPitch,
  generateDiscoveryMeetingWhatsAppPitch,
} from '../../src/utils/whatsapp';
import {
  sanitizeCellValue,
  formatLeadsForExport,
} from '../../src/utils/excel';
import { Lead } from '../../src/types';

describe('WhatsApp Deep-Link Pitch Generator', () => {
  describe('Phone Number Normalization & E.164 Formatting', () => {
    it('strips non-numeric characters and formats international numbers', () => {
      expect(formatPhoneForWhatsApp('+1 (555) 019-2834')).toBe('15550192834');
      expect(formatPhoneForWhatsApp('+44 20 7946 0991')).toBe('442079460991');
      expect(formatPhoneForWhatsApp('92-300-1234567')).toBe('923001234567');
    });

    it('replaces leading zero with default country prefix', () => {
      expect(formatPhoneForWhatsApp('03075204612', '92')).toBe('923075204612');
      expect(formatPhoneForWhatsApp('07123456789', '44')).toBe('447123456789');
    });

    it('returns default fallback when phone number is missing or empty', () => {
      expect(formatPhoneForWhatsApp('')).toBe('923075204612');
      expect(formatPhoneForWhatsApp(null as any)).toBe('923075204612');
    });
  });

  describe('Deep Link URL Generation', () => {
    it('creates direct wa.me link without message when text is omitted', () => {
      const link = createWhatsAppDeepLink('+1 555-0199');
      expect(link).toBe('https://wa.me/15550199');
    });

    it('properly URI-encodes customized pitch messages', () => {
      const link = createWhatsAppDeepLink('+1 555-0199', 'Hello! Mind if I send a 2-minute video?');
      expect(link).toContain('https://wa.me/15550199?text=');
      expect(link).toContain(encodeURIComponent('Hello! Mind if I send a 2-minute video?'));
    });
  });

  describe('Kashi Pitch Copy Discipline', () => {
    it('generates personalized pitch with soft 2-minute video walkthrough CTA', () => {
      const pitch = generateLeadWhatsAppPitch(
        'Sarah Connor',
        'Cyberdyne Systems',
        42,
        'Slow mobile load time (4.2s)',
        'Muhammad Waqas'
      );

      expect(pitch).toContain('Sarah Connor');
      expect(pitch).toContain('Cyberdyne Systems');
      expect(pitch).toContain('42/100');
      expect(pitch).toContain('Slow mobile load time (4.2s)');
      expect(pitch).toContain('Muhammad Waqas');
      expect(pitch).toContain('2-minute video walkthrough');
    });

    it('generates 15-minute discovery meeting pitch with 3-tier scope reference', () => {
      const pitch = generateDiscoveryMeetingWhatsAppPitch('Alex Rivers', 'Growth Velocity', 'Muhammad Waqas');

      expect(pitch).toContain('Alex Rivers');
      expect(pitch).toContain('Growth Velocity');
      expect(pitch).toContain('15-minute Google Meet');
      expect(pitch).toContain('3-tier modernization scope ($450 Quick Fix vs $1,200 UX Overhaul)');
    });
  });
});

describe('Excel & CSV Export Data Sanitization', () => {
  describe('Formula Injection (CSV / DDE Attack) Protection', () => {
    it('escapes dangerous formula trigger characters (=, +, -, @) with leading quote', () => {
      expect(sanitizeCellValue('=cmd|\' /C calc\'!A0')).toBe('\'=cmd|\' /C calc\'!A0');
      expect(sanitizeCellValue('+123456789')).toBe('\'+123456789');
      expect(sanitizeCellValue('-5000')).toBe('\'-5000');
      expect(sanitizeCellValue('@SUM(A1:A10)')).toBe('\'@SUM(A1:A10)');
    });

    it('preserves safe string, numeric, and boolean values without alteration', () => {
      expect(sanitizeCellValue('Apex Health Clinic')).toBe('Apex Health Clinic');
      expect(sanitizeCellValue('contact@apexhealth.org')).toBe('contact@apexhealth.org');
      expect(sanitizeCellValue(95)).toBe(95);
      expect(sanitizeCellValue(true)).toBe(true);
      expect(sanitizeCellValue(null)).toBeNull();
    });
  });

  describe('Full Export Mapping Structure', () => {
    const mockLead: Lead = {
      id: 'lead-export-1',
      businessName: '=MaliciousCorp',
      contactPerson: 'John Doe',
      email: '+john@malicious.com',
      phone: '+1 555-0123',
      website: 'https://malicious.com',
      industry: 'FinTech',
      country: 'USA',
      city: 'Austin',
      score: 85,
      temperature: 'HOT',
      contactStatus: 'Not Contacted',
      websiteStatus: 'Active',
      suggestedService: 'React Redesign',
      auditIssue: 'Slow latency',
      pitchHook: 'Hello',
      mobileViewport: true,
      clearCTA: false,
      speedRating: 'Fast',
      auditStatus: 'Audited',
      stage: 'OPPORTUNITY_QUALIFIED',
      leadStrategy: 'AGENCY_PARTNERSHIPS',
      estimatedBudget: '$3,500 – $6,000',
      skillGaps: [],
      createdAt: new Date().toISOString(),
    };

    it('formats lead rows with sanitized fields, 9-stage lifecycle, and budget preservation', () => {
      const rows = formatLeadsForExport([mockLead]);

      expect(rows).toHaveLength(1);
      const row = rows[0];

      // Sanitized formula fields
      expect(row['Business Name']).toBe('\'=MaliciousCorp');
      expect(row['Email']).toBe('\'+john@malicious.com');

      // Preserved attributes
      expect(row['Strategy']).toBe('Agency Partnership');
      expect(row['Estimated Budget']).toBe('$3,500 – $6,000');
      expect(row['Pipeline Stage']).toBe('OPPORTUNITY_QUALIFIED');
      expect(row['Mobile Viewport']).toBe('Responsive');
      expect(row['Clear CTA']).toBe('No');
      expect(row['Speed Rating']).toBe('Fast');
    });

    it('exports "Unverified" budget when lead budget evidence is absent', () => {
      const unverifiedLead: Lead = {
        ...mockLead,
        estimatedBudget: undefined,
      };

      const rows = formatLeadsForExport([unverifiedLead]);
      expect(rows[0]['Estimated Budget']).toBe('Unverified');
    });
  });
});
