import { InboundReply, SmartIntentTag, ClassifierRule, SmartTagCategory } from '../types';

export const DEFAULT_CLASSIFIER_RULES: ClassifierRule[] = [
  {
    id: 'rule-pricing-query',
    name: 'High-Intent Pricing & Package Query',
    targetTag: 'High-Intent Pricing Query',
    category: 'Pricing',
    priority: 'CRITICAL_HOT',
    color: 'emerald',
    enabled: true,
    triggerKeywords: [
      'pricing',
      'price',
      'cost',
      'quote',
      'rates',
      'rate',
      'how much',
      'package',
      'packages',
      'retainer',
      'fee',
      'fees',
      'estimate',
      'budget',
      'charge',
      'expensive',
      'affordable',
      'cost for',
      'price for',
    ],
    intentSignals: [
      'Asking for hourly or fixed project rate',
      'Inquiring about package cost & tiers',
      'Requesting speed optimization quote',
      'Budget evaluation in progress',
    ],
    suggestedAction: 'Send $2,000+ Tiered Frontend Scope ($450 - $1,400 options) & Offer 2-min Video Walkthrough',
  },
  {
    id: 'rule-immediate-project',
    name: 'Immediate Project Need / Ready to Hire',
    targetTag: 'Immediate Project Need',
    category: 'Urgency',
    priority: 'CRITICAL_HOT',
    color: 'amber',
    enabled: true,
    triggerKeywords: [
      'ready to start',
      'hire',
      'hiring',
      'asap',
      'urgent',
      'immediately',
      'this week',
      'start right away',
      'kick off',
      'kickoff',
      'deadline',
      'urgently',
      'available to begin',
      'when can you start',
    ],
    intentSignals: [
      'Urgent launch deadline stated',
      'Immediate availability requested',
      'Developer hiring readiness confirmed',
    ],
    suggestedAction: 'Lock in Kickoff Date immediately and send Developer Engagement Agreement',
  },
  {
    id: 'rule-meeting-request',
    name: 'Meeting / Call Request',
    targetTag: 'Meeting / Call Request',
    category: 'Meeting',
    priority: 'HIGH',
    color: 'indigo',
    enabled: true,
    triggerKeywords: [
      'call',
      'zoom',
      'meet',
      'meeting',
      'google meet',
      'calendly',
      'schedule',
      'phone',
      'talk on phone',
      'quick chat',
      'demo',
      'walkthrough',
      'discuss live',
      'hop on a call',
      'free to chat',
    ],
    intentSignals: [
      'Direct request for phone/Zoom consultation',
      'Invitation to schedule discovery call',
    ],
    suggestedAction: 'Send Google Meet / Calendly 15-min booking link with brief agenda',
  },
  {
    id: 'rule-technical-scope',
    name: 'Technical Scope & Stack Inquiry',
    targetTag: 'Technical Scope Inquiry',
    category: 'Technical',
    priority: 'HIGH',
    color: 'purple',
    enabled: true,
    triggerKeywords: [
      'react',
      'next.js',
      'nextjs',
      'typescript',
      'tailwind',
      'tech stack',
      'stack',
      'wordpress',
      'shopify',
      'lighthouse',
      'core web vitals',
      'page speed',
      'architecture',
      'figma',
      'api',
      'frontend',
      'headless',
      'database',
      'node',
    ],
    intentSignals: [
      'Specific questions on React/Tailwind/Next.js stack',
      'Inquiry into PageSpeed/Lighthouse fixes',
      'Figma to frontend translation inquiry',
    ],
    suggestedAction: 'Attach GoFullPage Benchmark Audit + Lighthouse Proof & Architecture Specs',
  },
  {
    id: 'rule-proposal-request',
    name: 'Proposal & Scope of Work Request',
    targetTag: 'Proposal & SOW Request',
    category: 'Proposal',
    priority: 'HIGH',
    color: 'blue',
    enabled: true,
    triggerKeywords: [
      'proposal',
      'scope of work',
      'sow',
      'deliverables',
      'send details',
      'send proposal',
      'breakdown',
      'contract',
      'specifications',
      'overview of services',
      'formal offer',
    ],
    intentSignals: [
      'Requesting written proposal document',
      'Looking for detailed deliverables checklist',
    ],
    suggestedAction: 'Generate tailored 1-page Frontend Project Proposal & Milestone Schedule',
  },
  {
    id: 'rule-followup-needed',
    name: 'Follow-Up / Team Review in Progress',
    targetTag: 'Follow-up Due',
    category: 'Follow-up',
    priority: 'MEDIUM',
    color: 'cyan',
    enabled: true,
    triggerKeywords: [
      'discuss with team',
      'talk to my partner',
      'touch base',
      'following up',
      'next month',
      'checking with',
      'revisit',
      'keep in touch',
      'get back to you',
      'reviewing this',
      'later this quarter',
    ],
    intentSignals: [
      'Internal stakeholder review occurring',
      'Timeline deferred to future date',
    ],
    suggestedAction: 'Log follow-up task for 5-7 days and send valuable case-study insight',
  },
  {
    id: 'rule-not-interested',
    name: 'Declined / Not Interested',
    targetTag: 'Declined / Not Interested',
    category: 'Negative',
    priority: 'LOW',
    color: 'rose',
    enabled: true,
    triggerKeywords: [
      'not interested',
      'unsubscribe',
      'remove me',
      'no thanks',
      'not looking',
      'have in-house',
      'not right now',
      'stop emailing',
      'do not contact',
      'not hiring',
    ],
    intentSignals: [
      'Explicit decline or unsubscribe request',
    ],
    suggestedAction: 'Auto-suppress record from outreach cadences or mark as Closed Lost',
  },
];

/**
 * Fast Rule-Based Heuristic Classifier
 * Runs on every incoming message instantly
 */
export function classifyMessageByRules(
  message: string,
  subject: string = '',
  sentiment?: string,
  customRules: ClassifierRule[] = DEFAULT_CLASSIFIER_RULES
): {
  tags: SmartIntentTag[];
  primaryTag: SmartIntentTag;
  details: {
    ruleName: string;
    confidence: number;
    explanation: string;
    signals: string[];
    classifiedAt: string;
  };
} {
  const combinedText = `${subject} ${message}`.toLowerCase();
  let matchedTags: SmartIntentTag[] = [];

  for (const rule of customRules) {
    if (!rule.enabled) continue;

    // Check negative keywords first
    if (rule.negativeKeywords?.some((neg) => combinedText.includes(neg.toLowerCase()))) {
      continue;
    }

    const matchedKeywords: string[] = [];
    for (const kw of rule.triggerKeywords) {
      // Word boundary match or substring match for phrases
      if (kw.includes(' ')) {
        if (combinedText.includes(kw.toLowerCase())) {
          matchedKeywords.push(kw);
        }
      } else {
        const regex = new RegExp(`\\b${kw}\\b`, 'i');
        if (regex.test(combinedText)) {
          matchedKeywords.push(kw);
        }
      }
    }

    if (matchedKeywords.length > 0) {
      // Calculate confidence based on keyword density and sentiment alignment
      let baseConfidence = 75 + Math.min(matchedKeywords.length * 8, 22);
      if (rule.category === 'Pricing' && sentiment === 'Price Inquiry') baseConfidence = Math.min(baseConfidence + 6, 99);
      if (rule.category === 'Urgency' && sentiment === 'Hot Interest') baseConfidence = Math.min(baseConfidence + 8, 99);
      if (rule.category === 'Proposal' && sentiment === 'Send Proposal') baseConfidence = Math.min(baseConfidence + 6, 98);
      if (rule.category === 'Negative' && sentiment === 'Not Interested') baseConfidence = 99;

      matchedTags.push({
        id: `tag-${rule.id}-${Date.now()}`,
        label: rule.targetTag,
        category: rule.category,
        confidence: baseConfidence,
        color: rule.color,
        priority: rule.priority,
        matchedRule: rule.name,
        suggestedAction: rule.suggestedAction,
        keyPhrasesMatched: matchedKeywords,
      });
    }
  }

  // If no specific rule triggered, use fallback based on sentiment or general interest
  if (matchedTags.length === 0) {
    if (sentiment === 'Price Inquiry') {
      const pricingRule = DEFAULT_CLASSIFIER_RULES[0];
      matchedTags.push({
        id: 'tag-default-pricing',
        label: pricingRule.targetTag,
        category: pricingRule.category,
        confidence: 82,
        color: pricingRule.color,
        priority: pricingRule.priority,
        matchedRule: 'Sentiment Inferred Pricing Rule',
        suggestedAction: pricingRule.suggestedAction,
        keyPhrasesMatched: ['sentiment: price inquiry'],
      });
    } else if (sentiment === 'Hot Interest') {
      const urgencyRule = DEFAULT_CLASSIFIER_RULES[1];
      matchedTags.push({
        id: 'tag-default-interest',
        label: urgencyRule.targetTag,
        category: urgencyRule.category,
        confidence: 85,
        color: urgencyRule.color,
        priority: urgencyRule.priority,
        matchedRule: 'High Interest Intent Rule',
        suggestedAction: urgencyRule.suggestedAction,
        keyPhrasesMatched: ['sentiment: hot interest'],
      });
    } else if (sentiment === 'Not Interested') {
      const negRule = DEFAULT_CLASSIFIER_RULES[6];
      matchedTags.push({
        id: 'tag-default-negative',
        label: negRule.targetTag,
        category: negRule.category,
        confidence: 90,
        color: negRule.color,
        priority: negRule.priority,
        matchedRule: 'Negative Sentiment Rule',
        suggestedAction: negRule.suggestedAction,
      });
    } else {
      // General Lead Inquiry
      matchedTags.push({
        id: 'tag-general-inquiry',
        label: 'High-Intent Pricing Query',
        category: 'Pricing',
        confidence: 78,
        color: 'emerald',
        priority: 'HIGH',
        matchedRule: 'Default Inbound Lead Intent Classifier',
        suggestedAction: 'Send $2,000+ Tiered Frontend Scope & Offer Video Walkthrough',
        keyPhrasesMatched: ['inbound reply received'],
      });
    }
  }

  // If an explicit decline / opt-out occurred, it takes precedence as primary tag to safeguard against unwanted outreach
  const negativeTag = matchedTags.find((t) => t.category === 'Negative');
  if (negativeTag) {
    matchedTags = [negativeTag, ...matchedTags.filter((t) => t !== negativeTag)];
  } else {
    // Sort matched tags by priority & confidence
    const priorityOrder: Record<string, number> = {
      CRITICAL_HOT: 4,
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1,
    };

    matchedTags.sort((a, b) => {
      const pDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      if (pDiff !== 0) return pDiff;
      return b.confidence - a.confidence;
    });
  }

  const primaryTag = matchedTags[0];

  return {
    tags: matchedTags,
    primaryTag,
    details: {
      ruleName: primaryTag.matchedRule,
      confidence: primaryTag.confidence,
      explanation: `Matched intent category "${primaryTag.category}" with key phrases: ${(primaryTag.keyPhrasesMatched || []).join(', ') || 'Inferred semantic context'}.`,
      signals: primaryTag.keyPhrasesMatched || [],
      classifiedAt: new Date().toISOString(),
    },
  };
}

/**
 * Enriches an InboundReply object with Smart Intent Tags in the processing flow
 */
export function processAndSmartTagReply(reply: InboundReply): InboundReply {
  const result = classifyMessageByRules(reply.message, reply.subject, reply.sentiment);

  // Map to IntentClassification
  let mappedIntent = reply.intent;
  if (!mappedIntent) {
    if (result.primaryTag.category === 'Pricing') mappedIntent = 'Pricing Query';
    else if (result.primaryTag.category === 'Meeting') mappedIntent = 'Meeting Request';
    else if (result.primaryTag.category === 'Technical') mappedIntent = 'Technical Inquiry';
    else if (result.primaryTag.category === 'Proposal') mappedIntent = 'Scope Request';
    else if (result.primaryTag.category === 'Follow-up') mappedIntent = 'Follow-up';
    else if (result.primaryTag.category === 'Negative') mappedIntent = 'Not Interested';
    else mappedIntent = 'Interested';
  }

  return {
    ...reply,
    intent: mappedIntent,
    smartTags: result.tags,
    primaryIntentTag: result.primaryTag,
    classificationDetails: result.details,
  };
}
