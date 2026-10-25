import { describe, it, expect } from 'vitest';
import { 
  determineLeadStage, 
  calculateExplainableScore, 
  estimateProjectValue, 
  checkIsDuplicate, 
  checkIsSuppressed,
  normalizeDomain 
} from '../../src/utils/leadPipeline';
import { Lead, SuppressedDomainRecord } from '../../src/types';

describe('Lead Pipeline Stage Determination (9-Stage Lifecycle)', () => {
  it('correctly classifies a raw discovered business with no contact info as DISCOVERED', () => {
    const rawLead: Partial<Lead> = {
      businessName: 'Apex Dental Care',
      website: 'Not found',
      email: 'Not found',
      verificationStatus: 'UNVERIFIED',
      auditStatus: 'Pending',
    };
    expect(determineLeadStage(rawLead)).toBe('DISCOVERED');
  });

  it('correctly classifies verified business identity as IDENTITY_VERIFIED', () => {
    const verifiedLead: Partial<Lead> = {
      businessName: 'Apex Dental Care',
      website: 'apexdental.com',
      phone: '+1 555-0199',
      verificationStatus: 'VERIFIED',
      verificationScore: 85,
      auditStatus: 'Pending',
    };
    expect(determineLeadStage(verifiedLead)).toBe('IDENTITY_VERIFIED');
  });

  it('classifies leads with auditDetails but pending contact as WEBSITE_REVIEWED or OPPORTUNITY_QUALIFIED', () => {
    const auditedLead: Partial<Lead> = {
      businessName: 'Nova SaaS Corp',
      website: 'https://novasaas.io',
      auditStatus: 'Audited',
      auditDetails: {
        url: 'https://novasaas.io',
        cleanUrl: 'https://novasaas.io',
        isReachable: true,
        hasSSL: true,
        hasMobileViewport: true,
        hasCTA: true,
        ctaElementsFound: ['Book Demo'],
        hasPhoneLink: false,
        hasEmailLink: false,
        hasContactForm: true,
        detectedTech: ['React', 'Next.js'],
        speedRating: 'Fast',
        auditIssues: [],
        technicalStrengths: ['Responsive Viewport OK'],
        findings: [],
        auditedAt: new Date().toISOString(),
      },
    };
    expect(determineLeadStage(auditedLead)).toBe('OPPORTUNITY_QUALIFIED');
  });

  it('classifies qualified lead with direct email as CONTACT_READY', () => {
    const contactReadyLead: Partial<Lead> = {
      businessName: 'Nova SaaS Corp',
      website: 'https://novasaas.io',
      email: 'founder@novasaas.io',
      auditStatus: 'Audited',
      auditDetails: {
        url: 'https://novasaas.io',
        cleanUrl: 'https://novasaas.io',
        isReachable: true,
        hasSSL: true,
        hasMobileViewport: false,
        hasCTA: false,
        ctaElementsFound: [],
        hasPhoneLink: false,
        hasEmailLink: false,
        hasContactForm: false,
        detectedTech: ['WordPress'],
        speedRating: 'Slow',
        auditIssues: ['Missing mobile viewport'],
        technicalStrengths: [],
        findings: [],
        auditedAt: new Date().toISOString(),
      },
    };
    expect(determineLeadStage(contactReadyLead)).toBe('CONTACT_READY');
  });

  it('classifies lifecycle progression for outreach, response, and deal closure', () => {
    expect(determineLeadStage({ contactStatus: 'Contacted' })).toBe('CONTACTED');
    expect(determineLeadStage({ contactStatus: 'Follow-Up Due' })).toBe('CONTACTED');
    expect(determineLeadStage({ contactStatus: 'Replied' })).toBe('REPLIED');
    expect(determineLeadStage({ contactStatus: 'Negotiating' })).toBe('REPLIED');
    expect(determineLeadStage({ contactStatus: 'Closed Won' })).toBe('WON');
    expect(determineLeadStage({ contactStatus: 'Closed Lost' })).toBe('LOST');
    expect(determineLeadStage({ contactStatus: 'Declined' })).toBe('LOST');
  });
});

describe('Agent Kashi 0-100 Qualification Rubric', () => {
  it('strictly adheres to the 25/20/20/15/10/10 weight breakdown and calculates max 100', () => {
    const perfectLead: Partial<Lead> = {
      businessName: 'Growth Velocity Agency',
      website: 'https://growthvelocity.com',
      industry: 'Web & Marketing Agencies',
      leadStrategy: 'AGENCY_PARTNERSHIPS',
      suggestedService: 'SaaS MVP Frontend & Dashboard Interface',
      verificationStatus: 'VERIFIED',
      phone: '+1 555-1234',
      email: 'partner@growthvelocity.com',
      auditDetails: {
        url: 'https://growthvelocity.com',
        cleanUrl: 'https://growthvelocity.com',
        isReachable: true,
        hasSSL: true,
        hasMobileViewport: false, // Critical responsive defect -> 20 pts need
        hasCTA: false,
        ctaElementsFound: [],
        hasPhoneLink: false,
        hasEmailLink: false,
        hasContactForm: false,
        detectedTech: [],
        speedRating: 'Slow',
        auditIssues: ['Missing mobile viewport meta tag'],
        technicalStrengths: [],
        findings: [],
        auditedAt: new Date().toISOString(),
      },
    };

    const breakdown = calculateExplainableScore(perfectLead);
    expect(breakdown.budgetPotentialScore).toBeLessThanOrEqual(25);
    expect(breakdown.needScore).toBeLessThanOrEqual(20);
    expect(breakdown.skillMatchScore).toBeLessThanOrEqual(20);
    expect(breakdown.clientQualityScore).toBeLessThanOrEqual(15);
    expect(breakdown.projectQualityScore).toBeLessThanOrEqual(10);
    expect(breakdown.relationshipPotentialScore).toBeLessThanOrEqual(10);
    expect(breakdown.totalScore).toBeLessThanOrEqual(100);
    expect(breakdown.totalScore).toBeGreaterThanOrEqual(80);
    expect(breakdown.category).toBe('HOT LEAD');
  });

  it('detects skill gaps and flags "SKILL GAP — VERIFY BEFORE OUTREACH"', () => {
    const pythonLead: Partial<Lead> = {
      businessName: 'DataAI Labs',
      suggestedService: 'Backend Python Django API and Flutter Mobile App',
      industry: 'AI Machine Learning',
    };

    const breakdown = calculateExplainableScore(pythonLead);
    expect(breakdown.skillMatchStatus).toBe('SKILL_GAP');
    expect(breakdown.skillGaps.length).toBeGreaterThan(0);
    expect(breakdown.skillGapWarning).toContain('SKILL GAP — VERIFY BEFORE OUTREACH');
    expect(breakdown.skillMatchScore).toBeLessThan(15);
  });

  it('gives relationship bonus to Agency Partnerships without penalizing existing web services', () => {
    const agencyLead: Partial<Lead> = {
      businessName: 'Pixel Crafted Studios',
      industry: 'Web & Marketing Agencies',
      leadStrategy: 'AGENCY_PARTNERSHIPS',
      suggestedService: 'Frontend Subcontractor & Overflow React Implementation',
      verificationStatus: 'VERIFIED',
      website: 'https://pixelcrafted.agency',
    };

    const breakdown = calculateExplainableScore(agencyLead);
    expect(breakdown.relationshipPotentialScore).toBe(10);
  });
});

describe('Budget Estimation Evidence Discipline', () => {
  it('returns null budget when no scope or audit evidence is present (never invent budgets)', () => {
    const unverifiedLead: Partial<Lead> = {
      businessName: 'Corner Bakery',
      website: 'https://cornerbakery.com',
      auditStatus: 'Pending',
      suggestedService: undefined,
    };

    const estimate = estimateProjectValue(unverifiedLead);
    expect(estimate.estimatedValueRange).toBeNull();
    expect(estimate.confidence).toBe('Unverified');
    expect(estimate.disclaimer).toContain('withheld');
  });

  it('calculates evidence-backed high-value range for verified SaaS MVP or Portal scope', () => {
    const saasLead: Partial<Lead> = {
      businessName: 'HealthTrack Software',
      suggestedService: 'SaaS Analytics Dashboard & Client Portal MVP',
      auditStatus: 'Audited',
      auditDetails: {
        url: 'https://healthtrack.com',
        cleanUrl: 'https://healthtrack.com',
        isReachable: true,
        hasSSL: true,
        hasMobileViewport: true,
        hasCTA: true,
        ctaElementsFound: ['Get Started'],
        hasPhoneLink: false,
        hasEmailLink: true,
        hasContactForm: true,
        detectedTech: ['React'],
        speedRating: 'Fast',
        auditIssues: ['Navigation structure'],
        technicalStrengths: [],
        findings: [],
        auditedAt: new Date().toISOString(),
      },
    };

    const estimate = estimateProjectValue(saasLead);
    expect(estimate.estimatedValueRange).toBe('$3,500 – $6,000');
    expect(estimate.confidence).toBe('High');
  });
});

describe('Deduplication and Domain Suppression', () => {
  it('correctly normalizes domains across protocol, www, paths, and query params', () => {
    expect(normalizeDomain('https://www.example.com/pricing?ref=google')).toBe('example.com');
    expect(normalizeDomain('http://sub.domain.co.uk/')).toBe('sub.domain.co.uk');
    expect(normalizeDomain('contact@acmecorp.com')).toBe('acmecorp.com');
  });

  it('identifies duplicates based on matching domain, email, or exact business name', () => {
    const existingList: Lead[] = [
      {
        id: '1',
        businessName: 'Acme Digital Inc',
        website: 'https://acmedigital.com',
        email: 'info@acmedigital.com',
        contactPerson: 'Jane Doe',
        phone: '555-1234',
        industry: 'Tech',
        country: 'USA',
        score: 80,
        temperature: 'HOT',
        contactStatus: 'Not Contacted',
        websiteStatus: 'Active',
        suggestedService: 'Modernization',
        auditIssue: 'Speed',
        pitchHook: 'Hello',
        mobileViewport: true,
        clearCTA: true,
        speedRating: 'Fast',
        auditStatus: 'Audited',
        createdAt: new Date().toISOString(),
      },
    ];

    expect(checkIsDuplicate({ website: 'https://www.acmedigital.com/contact' }, existingList)).toBe(true);
    expect(checkIsDuplicate({ email: 'info@acmedigital.com' }, existingList)).toBe(true);
    expect(checkIsDuplicate({ businessName: 'Acme Digital Inc' }, existingList)).toBe(true);
    expect(checkIsDuplicate({ website: 'https://othercompany.com', businessName: 'Unique Entity' }, existingList)).toBe(false);
  });

  it('detects suppressed domains or competitors', () => {
    const suppressedList: SuppressedDomainRecord[] = [
      {
        id: 'sup-1',
        domainOrEmail: 'competitor.com',
        businessName: 'Competitor Agency',
        reason: 'Competitor',
        suppressedAt: new Date().toISOString(),
      },
    ];

    expect(checkIsSuppressed({ website: 'https://www.competitor.com/blog' }, suppressedList)).toBe(true);
    expect(checkIsSuppressed({ businessName: 'Competitor Agency' }, suppressedList)).toBe(true);
    expect(checkIsSuppressed({ website: 'https://legitclient.com' }, suppressedList)).toBe(false);
  });
});
