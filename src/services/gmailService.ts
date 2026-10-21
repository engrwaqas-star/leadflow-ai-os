import { EmailStatus, GmailMessageRecord, OutreachQualityChecklist, Lead } from '../types';

export interface SendGmailPayload {
  recipientEmail: string;
  recipientName: string;
  businessName: string;
  leadId: string;
  subject: string;
  body: string;
  senderName: string;
  senderEmail: string;
  senderTitle?: string;
  authToken?: string; // Google OAuth Bearer Token
  checklist: OutreachQualityChecklist;
}

export interface SendGmailResult {
  success: boolean;
  status: EmailStatus;
  gmail_message_id?: string;
  gmail_thread_id?: string;
  timestamp: string;
  error_code?: string;
  message: string;
  provider: 'gmail' | 'local_client';
  threadUrl?: string;
}

const GMAIL_RECORDS_KEY = 'leadflow_gmail_messages_v1';
const GMAIL_TOKEN_KEY = 'leadflow_gmail_oauth_token';
const GMAIL_USER_KEY = 'leadflow_gmail_user_profile';

export class GmailOutreachService {
  /**
   * Get stored OAuth token
   */
  static getStoredToken(): string | null {
    try {
      return localStorage.getItem(GMAIL_TOKEN_KEY);
    } catch {
      return null;
    }
  }

  /**
   * Store OAuth token
   */
  static storeToken(token: string) {
    try {
      localStorage.setItem(GMAIL_TOKEN_KEY, token);
    } catch (e) {
      console.error('Failed to store Gmail token', e);
    }
  }

  /**
   * Clear OAuth token
   */
  static clearToken() {
    try {
      localStorage.removeItem(GMAIL_TOKEN_KEY);
      localStorage.removeItem(GMAIL_USER_KEY);
    } catch (e) {
      console.error('Failed to clear token', e);
    }
  }

  /**
   * Get stored user profile from Gmail
   */
  static getStoredProfile(): { email: string; name: string; picture?: string } | null {
    try {
      const data = localStorage.getItem(GMAIL_USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  /**
   * Store connected profile
   */
  static storeProfile(profile: { email: string; name: string; picture?: string }) {
    try {
      localStorage.setItem(GMAIL_USER_KEY, JSON.stringify(profile));
    } catch (e) {
      console.error('Failed to store profile', e);
    }
  }

  /**
   * Retrieve all sent/tracked Gmail records
   */
  static getStoredRecords(): GmailMessageRecord[] {
    try {
      const saved = localStorage.getItem(GMAIL_RECORDS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  /**
   * Alias for getStoredRecords
   */
  static getStoredMessages(): GmailMessageRecord[] {
    return this.getStoredRecords();
  }

  /**
   * Save a new or updated Gmail message record
   */
  static saveRecord(record: GmailMessageRecord) {
    try {
      const records = this.getStoredRecords();
      const idx = records.findIndex((r) => r.id === record.id);
      if (idx >= 0) {
        records[idx] = record;
      } else {
        records.unshift(record);
      }
      localStorage.setItem(GMAIL_RECORDS_KEY, JSON.stringify(records));
    } catch (e) {
      console.error('Failed to save Gmail record', e);
    }
  }

  /**
   * Validate 12-point Quality Control Checklist before SEND
   */
  static validateQualityChecklist(
    lead: Lead,
    subject: string,
    body: string,
    checklist: Partial<OutreachQualityChecklist>
  ): { passed: boolean; failedReasons: string[]; validatedChecklist: OutreachQualityChecklist } {
    const failedReasons: string[] = [];

    const isPlaceholderEmail = 
      !lead.email || 
      lead.email.includes('example.com') || 
      lead.email.includes('domain.com') || 
      lead.email === 'Not found' || 
      !lead.email.includes('@');

    const emailVerified = Boolean(checklist.recipientEmailVerified ?? !isPlaceholderEmail);
    if (!emailVerified || isPlaceholderEmail) {
      failedReasons.push('Recipient email is not verified or is a placeholder/unknown');
    }

    const businessReal = Boolean(checklist.businessIsReal ?? (lead.verificationStatus === 'VERIFIED' || lead.score >= 50));
    if (!businessReal) {
      failedReasons.push('Business identity must be authenticated');
    }

    const personalizationValid = Boolean(checklist.personalizationEvidenceBased ?? (body.length > 50));
    if (!personalizationValid) {
      failedReasons.push('Email body must contain specific personalized context');
    }

    const conciseLength = Boolean(checklist.conciseLength ?? (body.split(/\s+/).length < 250));
    if (!conciseLength) {
      failedReasons.push('Email length exceeds maximum concise word limit');
    }

    const clearReason = Boolean(checklist.clearReasonForContacting ?? (subject.length > 5));
    if (!clearReason) {
      failedReasons.push('Must provide a clear subject line and reason for outreach');
    }

    const validatedChecklist: OutreachQualityChecklist = {
      recipientEmailVerified: emailVerified,
      businessIsReal: businessReal,
      personalizationEvidenceBased: personalizationValid,
      noFabricatedClaims: Boolean(checklist.noFabricatedClaims ?? true),
      noFakeStatistics: Boolean(checklist.noFakeStatistics ?? true),
      noMisleadingStatements: Boolean(checklist.noMisleadingStatements ?? true),
      clearReasonForContacting: clearReason,
      conciseLength,
      legitimateSenderIdentity: Boolean(checklist.legitimateSenderIdentity ?? true),
      optOutHandlingAvailable: Boolean(checklist.optOutHandlingAvailable ?? true),
      correctLeadAttached: Boolean(checklist.correctLeadAttached ?? true),
      userApprovalRecorded: Boolean(checklist.userApprovalRecorded ?? true),
    };

    const allChecked = Object.values(validatedChecklist).every(Boolean);

    return {
      passed: allChecked && failedReasons.length === 0,
      failedReasons,
      validatedChecklist,
    };
  }

  /**
   * Real Gmail API Send Pipeline:
   * 1. Validate recipient
   * 2. Validate message
   * 3. Show final preview & Quality checklist
   * 4. Call Gmail API endpoint /api/gmail/send
   * 5. Handle response and store message ID & thread ID
   * 6. Return structured result
   */
  static async sendViaGmail(payload: SendGmailPayload): Promise<SendGmailResult> {
    const {
      recipientEmail,
      recipientName,
      businessName,
      leadId,
      subject,
      body,
      senderName,
      senderEmail,
      authToken,
      checklist,
    } = payload;

    const token = authToken || this.getStoredToken();

    // 1. Validate Recipient
    if (!recipientEmail || recipientEmail === 'Not found' || !recipientEmail.includes('@')) {
      const result: SendGmailResult = {
        success: false,
        status: 'SEND_FAILED',
        error_code: 'INVALID_RECIPIENT_EMAIL',
        message: `Recipient email "${recipientEmail}" is not a valid verifiable address.`,
        provider: 'gmail',
        timestamp: new Date().toISOString(),
      };
      this.recordFailedAttempt(payload, result);
      return result;
    }

    // 2. Validate Message
    if (!subject.trim() || !body.trim()) {
      const result: SendGmailResult = {
        success: false,
        status: 'SEND_FAILED',
        error_code: 'EMPTY_MESSAGE',
        message: 'Subject and body cannot be empty.',
        provider: 'gmail',
        timestamp: new Date().toISOString(),
      };
      this.recordFailedAttempt(payload, result);
      return result;
    }

    // 3. Call Server Backend Gmail Dispatch API
    try {
      const response = await fetch('/api/gmail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          recipientEmail,
          recipientName,
          businessName,
          leadId,
          subject,
          body,
          senderName,
          senderEmail,
          authToken: token,
          checklist,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const gmailRecord: GmailMessageRecord = {
          id: data.gmail_message_id || `msg-${Date.now()}`,
          leadId,
          businessName,
          recipient: recipientEmail,
          sender: senderEmail || 'user@gmail.com',
          subject,
          body,
          timestamp: data.timestamp || new Date().toISOString(),
          status: 'SENT',
          gmail_message_id: data.gmail_message_id,
          gmail_thread_id: data.gmail_thread_id,
          qualityChecklistPassed: true,
          rawResponse: data,
        };

        this.saveRecord(gmailRecord);

        const threadUrl = data.gmail_thread_id
          ? `https://mail.google.com/mail/u/0/#inbox/${data.gmail_thread_id}`
          : undefined;

        return {
          success: true,
          status: 'SENT',
          gmail_message_id: data.gmail_message_id,
          gmail_thread_id: data.gmail_thread_id,
          timestamp: gmailRecord.timestamp,
          message: `Email dispatched successfully via Gmail API (Message ID: ${data.gmail_message_id}).`,
          provider: 'gmail',
          threadUrl,
        };
      } else {
        const errorCode = data.error_code || (response.status === 401 ? 'GMAIL_AUTH_REQUIRED' : 'GMAIL_API_ERROR');
        const errorMessage = data.message || data.error || `Gmail dispatch failed with HTTP ${response.status}`;

        const result: SendGmailResult = {
          success: false,
          status: 'SEND_FAILED',
          error_code: errorCode,
          message: errorMessage,
          provider: 'gmail',
          timestamp: new Date().toISOString(),
        };

        this.recordFailedAttempt(payload, result);
        return result;
      }
    } catch (err: any) {
      const result: SendGmailResult = {
        success: false,
        status: 'SEND_FAILED',
        error_code: 'NETWORK_ERROR',
        message: err.message || 'Network error connecting to Gmail API service.',
        provider: 'gmail',
        timestamp: new Date().toISOString(),
      };
      this.recordFailedAttempt(payload, result);
      return result;
    }
  }

  /**
   * Helper to store failed attempts for accurate accountability metrics
   */
  private static recordFailedAttempt(payload: SendGmailPayload, result: SendGmailResult) {
    const failedRecord: GmailMessageRecord = {
      id: `fail-${Date.now()}`,
      leadId: payload.leadId,
      businessName: payload.businessName,
      recipient: payload.recipientEmail,
      sender: payload.senderEmail || 'user@gmail.com',
      subject: payload.subject,
      body: payload.body,
      timestamp: result.timestamp,
      status: 'SEND_FAILED',
      errorCode: result.error_code,
      errorMessage: result.message,
      qualityChecklistPassed: false,
    };
    this.saveRecord(failedRecord);
  }

  /**
   * Sync Gmail Replies & Bounces across all sent threads
   */
  static async syncReplies(): Promise<{
    syncedCount: number;
    newReplies: number;
    newBounces: number;
    updatedRecords: GmailMessageRecord[];
  }> {
    const token = this.getStoredToken();
    const records = this.getStoredRecords();
    const sentRecords = records.filter((r) => r.status === 'SENT' || r.status === 'REPLIED' || r.status === 'NO_REPLY');

    if (sentRecords.length === 0) {
      return { syncedCount: 0, newReplies: 0, newBounces: 0, updatedRecords: records };
    }

    try {
      const response = await fetch('/api/gmail/sync-replies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          records: sentRecords,
          authToken: token,
        }),
      });

      const data = await response.json();
      if (data.success && Array.isArray(data.updatedRecords)) {
        let newReplies = 0;
        let newBounces = 0;

        data.updatedRecords.forEach((updated: GmailMessageRecord) => {
          const old = records.find((r) => r.id === updated.id);
          if (old && old.status !== 'REPLIED' && updated.status === 'REPLIED') {
            newReplies++;
          }
          if (old && old.status !== 'BOUNCED' && updated.status === 'BOUNCED') {
            newBounces++;
          }
          this.saveRecord(updated);
        });

        return {
          syncedCount: sentRecords.length,
          newReplies,
          newBounces,
          updatedRecords: this.getStoredRecords(),
        };
      }
    } catch (e) {
      console.error('Failed to sync replies with Gmail API', e);
    }

    return {
      syncedCount: sentRecords.length,
      newReplies: 0,
      newBounces: 0,
      updatedRecords: records,
    };
  }
}
