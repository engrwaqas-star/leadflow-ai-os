export type Temperature = 'HOT' | 'WARM' | 'POTENTIAL' | 'LOW';

export type ContactStatus = 
  | 'Not Contacted' 
  | 'Contacted' 
  | 'Follow-Up Due' 
  | 'Replied' 
  | 'Negotiating'
  | 'Closed Won' 
  | 'Declined'
  | 'Closed Lost';

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
  | 'Other';

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
  businessName: string;
  contactPerson: string;
  email: string;
  phone: string;
  website: string;
  industry: string;
  country: string;
  city?: string;
  address?: string;
  score: number; // 0-100
  temperature: Temperature;
  contactStatus: ContactStatus;
  websiteStatus: string;
  suggestedService: string;
  auditIssue: string;
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
  verificationScore?: number;
  verificationStatus?: 'VERIFIED' | 'UNVERIFIED' | 'REJECTED';
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

export type IntentClassification = 'Interested' | 'Not Interested' | 'Pricing Query' | 'Follow-up';

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


