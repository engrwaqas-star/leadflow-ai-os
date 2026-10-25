import { describe, it, expect } from 'vitest';
import { 
  determineLeadStage, 
  calculateExplainableScore, 
  estimateProjectValue 
} from '../../src/utils/leadPipeline';
import { createAutomatedSequence, haltSequenceOnReply } from '../../src/utils/sequenceEngine';
import { classifyMessageByRules, processAndSmartTagReply } from '../../src/services/smartClassifierService';
import { formatPhoneForWhatsApp, createWhatsAppDeepLink, generateLeadWhatsAppPitch } from '../../src/utils/whatsapp';
import { formatLeadsForExport, sanitizeCellValue } from '../../src/utils/excel';
import { sanitizeForFirestore, mergeLeadRecords } from '../../src/utils/storageEngine';
import { Lead, UserProfile, InboundReply } from '../../src/types';

describe('Master End-to-End Pipeline & Agent Kashi Acquisition OS Verification', () => {
  const developerProfile: UserProfile = {
    name: 'Muhammad Waqas',
    title: 'Frontend Web Developer',
    email: 'waqasashiq0381@gmail.com',
    phone: '+92 300 1234567',
    portfolioUrl: 'https://muhammadwaqas.dev',
    githubUrl: 'https://github.com/engrwaqas-star',
    dailyOutreachGoal: 30,
    targetNiches: ['SaaS Startups', 'Healthcare', 'E-Commerce', 'Agencies'],
  };

  it('executes full 9-stage client acquisition lifecycle from discovery to deal won', () => {
    // -------------------------------------------------------------------------
    // STAGE 1: DISCOVERED (Raw Discovered Lead)
    // -------------------------------------------------------------------------
    let lead: Lead = {
      id: 'lead-master-e2e-1',
      businessName: 'Lumina Cloud Analytics',
      contactPerson: 'Not found',
      email: 'Not found',
      phone: '',
      website: 'luminacloud.io',
      industry: 'SaaS Startups',
      country: 'USA',
      city: 'San Francisco',
      score: 50,
      temperature: 'POTENTIAL',
      contactStatus: 'Not Contacted',
      websiteStatus: 'Needs Audit',
      suggestedService: 'SaaS MVP Frontend Redesign & Client Portal',
      auditIssue: 'Slow mobile load speed',
      pitchHook: 'Scale cloud dashboard speed',
      mobileViewport: false,
      clearCTA: false,
      speedRating: 'Slow',
      auditStatus: 'Pending',
      verificationStatus: 'UNVERIFIED',
      createdAt: new Date().toISOString(),
    };

    expect(determineLeadStage(lead)).toBe('DISCOVERED');

    // -------------------------------------------------------------------------
    // STAGE 2: IDENTITY_VERIFIED
    // -------------------------------------------------------------------------
    lead = {
      ...lead,
      phone: '+1 415-555-0192',
      verificationStatus: 'VERIFIED',
      verificationScore: 90,
    };

    expect(determineLeadStage(lead)).toBe('IDENTITY_VERIFIED');

    // -------------------------------------------------------------------------
    // STAGE 3: WEBSITE_REVIEWED (Live DOM Inspection Completed)
    // -------------------------------------------------------------------------
    lead = {
      ...lead,
      auditStatus: 'Audited',
      auditDetails: {
        url: 'https://luminacloud.io',
        cleanUrl: 'https://luminacloud.io',
        isReachable: true,
        hasSSL: true,
        hasMobileViewport: true,
        hasCTA: true,
        ctaElementsFound: ['Get Started Free'],
        hasPhoneLink: false,
        hasEmailLink: false,
        hasContactForm: true,
        detectedTech: ['React', 'Next.js', 'Tailwind CSS'],
        speedRating: 'Average',
        auditIssues: ['Sub-optimal TTFB on mobile'],
        technicalStrengths: ['Responsive Viewport OK', 'Clean Single H1'],
        findings: [],
        auditedAt: new Date().toISOString(),
      },
    };

    // -------------------------------------------------------------------------
    // STAGE 4: OPPORTUNITY_QUALIFIED (Agent Kashi 0-100 Rubric & Budget Estimation)
    // -------------------------------------------------------------------------
    const qualification = calculateExplainableScore(lead);

    // Adheres to 25/20/20/15/10/10 rubric
    expect(qualification.budgetPotentialScore).toBeLessThanOrEqual(25);
    expect(qualification.needScore).toBeLessThanOrEqual(20);
    expect(qualification.skillMatchScore).toBeLessThanOrEqual(20);
    expect(qualification.clientQualityScore).toBeLessThanOrEqual(15);
    expect(qualification.projectQualityScore).toBeLessThanOrEqual(10);
    expect(qualification.relationshipPotentialScore).toBeLessThanOrEqual(10);
    expect(qualification.totalScore).toBeGreaterThanOrEqual(65);
    expect(qualification.category).toMatch(/HOT LEAD|STRONG LEAD/);

    // Evidence-backed high-value project estimation ($2,000+ target)
    const budgetEstimate = estimateProjectValue(lead);
    expect(budgetEstimate.estimatedValueRange).toBe('$3,500 – $6,000');
    expect(budgetEstimate.confidence).toBe('High');

    lead = {
      ...lead,
      score: qualification.totalScore,
      temperature: qualification.totalScore >= 80 ? 'HOT' : 'WARM',
      estimatedBudget: budgetEstimate.estimatedValueRange,
      stage: 'OPPORTUNITY_QUALIFIED',
    };

    expect(determineLeadStage(lead)).toBe('OPPORTUNITY_QUALIFIED');

    // -------------------------------------------------------------------------
    // STAGE 5: CONTACT_READY (Decision Maker Email Identified)
    // -------------------------------------------------------------------------
    lead = {
      ...lead,
      contactPerson: 'Marcus Vance (Founder)',
      email: 'marcus@luminacloud.io',
    };

    expect(determineLeadStage(lead)).toBe('CONTACT_READY');

    // -------------------------------------------------------------------------
    // STAGE 6: OUTREACH_DRAFTED (Personalized Problem Copy & Soft CTA)
    // -------------------------------------------------------------------------
    const sequence = createAutomatedSequence(lead, developerProfile, '2026-10-25');
    expect(sequence.steps).toHaveLength(3);
    expect(sequence.steps[0].delayDays).toBe(3);
    expect(sequence.steps[0].body).toContain('2-minute video walkthrough');
    expect(sequence.steps[0].body).toContain('Muhammad Waqas');

    lead = {
      ...lead,
      stage: 'OUTREACH_DRAFTED',
    };

    expect(determineLeadStage(lead)).toBe('OUTREACH_DRAFTED');

    // -------------------------------------------------------------------------
    // STAGE 7: CONTACTED (First Touch Dispatched)
    // -------------------------------------------------------------------------
    lead = {
      ...lead,
      contactStatus: 'Contacted',
      lastContactDate: '2026-10-25',
    };

    expect(determineLeadStage(lead)).toBe('CONTACTED');

    // -------------------------------------------------------------------------
    // STAGE 8: REPLIED (Inbound Response Received & Classified)
    // -------------------------------------------------------------------------
    const rawReply: InboundReply = {
      id: 'reply-lumina-1',
      leadId: lead.id,
      businessName: lead.businessName,
      senderName: 'Marcus Vance',
      senderEmail: 'marcus@luminacloud.io',
      subject: 'Re: Quick video demo on luminacloud.io',
      message: 'Hi Waqas, thanks for the video walkthrough! What is your pricing and turnaround timeline for this modern React upgrade?',
      receivedAt: new Date().toISOString(),
      sentiment: 'Price Inquiry',
      read: false,
    };

    // Classify reply
    const enrichedReply = processAndSmartTagReply(rawReply);
    expect(enrichedReply.primaryIntentTag?.category).toBe('Pricing');
    expect(enrichedReply.primaryIntentTag?.priority).toBe('CRITICAL_HOT');
    expect(enrichedReply.primaryIntentTag?.suggestedAction).toContain('Tiered Frontend Scope');

    // Safeguard: Halt sequence immediately to prevent sending scheduled follow-up
    const haltedSequence = haltSequenceOnReply(sequence, rawReply.message);
    expect(haltedSequence.status).toBe('Halted');
    expect(haltedSequence.steps[1].status).toBe('Cancelled');
    expect(haltedSequence.steps[2].status).toBe('Cancelled');

    lead = {
      ...lead,
      contactStatus: 'Replied',
    };

    expect(determineLeadStage(lead)).toBe('REPLIED');

    // -------------------------------------------------------------------------
    // STAGE 9: WON (Deal Closed)
    // -------------------------------------------------------------------------
    lead = {
      ...lead,
      contactStatus: 'Closed Won',
    };

    expect(determineLeadStage(lead)).toBe('WON');

    // -------------------------------------------------------------------------
    // MULTI-CHANNEL & EXPORT VERIFICATION
    // -------------------------------------------------------------------------
    // WhatsApp direct deep link
    const waPitch = generateLeadWhatsAppPitch(lead.contactPerson, lead.businessName, lead.score, lead.auditIssue);
    const waLink = createWhatsAppDeepLink(lead.phone, waPitch);
    expect(waLink).toContain('https://wa.me/14155550192?text=');
    expect(waPitch).toContain('Muhammad Waqas');
    expect(waPitch).toContain('2-minute video walkthrough');

    // Excel export row sanitization
    const exportRows = formatLeadsForExport([lead]);
    expect(exportRows[0]['Pipeline Stage']).toBe('WON');
    expect(exportRows[0]['Estimated Budget']).toBe('$3,500 – $6,000');
    expect(exportRows[0]['Contact Status']).toBe('Closed Won');

    // Dual-Mode Firestore storage sanitization
    const firestoreSafeLead = sanitizeForFirestore(lead);
    expect(firestoreSafeLead.businessName).toBe('Lumina Cloud Analytics');
    expect(firestoreSafeLead.estimatedBudget).toBe('$3,500 – $6,000');
  });

  describe('Adherence to Developer Constraints and Anti-Hallucination Rules', () => {
    it('detects skill gaps when tech outside developer profile is requested', () => {
      const flutterLead: Partial<Lead> = {
        businessName: 'MobileHealth Inc',
        suggestedService: 'Flutter iOS / Android App and Python Django Server',
      };

      const breakdown = calculateExplainableScore(flutterLead);
      expect(breakdown.skillMatchStatus).toBe('SKILL_GAP');
      expect(breakdown.skillGapWarning).toContain('SKILL GAP — VERIFY BEFORE OUTREACH');
    });

    it('withholds budget estimates when no audit or scope evidence exists', () => {
      const blindLead: Partial<Lead> = {
        businessName: 'Corner Florist',
        auditStatus: 'Pending',
      };

      const estimate = estimateProjectValue(blindLead);
      expect(estimate.estimatedValueRange).toBeNull();
      expect(estimate.disclaimer).toContain('withheld');
    });

    it('neutralizes malicious formula injection strings in spreadsheet exports', () => {
      expect(sanitizeCellValue('=HYPERLINK("http://evil.com","Click")')).toBe('\'=HYPERLINK("http://evil.com","Click")');
      expect(sanitizeCellValue('@SUM(1+1)')).toBe('\'@SUM(1+1)');
      expect(sanitizeCellValue('+4412345')).toBe('\'+4412345');
      expect(sanitizeCellValue('-1000')).toBe('\'-1000');
    });
  });
});
