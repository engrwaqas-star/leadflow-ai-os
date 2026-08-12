import { Lead, SuppressedDomainRecord } from '../types';

export interface ScoreBreakdown {
  totalScore: number;
  intentScore: number; // max 30
  needScore: number; // max 25
  skillScore: number; // max 20
  valueScore: number; // max 15
  contactabilityScore: number; // max 10
  scoreExplanation: string[];
  skillMatchStatus: 'EXCELLENT' | 'GOOD' | 'SKILL_GAP';
  matchedSkills: string[];
  skillGaps: string[];
}

export interface ValueEstimate {
  estimatedValueRange: string;
  confidence: 'High' | 'Medium' | 'Low';
  reasons: string[];
  recommendedService: string;
  recommendedPortfolioProject: string;
  disclaimer: string;
}

/**
 * Extract clean canonical domain from URL or email address
 */
export function normalizeDomain(input?: string): string {
  if (!input) return '';
  let str = input.toLowerCase().trim();
  // If email
  if (str.includes('@')) {
    str = str.split('@')[1] || '';
  }
  // Strip protocol and www
  str = str.replace(/^https?:\/\//, '').replace(/^www\./, '');
  // Strip path & query params
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
 * Calculate explainable lead acquisition score (0-100)
 */
export function calculateExplainableScore(
  lead: Partial<Lead>,
  userProfileSkills: string[] = ['HTML5', 'CSS3', 'JavaScript', 'React', 'Responsive Web Design', 'Frontend UI Development', 'Git', 'GitHub']
): ScoreBreakdown {
  const normSkills = userProfileSkills.map((s) => s.toLowerCase());

  // 1. Intent Score (max 30)
  let intentScore = 20;
  if (lead.temperature === 'HOT') intentScore = 28;
  else if (lead.temperature === 'WARM') intentScore = 24;
  else if (lead.temperature === 'POTENTIAL') intentScore = 18;
  else intentScore = 12;

  // 2. Need Score (max 25)
  let needScore = 18;
  const auditText = `${lead.websiteStatus || ''} ${lead.auditIssue || ''}`.toLowerCase();
  if (auditText.includes('slow') || auditText.includes('mobile') || auditText.includes('outdated')) {
    needScore += 5;
  }
  if (auditText.includes('booking') || auditText.includes('cta') || auditText.includes('conversion')) {
    needScore += 2;
  }
  needScore = Math.min(25, needScore);

  // 3. Skill Match Score (max 20)
  const reqTechs = (lead.suggestedService || '').toLowerCase();
  const matchedSkills: string[] = [];
  const skillGaps: string[] = [];

  const coreSkills = ['react', 'javascript', 'html', 'css', 'responsive', 'ui', 'tailwind', 'node', 'typescript', 'next.js'];

  coreSkills.forEach((tech) => {
    if (reqTechs.includes(tech) || auditText.includes(tech)) {
      if (normSkills.some((s) => s.includes(tech))) {
        matchedSkills.push(tech.toUpperCase());
      } else if (tech === 'node' || tech === 'typescript' || tech === 'next.js') {
        skillGaps.push(tech.toUpperCase());
      }
    }
  });

  let skillScore = 18;
  let skillMatchStatus: 'EXCELLENT' | 'GOOD' | 'SKILL_GAP' = 'EXCELLENT';

  if (skillGaps.length > 0) {
    skillScore -= 6;
    skillMatchStatus = 'SKILL_GAP';
  } else if (matchedSkills.length >= 2) {
    skillScore = 20;
    skillMatchStatus = 'EXCELLENT';
  } else {
    skillScore = 16;
    skillMatchStatus = 'GOOD';
  }

  // 4. Project Value Score (max 15)
  let valueScore = 12;
  if (lead.suggestedService?.toLowerCase().includes('saas') || lead.suggestedService?.toLowerCase().includes('portal') || lead.suggestedService?.toLowerCase().includes('dashboard')) {
    valueScore = 15;
  } else if (lead.suggestedService?.toLowerCase().includes('redesign') || lead.suggestedService?.toLowerCase().includes('e-commerce')) {
    valueScore = 13;
  }

  // 5. Contactability Score (max 10)
  let contactabilityScore = 6;
  if (lead.email && !lead.email.includes('example.com')) contactabilityScore += 2;
  if (lead.phone) contactabilityScore += 1;
  if (lead.contactPerson && !lead.contactPerson.includes('Owner')) contactabilityScore += 1;
  contactabilityScore = Math.min(10, contactabilityScore);

  const totalScore = intentScore + needScore + skillScore + valueScore + contactabilityScore;

  const scoreExplanation = [
    `Intent Level: ${intentScore}/30 pts (${lead.temperature || 'WARM'} buyer intent signal)`,
    `Website & UI Need: ${needScore}/25 pts (${lead.auditIssue || 'Optimization required'})`,
    `Technical Skill Match: ${skillScore}/20 pts (${matchedSkills.join(', ') || 'React/HTML/CSS'})`,
    `Project Value Potential: ${valueScore}/15 pts (${lead.suggestedService || 'Custom Frontend'})`,
    `Contactability & Reach: ${contactabilityScore}/10 pts (${lead.email ? 'Direct email verified' : 'General web contact'})`,
  ];

  return {
    totalScore,
    intentScore,
    needScore,
    skillScore,
    valueScore,
    contactabilityScore,
    scoreExplanation,
    skillMatchStatus,
    matchedSkills,
    skillGaps,
  };
}

/**
 * Estimate realistic project value scope ($2,000+ Mode)
 */
export function estimateProjectValue(lead: Partial<Lead>): ValueEstimate {
  const service = (lead.suggestedService || '').toLowerCase();
  const industry = (lead.industry || '').toLowerCase();

  let estimatedValueRange = '$2,000 – $3,500';
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
    disclaimer: 'Estimated from scope and functionality requirement. Actual client budget subject to discovery call.',
  };
}
