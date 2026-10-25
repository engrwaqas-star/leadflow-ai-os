import { Lead, LeadStage, LeadStrategy, SuppressedDomainRecord } from '../types';

export interface ScoreBreakdown {
  totalScore: number;
  budgetPotentialScore: number; // max 25 ($2,000+ budget potential)
  needScore: number; // max 20 (immediate or possible developer need)
  skillMatchScore: number; // max 20 (React/Tailwind/HTML/CSS/Node)
  clientQualityScore: number; // max 15 (legitimate founder/business/agency)
  projectQualityScore: number; // max 10 (portfolio/case-study potential)
  relationshipPotentialScore: number; // max 10 (recurring/long-term potential)
  // Legacy compatibility aliases
  intentScore: number;
  valueScore: number;
  contactabilityScore: number;
  scoreExplanation: string[];
  skillMatchStatus: 'EXCELLENT' | 'GOOD' | 'SKILL_GAP';
  matchedSkills: string[];
  skillGaps: string[];
  skillGapWarning?: string;
  category: 'HOT LEAD' | 'STRONG LEAD' | 'POTENTIAL LEAD' | 'LOW PRIORITY' | 'REJECT';
}

export interface ValueEstimate {
  estimatedValueRange: string | null;
  confidence: 'High' | 'Medium' | 'Low' | 'Unverified';
  reasons: string[];
  recommendedService: string;
  recommendedPortfolioProject: string;
  disclaimer: string;
}

/**
 * Determine accurate LeadStage in the 9-stage pipeline
 * DISCOVERED → IDENTITY VERIFIED → WEBSITE REVIEWED → OPPORTUNITY QUALIFIED → CONTACT READY → OUTREACH DRAFTED → CONTACTED → REPLIED → WON / LOST
 */
export function determineLeadStage(lead: Partial<Lead>): LeadStage {
  if (lead.contactStatus === 'Closed Won') return 'WON';
  if (lead.contactStatus === 'Closed Lost' || lead.contactStatus === 'Declined') return 'LOST';
  if (lead.contactStatus === 'Replied' || lead.contactStatus === 'Negotiating') return 'REPLIED';
  if (lead.contactStatus === 'Contacted' || lead.contactStatus === 'Follow-Up Due') return 'CONTACTED';
  
  const hasDirectContact = Boolean(lead.email && lead.email !== 'Not found' && !lead.email.includes('example.com') && !lead.email.includes('domain.com'));

  if (lead.stage === 'OUTREACH_DRAFTED') return 'OUTREACH_DRAFTED';
  if (lead.stage === 'OPPORTUNITY_QUALIFIED') {
    if (hasDirectContact) return 'CONTACT_READY';
    return 'OPPORTUNITY_QUALIFIED';
  }
  
  // Audited and has concrete issues or strengths
  if (lead.auditStatus === 'Audited' && lead.auditDetails?.isReachable) {
    if (hasDirectContact) return 'CONTACT_READY';
    return 'OPPORTUNITY_QUALIFIED';
  }

  // Website was reviewed / probed
  if (lead.auditStatus === 'Audited' || lead.auditDetails) {
    return 'WEBSITE_REVIEWED';
  }

  // Identity verified
  if (lead.verificationStatus === 'VERIFIED' || (lead.verificationScore && lead.verificationScore >= 70)) {
    return 'IDENTITY_VERIFIED';
  }

  return 'DISCOVERED';
}

/**
 * Extract clean canonical domain from URL or email address
 */
export function normalizeDomain(input?: string): string {
  if (!input) return '';
  let str = input.toLowerCase().trim();
  if (str.includes('@')) {
    str = str.split('@')[1] || '';
  }
  str = str.replace(/^https?:\/\//, '').replace(/^www\./, '');
  str = str.split('/')[0].split('?')[0].split('#')[0];
  return str;
}

/**
 * Normalize string for fuzzy comparison (letters and numbers only)
 */
export function normalizeString(str?: string): string {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Check if a lead matches any suppressed domain, email, or business name
 */
export function checkIsSuppressed(
  lead: { website?: string; email?: string; businessName?: string },
  suppressedList: SuppressedDomainRecord[]
): boolean {
  if (!suppressedList || suppressedList.length === 0) return false;

  const leadDomain = normalizeDomain(lead.website);
  const leadEmail = lead.email ? lead.email.toLowerCase().trim() : '';
  const leadName = normalizeString(lead.businessName);

  return suppressedList.some((record) => {
    const recTerm = record.domainOrEmail.toLowerCase().trim();
    const recName = record.businessName ? normalizeString(record.businessName) : '';

    if (leadDomain && (recTerm === leadDomain || recTerm.includes(leadDomain))) return true;
    if (leadEmail && (recTerm === leadEmail || leadEmail.includes(recTerm))) return true;
    if (leadName && recName && (leadName === recName || leadName.includes(recName))) return true;

    return false;
  });
}

/**
 * Check if a lead already exists in active lead database
 */
export function checkIsDuplicate(
  lead: { website?: string; email?: string; businessName?: string },
  existingLeads: Lead[]
): boolean {
  if (!existingLeads || existingLeads.length === 0) return false;

  const leadDomain = normalizeDomain(lead.website);
  const leadEmail = lead.email ? lead.email.toLowerCase().trim() : '';
  const leadName = normalizeString(lead.businessName);

  return existingLeads.some((existing) => {
    if (existing.archived || existing.trashed || existing.suppressed) return false;

    const exDomain = normalizeDomain(existing.website);
    const exEmail = existing.email ? existing.email.toLowerCase().trim() : '';
    const exName = normalizeString(existing.businessName);

    if (leadDomain && exDomain && leadDomain === exDomain) return true;
    if (leadEmail && exEmail && leadEmail === exEmail) return true;
    if (leadName && exName && leadName.length > 3 && leadName === exName) return true;

    return false;
  });
}

/**
 * Calculate Agent Kashi 0-100 Rubric Qualification Score
 * Budget Potential (25) | Need (20) | Skill Match (20) | Client Quality (15) | Project Quality (10) | Relationship Potential (10)
 */
export function calculateExplainableScore(
  lead: Partial<Lead>,
  userProfileSkills: string[] = ['HTML5', 'CSS3', 'JavaScript', 'React', 'TypeScript', 'Tailwind CSS', 'Node.js', 'Express', 'Git', 'Responsive Design']
): ScoreBreakdown {
  const normSkills = userProfileSkills.map((s) => s.toLowerCase());
  const auditText = `${lead.websiteStatus || ''} ${lead.auditIssue || ''} ${(lead.auditDetails?.auditIssues || []).join(' ')}`.toLowerCase();
  const serviceText = (lead.suggestedService || '').toLowerCase();
  const industryText = (lead.industry || '').toLowerCase();

  // 1. Budget Potential (max 25 pts)
  // 25 = $2,000+ budget, 20 = $1k–$2k, 15 = moderate, 5 = low
  let budgetPotentialScore = 15;
  if (serviceText.includes('saas') || serviceText.includes('portal') || serviceText.includes('dashboard') || serviceText.includes('mvp') || industryText.includes('saas') || industryText.includes('tech')) {
    budgetPotentialScore = 25; // High-value $2k+ scope
  } else if (serviceText.includes('e-commerce') || serviceText.includes('booking') || industryText.includes('agency')) {
    budgetPotentialScore = 20; // $1k - $2k range
  } else if (auditText.includes('modernization') || auditText.includes('redesign')) {
    budgetPotentialScore = 18;
  } else {
    budgetPotentialScore = 12;
  }

  // 2. Need Score (max 20 pts)
  // 20 = obvious immediate developer need, 10 = possible need
  let needScore = 10;
  if (lead.auditDetails && !lead.auditDetails.hasMobileViewport) {
    needScore = 20; // Verified critical responsive defect
  } else if (lead.auditDetails && lead.auditDetails.responseTimeMs && lead.auditDetails.responseTimeMs > 2000) {
    needScore = 18; // Proven speed bottleneck
  } else if (auditText.includes('viewport') || auditText.includes('mobile') || auditText.includes('slow')) {
    needScore = 17;
  } else if (auditText.includes('cta') || auditText.includes('conversion') || auditText.includes('booking')) {
    needScore = 15;
  } else if (lead.website && lead.website !== 'Not found') {
    needScore = 12;
  } else {
    needScore = 6;
  }

  // 3. Skill Match (max 20 pts)
  // 20 = excellent match with React/Tailwind/HTML/CSS/Node
  const matchedSkills: string[] = [];
  const skillGaps: string[] = [];
  const checkTechs = ['react', 'tailwind', 'javascript', 'html', 'css', 'typescript', 'node'];
  const advancedTechs = ['angular', 'vue', 'python', 'django', 'php', 'laravel', 'flutter', 'ruby', 'aws lambda'];

  checkTechs.forEach((tech) => {
    if (serviceText.includes(tech) || auditText.includes(tech)) {
      matchedSkills.push(tech.toUpperCase());
    }
  });

  advancedTechs.forEach((adv) => {
    if (serviceText.includes(adv) || auditText.includes(adv)) {
      skillGaps.push(adv.toUpperCase());
    }
  });

  let skillMatchScore = 18;
  let skillMatchStatus: 'EXCELLENT' | 'GOOD' | 'SKILL_GAP' = 'EXCELLENT';
  let skillGapWarning: string | undefined = undefined;

  if (skillGaps.length > 0) {
    skillMatchScore = 10;
    skillMatchStatus = 'SKILL_GAP';
    skillGapWarning = `SKILL GAP — VERIFY BEFORE OUTREACH: Client requirement mentions ${skillGaps.join(', ')}`;
  } else if (matchedSkills.length >= 1 || serviceText.includes('frontend') || serviceText.includes('responsive')) {
    skillMatchScore = 20;
    skillMatchStatus = 'EXCELLENT';
    if (matchedSkills.length === 0) matchedSkills.push('REACT', 'TAILWIND');
  } else {
    skillMatchScore = 15;
    skillMatchStatus = 'GOOD';
  }

  // 4. Client Quality (max 15 pts)
  // 15 = legitimate founder/business/agency
  let clientQualityScore = 8;
  if (lead.verificationStatus === 'VERIFIED') clientQualityScore += 4;
  if (lead.phone && lead.phone !== 'Not found') clientQualityScore += 2;
  if (lead.email && lead.email !== 'Not found' && !lead.email.includes('example.com')) clientQualityScore += 1;
  clientQualityScore = Math.min(15, clientQualityScore);

  // 5. Project Quality (max 10 pts)
  // 10 = excellent portfolio/case-study opportunity
  let projectQualityScore = 7;
  if (serviceText.includes('saas') || serviceText.includes('dashboard') || serviceText.includes('portal') || serviceText.includes('redesign')) {
    projectQualityScore = 10;
  } else if (industryText.includes('agency') || industryText.includes('healthcare') || industryText.includes('education')) {
    projectQualityScore = 9;
  }

  // 6. Relationship Potential (max 10 pts)
  // 10 = recurring/long-term potential (agencies, growing startups)
  let relationshipPotentialScore = 6;
  if (lead.leadStrategy === 'AGENCY_PARTNERSHIPS' || industryText.includes('agency')) {
    relationshipPotentialScore = 10; // Ongoing white-label contract potential
  } else if (serviceText.includes('saas') || industryText.includes('startup')) {
    relationshipPotentialScore = 9;
  }

  const totalScore = Math.min(
    100,
    budgetPotentialScore + needScore + skillMatchScore + clientQualityScore + projectQualityScore + relationshipPotentialScore
  );

  let category: 'HOT LEAD' | 'STRONG LEAD' | 'POTENTIAL LEAD' | 'LOW PRIORITY' | 'REJECT' = 'POTENTIAL LEAD';
  if (totalScore >= 80) category = 'HOT LEAD';
  else if (totalScore >= 65) category = 'STRONG LEAD';
  else if (totalScore >= 50) category = 'POTENTIAL LEAD';
  else if (totalScore >= 30) category = 'LOW PRIORITY';
  else category = 'REJECT';

  const scoreExplanation = [
    `Budget Potential: ${budgetPotentialScore}/25 pts (${budgetPotentialScore >= 20 ? '$2,000+ budget potential' : 'Standard budget tier'})`,
    `Technical Need: ${needScore}/20 pts (${lead.auditIssue || 'Optimization scope identified'})`,
    `Skill Match: ${skillMatchScore}/20 pts (${matchedSkills.join(', ') || 'Frontend React/Tailwind'})`,
    `Client Legitimacy: ${clientQualityScore}/15 pts (${lead.verificationStatus === 'VERIFIED' ? 'Verified business identity' : 'Unconfirmed business identity'})`,
    `Case-Study Value: ${projectQualityScore}/10 pts (Portfolio relevance)`,
    `Relationship Potential: ${relationshipPotentialScore}/10 pts (${lead.leadStrategy === 'AGENCY_PARTNERSHIPS' ? 'Agency subcontracting partner' : 'Direct client engagement'})`,
  ];

  return {
    totalScore,
    budgetPotentialScore,
    needScore,
    skillMatchScore,
    clientQualityScore,
    projectQualityScore,
    relationshipPotentialScore,
    // Aliases
    intentScore: budgetPotentialScore,
    valueScore: clientQualityScore,
    contactabilityScore: needScore,
    scoreExplanation,
    skillMatchStatus,
    matchedSkills,
    skillGaps,
    skillGapWarning,
    category,
  };
}

/**
 * Estimate project value scope ($2,000+ Mode)
 * Strictly evidence-based: Returns null if no verified project scope exists!
 */
export function estimateProjectValue(lead: Partial<Lead>): ValueEstimate {
  const service = (lead.suggestedService || '').toLowerCase();
  const industry = (lead.industry || '').toLowerCase();
  const hasAuditEvidence = Boolean(lead.auditDetails?.isReachable && lead.auditDetails.auditIssues?.length > 0);
  const hasScopeSignal = Boolean(
    service.includes('saas') ||
    service.includes('dashboard') ||
    service.includes('portal') ||
    service.includes('mvp') ||
    service.includes('e-commerce') ||
    service.includes('modernization') ||
    service.includes('redesign') ||
    hasAuditEvidence
  );

  // If the only evidence is that a business exists and has a website without scope: store null!
  if (!hasScopeSignal && (!lead.auditStatus || lead.auditStatus === 'Pending')) {
    return {
      estimatedValueRange: null,
      confidence: 'Unverified',
      reasons: ['No verified website audit or scope requirements collected yet.'],
      recommendedService: lead.suggestedService || 'Website Review & Technical Audit',
      recommendedPortfolioProject: 'Custom Frontend Development',
      disclaimer: 'Budget range is withheld until live technical audit or client discovery confirms implementation scope.',
    };
  }

  let estimatedValueRange: string | null = '$2,000 – $3,500';
  let confidence: 'High' | 'Medium' | 'Low' = 'Medium';
  let recommendedPortfolioProject = 'Modern Responsive Business Site';
  const reasons: string[] = [
    'Estimated multi-page responsive React frontend implementation',
    'Mobile UX optimization and tap-to-call conversion funnel',
    'Custom styling, high-contrast typography, and fast performance tuning',
  ];

  if (service.includes('saas') || service.includes('dashboard') || service.includes('portal') || service.includes('mvp')) {
    estimatedValueRange = '$3,500 – $6,000';
    confidence = 'High';
    recommendedPortfolioProject = 'SaaS Analytics Dashboard & Client Portal';
    reasons.push('Interactive state management, dashboard analytics charts, and client portal layout');
  } else if (service.includes('e-commerce') || service.includes('shop') || service.includes('booking')) {
    estimatedValueRange = '$2,500 – $4,500';
    confidence = 'High';
    recommendedPortfolioProject = 'E-Commerce Frontend & Booking Funnel';
    reasons.push('Custom product catalog views, cart state, and instant appointment booking integration');
  } else if (industry.includes('agency') || industry.includes('real estate') || industry.includes('law')) {
    estimatedValueRange = '$2,000 – $3,200';
    confidence = 'Medium';
    recommendedPortfolioProject = 'High-Converting Real Estate / Agency Redesign';
    reasons.push('High-trust hero section, lead generation form, and mobile speed optimization');
  }

  return {
    estimatedValueRange,
    confidence,
    reasons,
    recommendedService: lead.suggestedService || 'Modern Responsive React Redesign',
    recommendedPortfolioProject,
    disclaimer: 'Estimated from documented scope and functionality requirements. Final contract subject to technical discovery.',
  };
}
