import { AutomatedSequence, SequenceStep, Lead, UserProfile } from '../types';

/**
 * Calculates a future YYYY-MM-DD date by adding days to a base date.
 */
export function addDaysToDateString(baseDateStr: string, days: number): string {
  const d = new Date(baseDateStr);
  if (isNaN(d.getTime())) {
    const fallback = new Date();
    fallback.setDate(fallback.getDate() + days);
    return fallback.toISOString().split('T')[0];
  }
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

/**
 * Generates an Automated 3-Step Follow-Up Sequence (Days 3, 7, 14)
 * strictly following Agent Kashi outreach principles:
 * - Day 3: Video walkthrough / interactive proof of diagnosed issue
 * - Day 7: Scope of Work & 3-Tier pricing breakdown ($450 / $1,200 / $2,400+)
 * - Day 14: Graceful permission breakaway (zero guilt, leaving door open)
 */
export function createAutomatedSequence(
  lead: Partial<Lead>,
  profile: Partial<UserProfile>,
  initialContactDate?: string
): AutomatedSequence {
  const baseDate = initialContactDate || new Date().toISOString().split('T')[0];
  const devName = profile.name || 'Muhammad Waqas';
  const businessName = lead.businessName || 'your team';
  const contactName = lead.contactPerson && lead.contactPerson !== 'Not found' && lead.contactPerson !== 'Unknown' 
    ? lead.contactPerson 
    : 'there';
  const problem = lead.auditIssue || lead.websiteStatus || 'mobile responsiveness and load speed';

  const day3Date = addDaysToDateString(baseDate, 3);
  const day7Date = addDaysToDateString(baseDate, 7);
  const day14Date = addDaysToDateString(baseDate, 14);

  const steps: SequenceStep[] = [
    {
      stepNumber: 1,
      delayDays: 3,
      title: 'Step 1: Visual Proof & Interactive Walkthrough (Day 3)',
      subject: `Quick video demo on ${lead.website || businessName}'s mobile speed`,
      body: `Hi ${contactName},\n\nFollowing up on my previous note regarding ${businessName}'s frontend. I recorded a quick 2-minute video walkthrough demonstrating how fixing ${problem} can directly improve your mobile conversion rate.\n\nMind if I send the link over?\n\nBest,\n${devName}`,
      scheduledDate: day3Date,
      status: 'Pending',
    },
    {
      stepNumber: 2,
      delayDays: 7,
      title: 'Step 2: 3-Tier Scope of Work & Pricing Packages (Day 7)',
      subject: `SOW & pricing packages for ${businessName}`,
      body: `Hi ${contactName},\n\nWanted to share a quick 3-tier Scope of Work for ${businessName}:\n• Tier 1 ($450): Rapid ${problem} fix (2-3 days)\n• Tier 2 ($1,200): Modern React/Tailwind UX overhaul (5-7 days)\n• Tier 3 ($2,400+): Full Next.js frontend rebuild (10-14 days)\n\nHappy to share the full markdown proposal if this aligns with your current roadmap.\n\nBest,\n${devName}`,
      scheduledDate: day7Date,
      status: 'Pending',
    },
    {
      stepNumber: 3,
      delayDays: 14,
      title: 'Step 3: Permission Breakaway & Final Follow-up (Day 14)',
      subject: `Closing the loop on ${businessName}`,
      body: `Hi ${contactName},\n\nI'll assume you're all set or have this covered internally for now, so I won't follow up again.\n\nIf you ever need a rapid frontend sprint partner for React, Tailwind, or performance optimization, feel free to reach back out.\n\nWishing ${businessName} continued success!\n\nBest,\n${devName}`,
      scheduledDate: day14Date,
      status: 'Pending',
    },
  ];

  const nowIso = new Date().toISOString();

  return {
    id: `seq-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    leadId: lead.id || `lead-${Date.now()}`,
    businessName,
    contactPerson: contactName,
    email: lead.email || '',
    initialContactDate: baseDate,
    status: 'Active',
    currentStepIndex: 0,
    steps,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

/**
 * Checks if a specific sequence step is due to be sent relative to currentDate.
 */
export function isStepDue(step: SequenceStep, currentDate: string): boolean {
  if (step.status !== 'Pending' && step.status !== 'Scheduled') return false;
  return step.scheduledDate <= currentDate;
}

/**
 * Advances the active sequence to the next step, marking the current step as 'Sent'.
 */
export function advanceSequenceStep(
  sequence: AutomatedSequence,
  sentDate?: string
): AutomatedSequence {
  if (sequence.status !== 'Active') return sequence;

  const currentIndex = sequence.currentStepIndex;
  if (currentIndex >= sequence.steps.length) {
    return { ...sequence, status: 'Completed', updatedAt: new Date().toISOString() };
  }

  const updatedSteps = sequence.steps.map((step, idx) => {
    if (idx === currentIndex) {
      return {
        ...step,
        status: 'Sent' as const,
        sentAt: sentDate || new Date().toISOString(),
      };
    }
    return step;
  });

  const nextIndex = currentIndex + 1;
  const isCompleted = nextIndex >= updatedSteps.length;

  return {
    ...sequence,
    steps: updatedSteps,
    currentStepIndex: nextIndex,
    status: isCompleted ? 'Completed' : 'Active',
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Halts a sequence immediately when the prospect replies.
 * Safeguard: Cancels all remaining pending steps to prevent sending unwanted emails.
 */
export function haltSequenceOnReply(
  sequence: AutomatedSequence,
  replySnippet?: string
): AutomatedSequence {
  if (sequence.status === 'Halted' || sequence.status === 'Completed') {
    return sequence;
  }

  const updatedSteps = sequence.steps.map((step) => {
    if (step.status === 'Pending' || step.status === 'Scheduled') {
      return { ...step, status: 'Cancelled' as const };
    }
    return step;
  });

  return {
    ...sequence,
    status: 'Halted',
    haltReason: replySnippet ? `Inbound reply: "${replySnippet.slice(0, 60)}..."` : 'Inbound client reply received',
    steps: updatedSteps,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Halts a sequence when the lead opts out or declines.
 */
export function haltSequenceOnOptOut(
  sequence: AutomatedSequence,
  reason: string = 'Prospect declined or opted out'
): AutomatedSequence {
  const updatedSteps = sequence.steps.map((step) => {
    if (step.status === 'Pending' || step.status === 'Scheduled') {
      return { ...step, status: 'Cancelled' as const };
    }
    return step;
  });

  return {
    ...sequence,
    status: 'Cancelled',
    haltReason: reason,
    steps: updatedSteps,
    updatedAt: new Date().toISOString(),
  };
}
