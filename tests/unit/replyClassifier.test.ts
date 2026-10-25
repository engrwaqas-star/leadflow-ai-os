import { describe, it, expect } from 'vitest';
import {
  classifyMessageByRules,
  processAndSmartTagReply,
  DEFAULT_CLASSIFIER_RULES,
} from '../../src/services/smartClassifierService';
import { InboundReply } from '../../src/types';

describe('Inbound Reply Intent Classifier & Smart Tagging Engine', () => {
  describe('Rule-Based Intent Pattern Detection', () => {
    it('classifies pricing & package queries with high confidence and CRITICAL_HOT priority', () => {
      const subject = 'Re: Quick question regarding website load speed';
      const message = 'Hi Waqas, thanks for the audit! What is your package pricing and timeline for a complete mobile redesign?';

      const result = classifyMessageByRules(message, subject);

      expect(result.primaryTag).toBeDefined();
      expect(result.primaryTag.category).toBe('Pricing');
      expect(result.primaryTag.label).toBe('High-Intent Pricing Query');
      expect(result.primaryTag.priority).toBe('CRITICAL_HOT');
      expect(result.primaryTag.confidence).toBeGreaterThanOrEqual(80);
      expect(result.details.signals).toEqual(
        expect.arrayContaining(['pricing', 'package'])
      );
      expect(result.primaryTag.suggestedAction).toContain('Tiered Frontend Scope');
    });

    it('classifies urgent hiring intent with CRITICAL_HOT priority', () => {
      const subject = 'Looking for frontend developer';
      const message = 'We have an urgent deadline and need someone ready to start immediately on our SaaS MVP frontend.';

      const result = classifyMessageByRules(message, subject);

      expect(result.primaryTag.category).toBe('Urgency');
      expect(result.primaryTag.label).toBe('Immediate Project Need');
      expect(result.primaryTag.priority).toBe('CRITICAL_HOT');
      expect(result.details.signals).toEqual(
        expect.arrayContaining(['urgent', 'immediately', 'ready to start'])
      );
      expect(result.primaryTag.suggestedAction).toContain('Kickoff Date');
    });

    it('classifies consultation and call scheduling requests', () => {
      const subject = 'Chat about redesign';
      const message = 'Could we hop on a quick Zoom call or Google Meet tomorrow afternoon to discuss the project?';

      const result = classifyMessageByRules(message, subject);

      expect(result.primaryTag.category).toBe('Meeting');
      expect(result.primaryTag.label).toBe('Meeting / Call Request');
      expect(result.primaryTag.priority).toBe('HIGH');
      expect(result.details.signals).toEqual(
        expect.arrayContaining(['zoom', 'google meet', 'call'])
      );
      expect(result.primaryTag.suggestedAction).toContain('booking link');
    });

    it('classifies technical stack and architecture inquiries', () => {
      const subject = 'Tech stack question';
      const message = 'Do you work with React, TypeScript, and Tailwind CSS? We are looking to migrate from WordPress and fix our Core Web Vitals.';

      const result = classifyMessageByRules(message, subject);

      expect(result.primaryTag.category).toBe('Technical');
      expect(result.primaryTag.label).toBe('Technical Scope Inquiry');
      expect(result.primaryTag.priority).toBe('HIGH');
      expect(result.details.signals).toEqual(
        expect.arrayContaining(['react', 'typescript', 'tailwind', 'wordpress', 'core web vitals'])
      );
    });

    it('classifies proposal and scope of work requests', () => {
      const subject = 'Request for proposal';
      const message = 'Please send over a formal scope of work with deliverables and a detailed breakdown.';

      const result = classifyMessageByRules(message, subject);

      expect(result.primaryTag.category).toBe('Proposal');
      expect(result.primaryTag.label).toBe('Proposal & SOW Request');
      expect(result.details.signals).toEqual(
        expect.arrayContaining(['proposal', 'scope of work', 'deliverables', 'breakdown'])
      );
    });

    it('classifies declined and unsubscribe messages with low priority for auto-suppression', () => {
      const subject = 'Re: Frontend Modernization';
      const message = 'Please unsubscribe me. We have an in-house team and are not interested. Do not contact again.';

      const result = classifyMessageByRules(message, subject);

      expect(result.primaryTag.category).toBe('Negative');
      expect(result.primaryTag.label).toBe('Declined / Not Interested');
      expect(result.primaryTag.priority).toBe('LOW');
      expect(result.primaryTag.suggestedAction).toContain('Auto-suppress');
    });
  });

  describe('Tag Priority Ordering Discipline', () => {
    it('ranks CRITICAL_HOT priority above HIGH when multiple rules match', () => {
      // Contains both technical keywords (react, tailwind -> HIGH) and pricing keywords (price, quote -> CRITICAL_HOT)
      const subject = 'Quote for React build';
      const message = 'What is your quote and price for rebuilding this in React and Tailwind?';

      const result = classifyMessageByRules(message, subject);

      // Multiple tags detected
      expect(result.tags.length).toBeGreaterThan(1);
      // Primary tag must be the highest priority (CRITICAL_HOT: Pricing)
      expect(result.primaryTag.priority).toBe('CRITICAL_HOT');
      expect(result.primaryTag.category).toBe('Pricing');
    });
  });

  describe('Inbound Reply Enrichment Pipeline', () => {
    it('enriches a raw InboundReply with smart tags and classification metadata', () => {
      const rawReply: InboundReply = {
        id: 'reply-test-456',
        leadId: 'lead-99',
        businessName: 'Apex Medical',
        senderName: 'Dr. Watson',
        senderEmail: 'watson@apexmedical.org',
        subject: 'Re: Website Audit',
        message: 'Could you give us an estimate and price for fixing our mobile page speed?',
        receivedAt: new Date().toISOString(),
        sentiment: 'Price Inquiry',
        read: false,
      };

      const enriched = processAndSmartTagReply(rawReply);

      expect(enriched.intent).toBe('Pricing Query');
      expect(enriched.primaryIntentTag).toBeDefined();
      expect(enriched.primaryIntentTag?.category).toBe('Pricing');
      expect(enriched.smartTags).toBeDefined();
      expect(enriched.smartTags?.length).toBeGreaterThan(0);
      expect(enriched.classificationDetails?.ruleName).toContain('Pricing');
      expect(enriched.classificationDetails?.signals).toContain('price');
    });
  });
});
