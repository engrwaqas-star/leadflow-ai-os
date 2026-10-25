import { describe, it, expect } from 'vitest';
import {
  createAutomatedSequence,
  isStepDue,
  advanceSequenceStep,
  haltSequenceOnReply,
  haltSequenceOnOptOut,
  addDaysToDateString,
} from '../../src/utils/sequenceEngine';
import { Lead, UserProfile } from '../../src/types';

describe('Automated Follow-Up Sequences Engine (3, 7, 14 Days)', () => {
  const mockLead: Partial<Lead> = {
    id: 'lead-test-101',
    businessName: 'NextWave Logistics',
    contactPerson: 'David Chen',
    email: 'david@nextwavelogistics.io',
    website: 'nextwavelogistics.io',
    auditIssue: 'Slow mobile load time (3.8s) and broken viewport',
    contactStatus: 'Contacted',
  };

  const mockProfile: Partial<UserProfile> = {
    name: 'Muhammad Waqas',
    title: 'Frontend Web Developer',
    email: 'waqasashiq0381@gmail.com',
  };

  describe('Sequence Generation and Date Arithmetic', () => {
    it('correctly calculates future dates by adding days', () => {
      expect(addDaysToDateString('2026-10-01', 3)).toBe('2026-10-04');
      expect(addDaysToDateString('2026-10-01', 7)).toBe('2026-10-08');
      expect(addDaysToDateString('2026-10-01', 14)).toBe('2026-10-15');
      // Month boundary
      expect(addDaysToDateString('2026-10-25', 7)).toBe('2026-11-01');
    });

    it('generates a 3-step sequence with exact delays and personalized copy', () => {
      const baseDate = '2026-10-20';
      const seq = createAutomatedSequence(mockLead, mockProfile, baseDate);

      expect(seq.status).toBe('Active');
      expect(seq.businessName).toBe('NextWave Logistics');
      expect(seq.contactPerson).toBe('David Chen');
      expect(seq.initialContactDate).toBe('2026-10-20');
      expect(seq.steps).toHaveLength(3);
      expect(seq.currentStepIndex).toBe(0);

      // Step 1 (Day 3)
      const step1 = seq.steps[0];
      expect(step1.stepNumber).toBe(1);
      expect(step1.delayDays).toBe(3);
      expect(step1.scheduledDate).toBe('2026-10-23');
      expect(step1.status).toBe('Pending');
      expect(step1.subject).toContain('nextwavelogistics.io');
      expect(step1.body).toContain('2-minute video walkthrough');
      expect(step1.body).toContain('Muhammad Waqas');

      // Step 2 (Day 7)
      const step2 = seq.steps[1];
      expect(step2.stepNumber).toBe(2);
      expect(step2.delayDays).toBe(7);
      expect(step2.scheduledDate).toBe('2026-10-27');
      expect(step2.status).toBe('Pending');
      expect(step2.body).toContain('Tier 1 ($450)');
      expect(step2.body).toContain('Tier 2 ($1,200)');
      expect(step2.body).toContain('Tier 3 ($2,400+)');

      // Step 3 (Day 14)
      const step3 = seq.steps[2];
      expect(step3.stepNumber).toBe(3);
      expect(step3.delayDays).toBe(14);
      expect(step3.scheduledDate).toBe('2026-11-03');
      expect(step3.status).toBe('Pending');
      expect(step3.subject).toContain('Closing the loop');
      expect(step3.body).toContain('assume you\'re all set');
    });
  });

  describe('Step Due Date Check & Evaluation', () => {
    it('returns true only when step is pending and scheduledDate <= currentDate', () => {
      const step = {
        stepNumber: 1 as const,
        delayDays: 3 as const,
        title: 'Step 1',
        subject: 'Demo',
        body: 'Walkthrough',
        scheduledDate: '2026-10-24',
        status: 'Pending' as const,
      };

      // Before scheduled date
      expect(isStepDue(step, '2026-10-23')).toBe(false);
      // On scheduled date
      expect(isStepDue(step, '2026-10-24')).toBe(true);
      // After scheduled date (overdue/due)
      expect(isStepDue(step, '2026-10-25')).toBe(true);

      // Already sent -> never due
      const sentStep = { ...step, status: 'Sent' as const };
      expect(isStepDue(sentStep, '2026-10-25')).toBe(false);

      // Cancelled -> never due
      const cancelledStep = { ...step, status: 'Cancelled' as const };
      expect(isStepDue(cancelledStep, '2026-10-25')).toBe(false);
    });
  });

  describe('Sequence Progression & Lifecycle Transitions', () => {
    it('advances sequence step-by-step and marks completed upon final step send', () => {
      const seq = createAutomatedSequence(mockLead, mockProfile, '2026-10-10');
      expect(seq.currentStepIndex).toBe(0);

      // Advance Step 1
      const afterStep1 = advanceSequenceStep(seq, '2026-10-13T10:00:00Z');
      expect(afterStep1.currentStepIndex).toBe(1);
      expect(afterStep1.status).toBe('Active');
      expect(afterStep1.steps[0].status).toBe('Sent');
      expect(afterStep1.steps[0].sentAt).toBe('2026-10-13T10:00:00Z');
      expect(afterStep1.steps[1].status).toBe('Pending');

      // Advance Step 2
      const afterStep2 = advanceSequenceStep(afterStep1, '2026-10-17T10:00:00Z');
      expect(afterStep2.currentStepIndex).toBe(2);
      expect(afterStep2.status).toBe('Active');
      expect(afterStep2.steps[1].status).toBe('Sent');

      // Advance Step 3 (Final)
      const afterStep3 = advanceSequenceStep(afterStep2, '2026-10-24T10:00:00Z');
      expect(afterStep3.currentStepIndex).toBe(3);
      expect(afterStep3.status).toBe('Completed');
      expect(afterStep3.steps[2].status).toBe('Sent');
    });

    it('halts sequence immediately upon prospect reply to prevent spamming', () => {
      const seq = createAutomatedSequence(mockLead, mockProfile, '2026-10-10');
      // Step 1 was sent
      const step1Sent = advanceSequenceStep(seq, '2026-10-13T10:00:00Z');

      // Prospect replies!
      const halted = haltSequenceOnReply(step1Sent, 'Thanks for the video walkthrough! What is your pricing?');

      expect(halted.status).toBe('Halted');
      expect(halted.haltReason).toContain('Inbound reply');
      // Step 1 stays Sent
      expect(halted.steps[0].status).toBe('Sent');
      // Steps 2 & 3 must be Cancelled
      expect(halted.steps[1].status).toBe('Cancelled');
      expect(halted.steps[2].status).toBe('Cancelled');
    });

    it('cancels sequence if client explicitly opts out', () => {
      const seq = createAutomatedSequence(mockLead, mockProfile, '2026-10-10');
      const cancelled = haltSequenceOnOptOut(seq, 'Unsubscribed by client request');

      expect(cancelled.status).toBe('Cancelled');
      expect(cancelled.haltReason).toBe('Unsubscribed by client request');
      expect(cancelled.steps.every((s) => s.status === 'Cancelled')).toBe(true);
    });
  });
});
