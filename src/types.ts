export type Temperature = 'HOT' | 'HIGH' | 'GOOD' | 'WARM' | 'RESEARCH' | 'POTENTIAL' | 'LOW' | 'REJECT';

export type ContactStatus = 
  | 'Not Contacted' 
  | 'Contacted' 
  | 'Follow-Up Due' 
  | 'Replied' 
  | 'Negotiating'
  | 'Closed Won' 
  | 'Declined'
  | 'Closed Lost'
  | 'NO_VERIFIED_EMAIL'
  | 'VERIFIED_EMAIL'
  | 'FORM_ONLY'
  | 'PHONE_ONLY';

export type EmailStatus = 
  | 'DRAFT' 
  | 'APPROVED' 
  | 'SENDING' 
  | 'SENT' 
  | 'SEND_FAILED' 
  | 'BOUNCED' 
  | 'REPLIED' 
  | 'NO_REPLY' 
  | 'UNSUBSCRIBED' 
  | 'OPENED';

export type SpeedRating = 'Fast' | 'Average' | 'Slow';

export type AuditStatus = 'Pending' | 'Audited' | 'Critical Issues';

export type LeadRecordStatus = 'active' | 'archived' | 'suppressed' | 'trashed';

export type CleanupReason = 
  | 'Irrelevant'
  | 'Duplicate'
  | 'Fake'
  | 'Outdated'
  | 'Wrong Location'
  | 'Wrong Industry'
  | 'No Response'
  | 'Not Interested'
  | 'Test Data'
  | 'Demo Data'
  | 'Bad Contact'
  | 'Bad Website'
  | 'Competitor'
  | 'Other'
  | 'demo_data' 
  | 'duplicate' 
  | 'unresponsive' 
  | 'invalid_contact' 
  | 'bounced_email' 
  | 'outdated_research' 
  | 'not_a_fit' 
  | 'suppressed_domain' 
  | 'manual';

export type LeadStage =
  | 'DISCOVERED'
  | 'IDENTITY_VERIFIED'
  | 'WEBSITE_REVIEWED'
  | 'OPPORTUNITY_QUALIFIED'
  | 'CONTACT_READY'
  | 'OUTREACH_DRAFTED'
  | 'CONTACTED'
  | 'REPLIED'
  | 'WON'
  | 'LOST';

export type LeadStrategy = 'DIRECT_CLIENTS' | 'AGENCY_PARTNERSHIPS';

export interface FindingItem {
  observation: string;
  evidence: string;
  source: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  confidence: number; // 0-100
  suggestedImprovement: string;
  timestamp: string;
}

export interface WebsiteAuditResult {
  url: string;
  cleanUrl: string;
  isReachable: boolean;
  httpStatus?: number;
  statusText?: string;
  responseTimeMs?: number;
  hasSSL: boolean;
  hasMobileViewport: boolean;
  viewportContent?: string;
  pageTitle?: string;
  metaDescription?: string;
  h1Count?: number;
  h1Text?: string;
  hasCTA: boolean;
  ctaElementsFound: string[];
  hasPhoneLink: boolean;
  hasEmailLink: boolean;
  hasContactForm: boolean;
  detectedTech: string[];
  speedRating: 'Fast' | 'Average' | 'Slow' | 'Unreachable';
  auditIssues: string[];
  technicalStrengths: string[];
  findings?: FindingItem[];
  auditedAt: string;
  rawPayloadBytes?: number;
  errorMessage?: string;
}

export interface EvidenceItem {
  problem: string;
  evidence: string;
  source: string;
  confidence: number;
}

export interface LeadScoreBreakdown {
  // Agent Kashi 0-100 Rubric
  budgetPotentialScore?: number; // 0–25 pts ($2,000+ budget)
  needScore?: number; // 0–20 pts (immediate/possible developer need)
  skillMatchScore?: number; // 0–20 pts (React/Tailwind/HTML/CSS/Node)
  clientQualityScore?: number; // 0–15 pts (legitimate founder/business/agency)
  projectQualityScore?: number; // 0–10 pts (portfolio/case-study potential)
  relationshipPotentialScore?: number; // 0–10 pts (recurring/long-term potential)
  // Legacy / Explainable fields
  authenticityScore?: number; // 0–20 pts (Business authenticity)
  contactQualityScore?: number; // 0–15 pts (Contact quality)
  websiteOpportunityScore?: number; // 0–25 pts (Website opportunity)
  serviceFitScore?: number; // 0–20 pts (Service fit)
  commercialScore?: number; // 0–10 pts (Commercial potential)
  activityRecencyScore?: number; // 0–10 pts (Activity/recency evidence)
  totalLeadScore: number; // 0–100 sum
}

export interface OutreachQualityChecklist {
  recipientEmailVerified: boolean;
  businessIsReal: boolean;
  personalizationEvidenceBased: boolean;
  noFabricatedClaims: boolean;
  noFakeStatistics: boolean;
  noMisleadingStatements: boolean;
  clearReasonForContacting: boolean;
  conciseLength: boolean;
  legitimateSenderIdentity: boolean;
  optOutHandlingAvailable: boolean;
  correctLeadAttached: boolean;
  userApprovalRecorded: boolean;
}

export interface GmailMessageRecord {
  id: string;
  leadId: string;
  businessName: string;
  recipient: string;
  sender: string;
  subject: string;
  body: string;
  timestamp: string;
  status: EmailStatus;
  gmail_message_id?: string;
  gmail_thread_id?: string;
  errorCode?: string;
  errorMessage?: string;
  rawResponse?: any;
  qualityChecklistPassed: boolean;
  repliedAt?: string;
  replySnippet?: string;
}

export interface DashboardMetrics {
  totalDiscovered: number;
  verified: number;
  qualified: number;
  hot: number;
  outreachPrepared: number;
  sent: number;
  failed: number;
  bounced: number;
  replies: number;
  meetings: number;
  revenue: number;
}

export interface CompanyEnrichment {
  linkedinUrl?: string;
  twitterUrl?: string;
  employeeCount?: string;
  foundedYear?: string;
  techStack?: string[];
  headquarters?: string;
  description?: string;
  revenueRange?: string;
  keyDecisionMakers?: string[];
}

export interface CredibilityData {
  hasSSL: boolean;
  hasMobileViewport: boolean;
  hasMetaTags: boolean;
  seoGrade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  credibilityScore: number; // 0-100
  securityStatus: 'Secure (HTTPS)' | 'Not Secure (HTTP)' | 'Unknown';
}

export interface Lead {
  id: string;
  lead_id?: string;
  businessName: string;
  business_name?: string;
  contactPerson: string;
  email: string;
  email_source?: string;
  google_place_id?: string;
  source_urls?: string[];
  rating?: number | null;
  review_count?: number | null;
  business_status?: string;
  phone: string;
  website: string;
  industry: string;
  category?: string;
  country: string;
  city?: string;
  address?: string;
  score: number; // 0-100
  lead_score?: number;
  temperature: Temperature;
  lead_temperature?: Temperature;
  contactStatus: ContactStatus;
  contact_status?: ContactStatus;
  websiteStatus: string;
  suggestedService: string;
  recommended_service?: string;
  auditIssue: string;
  source?: string;
  sourceUrl?: string;
  source_url?: string;
  provider?: string;
  provider_record_id?: string;
  retrieved_at?: string;
  problems?: string[];
  evidence?: EvidenceItem[];
  personalization_facts?: string[];
  pitchHook: string;
  lastContactDate?: string; // YYYY-MM-DD
  mobileViewport: boolean;
  clearCTA: boolean;
  speedRating: SpeedRating;
  auditStatus: AuditStatus;
  notes?: string;
  createdAt: string;
  auditScreenshotUrl?: string;
  auditScreenshotName?: string;
  auditVideoUrl?: string;
  auditVideoName?: string;
  afterScreenshotUrl?: string;
  afterScreenshotName?: string;
  afterVideoUrl?: string;
  afterVideoName?: string;
  developerNotes?: string;
  beforeAfterSolution?: {
    beforeScore: number;
    afterScore: number;
    beforeLoadTime: string;
    afterLoadTime: string;
    beforeIssues: string[];
    afterFixes: string[];
    shareableProofLink: string;
  };
  scoreBreakdown?: LeadScoreBreakdown;
  authenticity_score?: number;
  contact_quality_score?: number;
  opportunity_score?: number;
  service_fit_score?: number;
  commercial_score?: number;
  activity_recency_score?: number;
  verificationScore?: number;
  verificationStatus?: 'VERIFIED' | 'UNVERIFIED' | 'REJECTED';
  verification_status?: 'VERIFIED' | 'UNVERIFIED' | 'REJECTED';
  fieldVerification?: {
    companyNameVerified: boolean;
    locationVerified: boolean;
    industryVerified: boolean;
    websiteVerified: boolean;
    phoneVerified: boolean;
    emailVerified: boolean;
    contactPersonVerified: boolean;
  };
  rejectionReason?: string;
  // Enriched fields
  enrichment?: CompanyEnrichment;
  credibility?: CredibilityData;

  // Lead Pipeline Stage (9 explicit stages)
  stage?: LeadStage;
  leadStrategy?: LeadStrategy;
  estimatedBudget?: string | null;
  niche?: string;
  auditDetails?: WebsiteAuditResult;
  skillGaps?: string[];

  // Cleanup & Data Management Fields
  archived?: boolean;
  suppressed?: boolean;
  trashed?: boolean;
  trashedAt?: string;
  isDemo?: boolean;
  suppressReason?: CleanupReason;
  archiveReason?: CleanupReason;
  trashReason?: CleanupReason;
  recordStatus?: LeadRecordStatus;
}

export interface TrashItem {
  id: string;
  originalType: 'Lead' | 'Draft' | 'Search' | 'Opportunity' | 'Note';
  originalId: string;
  title: string;
  description: string;
  deletedAt: string;
  reason?: CleanupReason | string;
  payload: any; // Full original item to enable exact restoration
}

export interface SuppressedDomainRecord {
  id: string;
  domainOrEmail: string;
  businessName?: string;
  reason: CleanupReason | string;
  suppressedAt: string;
}

export interface SearchHistoryEntry {
  id: string;
  query: string;
  country: string;
  industry: string;
  city?: string;
  timestamp: string;
  resultsCount: number;
}

export interface AutoCleanupSettings {
  enabled: boolean;
  autoRemoveTestDays: number; // 0 = never, 7, 30, 90
  autoArchiveInactiveDays: number; // 0 = never, 30, 60, 90
  autoArchiveCompletedOppsDays: number; // 0 = never, 30, 60, 90
}

export interface DuplicateGroup {
  id: string;
  matchType: 'domain' | 'businessName' | 'email';
  matchValue: string;
  leads: Lead[];
}

export interface ToastNotice {
  id: string;
  message: string;
  undoAction?: () => void;
  type?: 'success' | 'info' | 'warning';
}

export interface OutreachLog {
  id: string;
  leadId: string;
  businessName: string;
  email: string;
  subject: string;
  body: string;
  sentDate: string; // YYYY-MM-DD
  status: 'Sent' | 'Delivered' | 'Opened' | 'Replied';
  repliedDate?: string;
  followupDueDate: string; // YYYY-MM-DD
  channel?: 'Email' | 'LinkedIn';
}

export type IntentClassification = 'Interested' | 'Not Interested' | 'Pricing Query' | 'Follow-up' | 'Meeting Request' | 'Technical Inquiry' | 'Scope Request';

export type ClientProblemArchetype = 
  | 'SPEED_PERFORMANCE'
  | 'MOBILE_RESPONSIVENESS'
  | 'LEGACY_CMS_REBUILD'
  | 'STARTUP_MVP_VELOCITY'
  | 'ECOMMERCE_CONVERSION'
  | 'AGENCY_SUBCONTRACT'
  | 'GENERAL_MODERNIZATION';

export interface ProposalTier {
  name: string;
  price: string;
  timeline: string;
  deliverables: string[];
  recommendedFor: string;
}

export interface TailoredProposal {
  id: string;
  leadId: string;
  businessName: string;
  website: string;
  problemArchetype: ClientProblemArchetype;
  archetypeTitle: string;
  diagnosisSummary: string;
  specificObservedIssues: string[];
  technicalApproach: string;
  techStackRecommended: string[];
  tier1_QuickFix: ProposalTier;
  tier2_Modernize: ProposalTier;
  tier3_FullBuild: ProposalTier;
  recommendedTier: 'tier1' | 'tier2' | 'tier3';
  roiEstimate: string;
  callToAction: string;
  fullProposalMarkdown: string;
  generatedAt: string;
}

export interface SequenceStep {
  stepNumber: 1 | 2 | 3;
  delayDays: 3 | 7 | 14;
  title: string;
  subject: string;
  body: string;
  scheduledDate: string; // YYYY-MM-DD
  status: 'Pending' | 'Scheduled' | 'Sent' | 'Skipped' | 'Cancelled';
  sentAt?: string;
}

export interface AutomatedSequence {
  id: string;
  leadId: string;
  businessName: string;
  contactPerson: string;
  email: string;
  initialContactDate: string; // YYYY-MM-DD
  status: 'Active' | 'Completed' | 'Halted' | 'Paused' | 'Cancelled';
  haltReason?: string;
  currentStepIndex: number; // 0, 1, 2, 3 (completed)
  steps: SequenceStep[];
  createdAt: string;
  updatedAt: string;
}

export type SmartTagCategory = 
  | 'Pricing' 
  | 'Urgency' 
  | 'Meeting' 
  | 'Technical' 
  | 'Proposal' 
  | 'Follow-up' 
  | 'Negative' 
  | 'Custom';

export interface SmartIntentTag {
  id: string;
  label: string; // e.g. 'High-Intent Pricing Query'
  category: SmartTagCategory;
  confidence: number; // 0 - 100
  color: string; // e.g. 'emerald' | 'amber' | 'indigo' | 'rose' | 'purple' | 'cyan' | 'blue'
  priority: 'CRITICAL_HOT' | 'HIGH' | 'MEDIUM' | 'LOW';
  matchedRule: string;
  suggestedAction: string;
  keyPhrasesMatched?: string[];
}

export interface ClassifierRule {
  id: string;
  name: string;
  targetTag: string;
  category: SmartTagCategory;
  priority: 'CRITICAL_HOT' | 'HIGH' | 'MEDIUM' | 'LOW';
  triggerKeywords: string[];
  intentSignals: string[];
  negativeKeywords?: string[];
  suggestedAction: string;
  color: string;
  enabled: boolean;
}

export interface InboundReply {
  id: string;
  leadId: string;
  businessName: string;
  senderEmail: string;
  senderName: string;
  subject: string;
  message: string;
  receivedAt: string;
  sentiment: 'Hot Interest' | 'Price Inquiry' | 'Send Proposal' | 'Not Interested';
  intent?: IntentClassification;
  smartTags?: SmartIntentTag[];
  primaryIntentTag?: SmartIntentTag;
  classificationDetails?: {
    ruleName: string;
    confidence: number;
    explanation: string;
    signals: string[];
    classifiedAt: string;
    provider?: string;
  };
  read: boolean;
  replied?: boolean;
  repliedAt?: string;
  repliedMessage?: string;
}

export interface Meeting {
  id: string;
  leadId: string;
  businessName: string;
  contactPerson: string;
  clientEmail: string;
  clientPhone: string;
  title: string;
  meetingDate: string; // YYYY-MM-DD
  meetingTime: string; // HH:mm
  meetingLink: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  whatsappReminderPhone: string;
  whatsappReminderSent: boolean;
  clientLinkSent: boolean;
  notes?: string;
  createdAt: string;
}

export interface ScheduledEmail {
  id: string;
  leadId: string;
  businessName: string;
  email: string;
  subject: string;
  body: string;
  scheduledAt: string; // e.g. YYYY-MM-DDTHH:mm
  createdAt: string;
  status: 'Scheduled' | 'Sent' | 'Cancelled';
}

export interface EmailTemplate {
  id: string;
  title: string;
  category: string;
  subjectTemplate: string;
  bodyTemplate: string;
  description: string;
}

export interface UserProfile {
  name: string;
  title: string;
  email: string;
  phone: string;
  whatsappNumber?: string;
  portfolioUrl: string;
  githubUrl?: string;
  linkedInUrl?: string;
  profilePicUrl?: string;
  targetNiches: string[];
  dailyOutreachGoal: number;
}

export type CrmDealStage = 'Prospect' | 'Audit Sent' | 'Proposal Accepted' | 'In Development' | 'Closed Won' | 'Retainer Client';

export interface CrmDeal {
  id: string;
  leadId: string;
  businessName: string;
  contactPerson: string;
  email: string;
  phone: string;
  stage: CrmDealStage;
  dealValue: number;
  invoiceStatus: 'Draft' | 'Sent' | 'Paid' | 'Overdue';
  dueDate: string;
  lastActivity: string;
  serviceType: string;
  notes?: string;
}

export interface KashiTaskItem {
  id: string;
  leadId?: string;
  businessName?: string;
  title: string;
  description: string;
  assignedTo: string; // e.g. "Muhammad Waqas", "Frontend Dev", "Backend Engineer", "QA Specialist"
  priority: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'In Progress' | 'Completed';
  dueDate: string;
  category: 'Web Build' | 'PageSpeed Fix' | 'Mobile Layout' | 'WhatsApp Bot' | 'Client Review';
  createdAt: string;
}

export interface KashiAutopilotSettings {
  isEnabled: boolean;
  dailyQuota: number; // default 30
  autoSendColdEmail: boolean;
  autoReplyOpportunities: boolean;
  autoAssignTeamTasks: boolean;
  targetSkills: string[];
  preferredSendTime: string;
}

export interface KashiLogEntry {
  id: string;
  timestamp: string;
  actionType: 'OUTREACH_DISPATCH' | 'AUTO_REPLY' | 'TEAM_TASK_ASSIGNED' | 'DAILY_REMINDER' | 'OPPORTUNITY_CAUGHT';
  title: string;
  details: string;
  leadName?: string;
  status: 'SUCCESS' | 'INFO' | 'ACTION_REQUIRED';
}

export interface SentColdEmailRecord {
  id: string;
  leadId: string;
  leadName: string;
  recipientEmail: string;
  website: string;
  subject: string;
  emailBody: string;
  sentAt: string;
  skillsHighlighted: string[];
  status: 'Delivered' | 'Opened' | 'Replied';
}

export interface TeamWorkDoneRecord {
  id: string;
  employeeName: string; // e.g., "Muhammad Waqas", "Frontend Dev", "Backend Engineer", "QA Specialist"
  role: string;
  taskTitle: string;
  clientName: string;
  completedAt: string;
  hoursSpent: number;
  deliverableSummary: string;
  codeSnippetOrMetric?: string;
  pageSpeedScoreBefore?: number;
  pageSpeedScoreAfter?: number;
  clientRating: number; // e.g. 5.0
}


