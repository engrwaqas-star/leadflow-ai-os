import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GmailOutreachService, SendGmailPayload } from '../../src/services/gmailService';
import { Lead } from '../../src/types';

// Mock in-memory localStorage for Node test runner
const store = new Map<string, string>();
const mockLocalStorage = {
  getItem: (key: string) => store.get(key) || null,
  setItem: (key: string, val: string) => store.set(key, String(val)),
  removeItem: (key: string) => store.delete(key),
  clear: () => store.clear(),
  get length() { return store.size; },
  key: (index: number) => Array.from(store.keys())[index] || null,
};

Object.defineProperty(globalThis, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
  configurable: true,
});

describe('Gmail Outreach Service & Protocol Pipeline', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    mockLocalStorage.clear();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('Token and Profile Storage Management', () => {
    it('manages OAuth Bearer tokens in local storage', () => {
      expect(GmailOutreachService.getStoredToken()).toBeNull();

      GmailOutreachService.storeToken('mock-oauth-token-xyz');
      expect(GmailOutreachService.getStoredToken()).toBe('mock-oauth-token-xyz');

      GmailOutreachService.clearToken();
      expect(GmailOutreachService.getStoredToken()).toBeNull();
    });

    it('stores and retrieves connected Gmail user profiles', () => {
      expect(GmailOutreachService.getStoredProfile()).toBeNull();

      const profile = {
        name: 'Muhammad Waqas',
        email: 'waqasashiq0381@gmail.com',
        picture: 'https://avatar.example.com/waqas.png',
      };

      GmailOutreachService.storeProfile(profile);
      expect(GmailOutreachService.getStoredProfile()).toEqual(profile);

      GmailOutreachService.clearToken();
      expect(GmailOutreachService.getStoredProfile()).toBeNull();
    });
  });

  describe('12-Point Quality Control Checklist Validation', () => {
    const validLead: Lead = {
      id: 'lead-1',
      businessName: 'Apex Medical Systems',
      contactPerson: 'Dr. Jane Smith',
      email: 'jane.smith@apexmedical.org',
      phone: '+1 555-0123',
      website: 'https://apexmedical.org',
      industry: 'Healthcare Clinics',
      country: 'USA',
      score: 85,
      temperature: 'HOT',
      contactStatus: 'Not Contacted',
      websiteStatus: 'Active',
      suggestedService: 'React / Next.js Speed Optimization',
      auditIssue: 'Slow mobile load time (3.8s)',
      pitchHook: 'Improve patient booking conversions',
      mobileViewport: true,
      clearCTA: true,
      speedRating: 'Slow',
      auditStatus: 'Audited',
      verificationStatus: 'VERIFIED',
      createdAt: new Date().toISOString(),
    };

    it('passes validation when recipient is real, identity is verified, and copy is evidence-based', () => {
      const subject = 'Quick video walkthrough regarding apexmedical.org mobile booking speed';
      const body = 'Hi Dr. Jane Smith,\n\nI noticed your mobile booking portal at apexmedical.org takes 3.8s to load, which causes patients to abandon appointments.\n\nI recorded a 2-minute video walkthrough showing how we can optimize your Core Web Vitals to sub-second speeds.\n\nMind if I send the link over?\n\nBest,\nMuhammad Waqas';

      const validation = GmailOutreachService.validateQualityChecklist(validLead, subject, body, {
        noFabricatedClaims: true,
        noFakeStatistics: true,
        noMisleadingStatements: true,
        userApprovalRecorded: true,
      });

      expect(validation.passed).toBe(true);
      expect(validation.failedReasons).toHaveLength(0);
      expect(validation.validatedChecklist.recipientEmailVerified).toBe(true);
      expect(validation.validatedChecklist.businessIsReal).toBe(true);
      expect(validation.validatedChecklist.personalizationEvidenceBased).toBe(true);
      expect(validation.validatedChecklist.conciseLength).toBe(true);
    });

    it('fails validation when email is a placeholder or fake domain', () => {
      const fakeLead: Lead = {
        ...validLead,
        email: 'contact@example.com', // Placeholder domain
      };

      const validation = GmailOutreachService.validateQualityChecklist(fakeLead, 'Valid Subject', 'Valid body with plenty of characters to pass the length requirement for test validation.', {});

      expect(validation.passed).toBe(false);
      expect(validation.failedReasons).toContain(
        'Recipient email is not verified or is a placeholder/unknown'
      );
    });

    it('fails validation when subject or reason for contacting is missing', () => {
      const validation = GmailOutreachService.validateQualityChecklist(validLead, 'Hi', 'Valid body with plenty of characters to pass the length requirement for test validation.', {});

      expect(validation.passed).toBe(false);
      expect(validation.failedReasons).toContain(
        'Must provide a clear subject line and reason for outreach'
      );
    });
  });

  describe('Gmail Send Protocol and Error Handling', () => {
    const basePayload: SendGmailPayload = {
      recipientEmail: 'client@growthagency.io',
      recipientName: 'Alex Rivers',
      businessName: 'Growth Agency',
      leadId: 'lead-88',
      subject: 'Quick video demo on mobile loading bottlenecks',
      body: 'Hi Alex, I put together a quick 2-minute video walkthrough showing how to fix mobile touch friction on growthagency.io.',
      senderName: 'Muhammad Waqas',
      senderEmail: 'waqasashiq0381@gmail.com',
      authToken: 'mock-valid-token',
      checklist: {
        recipientEmailVerified: true,
        businessIsReal: true,
        personalizationEvidenceBased: true,
        noFabricatedClaims: true,
        noFakeStatistics: true,
        noMisleadingStatements: true,
        clearReasonForContacting: true,
        conciseLength: true,
        legitimateSenderIdentity: true,
        optOutHandlingAvailable: true,
        correctLeadAttached: true,
        userApprovalRecorded: true,
      },
    };

    it('rejects send attempt immediately when recipient email is invalid or missing', async () => {
      const payload: SendGmailPayload = {
        ...basePayload,
        recipientEmail: 'not-an-email',
      };

      const result = await GmailOutreachService.sendViaGmail(payload);

      expect(result.success).toBe(false);
      expect(result.status).toBe('SEND_FAILED');
      expect(result.error_code).toBe('INVALID_RECIPIENT_EMAIL');
      expect(result.message).toContain('not-an-email');
    });

    it('rejects send attempt when subject or body is empty', async () => {
      const payload: SendGmailPayload = {
        ...basePayload,
        subject: '',
        body: '',
      };

      const result = await GmailOutreachService.sendViaGmail(payload);

      expect(result.success).toBe(false);
      expect(result.status).toBe('SEND_FAILED');
      expect(result.error_code).toBe('EMPTY_MESSAGE');
    });

    it('records and returns SENT status upon successful dispatch by server backend', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          status: 'SENT',
          gmail_message_id: 'gmail-msg-123456789',
          gmail_thread_id: 'gmail-thrd-987654321',
          timestamp: new Date().toISOString(),
        }),
      }) as any;

      const result = await GmailOutreachService.sendViaGmail(basePayload);

      expect(result.success).toBe(true);
      expect(result.status).toBe('SENT');
      expect(result.gmail_message_id).toBe('gmail-msg-123456789');
      expect(result.gmail_thread_id).toBe('gmail-thrd-987654321');
      expect(result.threadUrl).toContain('gmail-thrd-987654321');

      // Verify record is saved in local history
      const saved = GmailOutreachService.getStoredRecords();
      expect(saved.length).toBeGreaterThan(0);
      expect(saved[0].gmail_message_id).toBe('gmail-msg-123456789');
      expect(saved[0].status).toBe('SENT');
    });

    it('handles GMAIL_AUTH_REQUIRED when authentication token is missing or expired', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({
          success: false,
          error_code: 'GMAIL_AUTH_REQUIRED',
          message: 'Connected Gmail OAuth token is missing or expired.',
        }),
      }) as any;

      const payloadWithoutToken = { ...basePayload, authToken: undefined };
      const result = await GmailOutreachService.sendViaGmail(payloadWithoutToken);

      expect(result.success).toBe(false);
      expect(result.status).toBe('SEND_FAILED');
      expect(result.error_code).toBe('GMAIL_AUTH_REQUIRED');
    });

    it('handles network failure gracefully without crashing', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Connection reset by peer'));

      const result = await GmailOutreachService.sendViaGmail(basePayload);

      expect(result.success).toBe(false);
      expect(result.status).toBe('SEND_FAILED');
      expect(result.error_code).toBe('NETWORK_ERROR');
      expect(result.message).toContain('Connection reset by peer');
    });
  });

  describe('Thread Sync and Bounce Detection Pipeline', () => {
    it('returns 0 synced count when no sent records exist', async () => {
      const syncResult = await GmailOutreachService.syncReplies();
      expect(syncResult.syncedCount).toBe(0);
      expect(syncResult.newReplies).toBe(0);
      expect(syncResult.newBounces).toBe(0);
    });

    it('updates message status to REPLIED and BOUNCED when detected in Gmail threads', async () => {
      // Seed a sent message record
      const initialRecord = {
        id: 'msg-seed-1',
        leadId: 'lead-1',
        businessName: 'Apex Health',
        recipient: 'dr@apexhealth.org',
        sender: 'waqas@gmail.com',
        subject: 'Audit',
        body: 'Walkthrough',
        timestamp: new Date().toISOString(),
        status: 'SENT' as const,
        gmail_message_id: 'g-msg-1',
        gmail_thread_id: 'g-thrd-1',
        qualityChecklistPassed: true,
      };
      GmailOutreachService.saveRecord(initialRecord);

      // Mock backend sync response where prospect replied
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          updatedRecords: [
            {
              ...initialRecord,
              status: 'REPLIED',
              repliedAt: new Date().toISOString(),
              replySnippet: 'Hi Waqas, thanks for the video walkthrough!',
            },
          ],
        }),
      }) as any;

      const syncResult = await GmailOutreachService.syncReplies();

      expect(syncResult.syncedCount).toBe(1);
      expect(syncResult.newReplies).toBe(1);
      expect(syncResult.newBounces).toBe(0);

      // Verify the record status in storage updated to REPLIED
      const updatedList = GmailOutreachService.getStoredRecords();
      expect(updatedList[0].status).toBe('REPLIED');
      expect(updatedList[0].replySnippet).toContain('thanks for the video walkthrough');
    });
  });
});
