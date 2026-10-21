import React, { useState, useEffect } from 'react';
import {
  Send,
  CheckCircle2,
  Mail,
  Clock,
  Plus,
  ExternalLink,
  Calendar,
  XCircle,
  Edit3,
  HelpCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check,
  Trash2,
  AlertCircle,
  FileText,
  Layers,
  Zap,
  Cpu,
  TrendingUp,
  ChevronRight,
  ChevronDown,
  Eye,
  Pause,
  Play,
  RotateCcw,
  Bot,
  Flame,
  ListOrdered,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  MailCheck,
} from 'lucide-react';
import {
  OutreachLog,
  ScheduledEmail,
  Lead,
  UserProfile,
  ClientProblemArchetype,
  AutomatedSequence,
  SequenceStep,
  GmailMessageRecord,
} from '../types';
import { ProposalModal } from './ProposalModal';
import { SequenceStepEditModal } from './SequenceStepEditModal';
import { GmailOutreachService } from '../services/gmailService';

interface OutreachTrackerViewProps {
  logs: OutreachLog[];
  scheduledEmails: ScheduledEmail[];
  leads: Lead[];
  profile: UserProfile;
  automatedSequences?: AutomatedSequence[];
  onStartSequence?: (leadId: string, initialDate?: string) => void;
  onBatchStartSequences?: () => void;
  onPauseSequence?: (sequenceId: string) => void;
  onResumeSequence?: (sequenceId: string) => void;
  onCancelSequence?: (sequenceId: string) => void;
  onUpdateSequenceStep?: (
    sequenceId: string,
    stepNumber: 1 | 2 | 3,
    subject: string,
    body: string,
    scheduledDate: string
  ) => void;
  onSendSequenceStepNow?: (sequenceId: string, stepNumber: 1 | 2 | 3) => void;
  onDeleteSequence?: (sequenceId: string) => void;
  onMarkReplied: (logId: string, leadId: string) => void;
  onSelectLeadForEmail: (lead: Lead) => void;
  onSendScheduledNow: (scheduledId: string) => void;
  onCancelScheduled: (scheduledId: string) => void;
  onRescheduleEmail: (scheduledId: string, newDateTime: string) => void;
}

export const OutreachTrackerView: React.FC<OutreachTrackerViewProps> = ({
  logs,
  scheduledEmails,
  leads,
  profile,
  automatedSequences = [],
  onStartSequence,
  onBatchStartSequences,
  onPauseSequence,
  onResumeSequence,
  onCancelSequence,
  onUpdateSequenceStep,
  onSendSequenceStepNow,
  onDeleteSequence,
  onMarkReplied,
  onSelectLeadForEmail,
  onSendScheduledNow,
  onCancelScheduled,
  onRescheduleEmail,
}) => {
  const [activeTab, setActiveTab] = useState<'sequences' | 'smartProposals' | 'sent' | 'scheduled' | 'guide'>('sequences');
  const [editingSchedId, setEditingSchedId] = useState<string | null>(null);
  const [editDateTime, setEditDateTime] = useState<string>('');
  const [viewingEmailBody, setViewingEmailBody] = useState<{ subject: string; body: string } | null>(null);
  const [selectedLeadForProposal, setSelectedLeadForProposal] = useState<Lead | null>(null);
  const [filterArchetype, setFilterArchetype] = useState<string>('ALL');

  // Gmail Message Records State & Sync
  const [gmailRecords, setGmailRecords] = useState<GmailMessageRecord[]>([]);
  const [syncingGmail, setSyncingGmail] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const refreshGmailRecords = () => {
    setGmailRecords(GmailOutreachService.getStoredMessages());
  };

  useEffect(() => {
    refreshGmailRecords();
  }, [logs]);

  const handleSyncGmail = async () => {
    setSyncingGmail(true);
    setSyncMessage(null);
    try {
      const res = await GmailOutreachService.syncReplies();
      setGmailRecords(res.updatedRecords);
      setSyncMessage(
        `Synced ${res.syncedCount} threads (${res.newReplies} new replies, ${res.newBounces} bounces detected).`
      );
      setTimeout(() => setSyncMessage(null), 5000);
    } catch (e: any) {
      setSyncMessage(`Sync status: ${e.message}`);
    } finally {
      setSyncingGmail(false);
    }
  };

  // Sequence state
  const [sequenceFilterStatus, setSequenceFilterStatus] = useState<'ALL' | 'Active' | 'Halted' | 'Completed' | 'Paused'>('ALL');
  const [sequenceSearchQuery, setSequenceSearchQuery] = useState('');
  const [expandedSeqIds, setExpandedSeqIds] = useState<Record<string, boolean>>({});
  const [editingStepInfo, setEditingStepInfo] = useState<{ sequence: AutomatedSequence; step: SequenceStep } | null>(null);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [selectedLeadIdToEnroll, setSelectedLeadIdToEnroll] = useState('');
  const [enrollInitialDate, setEnrollInitialDate] = useState(new Date().toISOString().split('T')[0]);

  const activeScheduled = scheduledEmails.filter((s) => s.status === 'Scheduled');
  const activeSequencesCount = automatedSequences.filter((s) => s.status === 'Active').length;
  const haltedSequencesCount = automatedSequences.filter((s) => s.status === 'Halted').length;
  const completedSequencesCount = automatedSequences.filter((s) => s.status === 'Completed').length;

  // Un-sequenced contacted leads
  const unsequencedContactedLeads = leads.filter(
    (l) => l.contactStatus === 'Contacted' && !automatedSequences.some((s) => s.leadId === l.id && s.status === 'Active')
  );

  const toggleSequenceExpanded = (id: string) => {
    setExpandedSeqIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleStartReschedule = (sched: ScheduledEmail) => {
    setEditingSchedId(sched.id);
    setEditDateTime(sched.scheduledAt);
  };

  const handleSaveReschedule = (schedId: string) => {
    if (editDateTime) {
      onRescheduleEmail(schedId, editDateTime);
    }
    setEditingSchedId(null);
  };

  const getProblemArchetype = (lead: Lead): { archetype: ClientProblemArchetype; label: string; color: string; icon: string } => {
    const text = `${lead.auditIssue || ''} ${lead.websiteStatus || ''} ${lead.suggestedService || ''}`.toLowerCase();
    if (text.includes('speed') || text.includes('load') || text.includes('performance') || text.includes('core web') || lead.speedRating === 'Slow') {
      return { archetype: 'SPEED_PERFORMANCE', label: 'Speed & Core Web Vitals', color: 'bg-amber-100 text-amber-900 border-amber-300', icon: '⚡' };
    }
    if (text.includes('mobile') || text.includes('viewport') || text.includes('responsive') || text.includes('touch') || !lead.mobileViewport) {
      return { archetype: 'MOBILE_RESPONSIVENESS', label: 'Mobile Viewport & UX', color: 'bg-rose-100 text-rose-900 border-rose-300', icon: '📱' };
    }
    if (text.includes('wordpress') || text.includes('legacy') || text.includes('php') || text.includes('wix') || text.includes('rebuild')) {
      return { archetype: 'LEGACY_CMS_REBUILD', label: 'Legacy CMS to React', color: 'bg-indigo-100 text-indigo-900 border-indigo-300', icon: '🧱' };
    }
    if (text.includes('startup') || text.includes('mvp') || text.includes('saas') || text.includes('velocity')) {
      return { archetype: 'STARTUP_MVP_VELOCITY', label: 'Startup MVP Velocity', color: 'bg-purple-100 text-purple-900 border-purple-300', icon: '🚀' };
    }
    if (text.includes('e-commerce') || text.includes('ecommerce') || text.includes('shop') || text.includes('cart') || text.includes('checkout')) {
      return { archetype: 'ECOMMERCE_CONVERSION', label: 'E-Commerce Conversion', color: 'bg-emerald-100 text-emerald-900 border-emerald-300', icon: '🛒' };
    }
    if (text.includes('agency') || text.includes('subcontract') || text.includes('white-label') || text.includes('figma')) {
      return { archetype: 'AGENCY_SUBCONTRACT', label: 'Agency Subcontract Partner', color: 'bg-cyan-100 text-cyan-900 border-cyan-300', icon: '🏢' };
    }
    return { archetype: 'GENERAL_MODERNIZATION', label: 'Modern React Redesign', color: 'bg-slate-100 text-slate-800 border-slate-300', icon: '✨' };
  };

  const filteredLeads = leads.filter((lead) => {
    if (filterArchetype === 'ALL') return true;
    return getProblemArchetype(lead).archetype === filterArchetype;
  });

  const filteredSequences = automatedSequences.filter((seq) => {
    if (sequenceFilterStatus !== 'ALL' && seq.status !== sequenceFilterStatus) {
      return false;
    }
    if (sequenceSearchQuery.trim()) {
      const q = sequenceSearchQuery.toLowerCase();
      return (
        seq.businessName.toLowerCase().includes(q) ||
        seq.contactPerson.toLowerCase().includes(q) ||
        seq.email.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getSequenceForLead = (leadId: string) => {
    return automatedSequences.find((s) => s.leadId === leadId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Outreach Tracker &amp; Automated Follow-Up Sequences
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Automated 3-7-14 day follow-up sequences, problem-grounded proposal packages ($450 Fix / $1,200 Modernize / $2,400+ Rebuild), and live delivery logs.
          </p>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex flex-wrap items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold gap-1">
          <button
            onClick={() => setActiveTab('sequences')}
            className={`px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'sequences'
                ? 'bg-indigo-600 text-white shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            3-Step Automated Sequences ({automatedSequences.length})
            {activeSequencesCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${activeTab === 'sequences' ? 'bg-indigo-800 text-indigo-100' : 'bg-indigo-100 text-indigo-700'}`}>
                {activeSequencesCount} active
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('smartProposals')}
            className={`px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'smartProposals'
                ? 'bg-indigo-600 text-white shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Problem-Trained Proposals ({leads.length})
          </button>

          <button
            onClick={() => setActiveTab('sent')}
            className={`px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'sent'
                ? 'bg-white text-slate-900 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-indigo-600" />
            Sent Logs ({logs.length})
          </button>

          <button
            onClick={() => setActiveTab('scheduled')}
            className={`px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'scheduled'
                ? 'bg-white text-slate-900 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            Scheduled Queue
            {activeScheduled.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-indigo-100 text-indigo-700 font-bold ml-1">
                {activeScheduled.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'guide'
                ? 'bg-amber-500 text-white shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Sequence Playbook
          </button>
        </div>
      </div>

      {/* TAB 0: AUTOMATED 3-STEP SEQUENCES (3, 7, 14 DAYS) */}
      {activeTab === 'sequences' && (
        <div className="space-y-6">
          {/* Hero Banner with Logic & Metrics */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl border border-indigo-900/60 relative overflow-hidden">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="bg-indigo-500/30 text-indigo-200 border border-indigo-400/40 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-400 fill-amber-400" /> Automated Sequence Engine
                  </span>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    3 • 7 • 14 Day Cadence
                  </span>
                </div>
                <h2 className="text-xl font-black text-white">
                  Automated 3-Step Follow-Up Sequence Tracker
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Sends a targeted series of 3 follow-up emails scheduled <strong>3, 7, and 14 days</strong> after initial contact if the prospect remains in &ldquo;Contacted&rdquo; status. 
                  <span className="text-amber-300 font-semibold"> Automatically halts</span> the moment a prospect replies or their status changes.
                </p>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                {unsequencedContactedLeads.length > 0 && onBatchStartSequences && (
                  <button
                    onClick={onBatchStartSequences}
                    className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-black rounded-xl shadow-lg transition flex items-center gap-1.5 active:scale-95"
                  >
                    <Zap className="w-4 h-4 fill-white" />
                    Batch Enroll {unsequencedContactedLeads.length} Contacted Leads
                  </button>
                )}
                <button
                  onClick={() => setIsEnrollModalOpen(true)}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-lg transition flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Enroll Single Lead
                </button>
              </div>
            </div>

            {/* Metric KPI Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-indigo-900/60">
              <div className="bg-white/5 backdrop-blur-xs p-3 rounded-xl border border-white/10">
                <span className="text-[11px] text-slate-400 font-semibold block">Active Sequences</span>
                <span className="text-xl font-black text-emerald-400 mt-0.5 block">{activeSequencesCount}</span>
                <span className="text-[10px] text-slate-400">Prospects in active pipeline</span>
              </div>
              <div className="bg-white/5 backdrop-blur-xs p-3 rounded-xl border border-white/10">
                <span className="text-[11px] text-slate-400 font-semibold block">Auto-Halted (Replied)</span>
                <span className="text-xl font-black text-amber-300 mt-0.5 block">{haltedSequencesCount}</span>
                <span className="text-[10px] text-slate-400">Stopped to prevent spam</span>
              </div>
              <div className="bg-white/5 backdrop-blur-xs p-3 rounded-xl border border-white/10">
                <span className="text-[11px] text-slate-400 font-semibold block">Completed (3/3 Sent)</span>
                <span className="text-xl font-black text-indigo-300 mt-0.5 block">{completedSequencesCount}</span>
                <span className="text-[10px] text-slate-400">Full cadence executed</span>
              </div>
              <div className="bg-white/5 backdrop-blur-xs p-3 rounded-xl border border-white/10">
                <span className="text-[11px] text-slate-400 font-semibold block">Un-Sequenced Leads</span>
                <span className="text-xl font-black text-white mt-0.5 block">{unsequencedContactedLeads.length}</span>
                <span className="text-[10px] text-slate-400">Ready for automated follow-up</span>
              </div>
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search business, contact, or email..."
                value={sequenceSearchQuery}
                onChange={(e) => setSequenceSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {(['ALL', 'Active', 'Halted', 'Paused', 'Completed'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setSequenceFilterStatus(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    sequenceFilterStatus === status
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {status}
                  {status === 'Active' && ` (${activeSequencesCount})`}
                  {status === 'Halted' && ` (${haltedSequencesCount})`}
                </button>
              ))}
            </div>
          </div>

          {/* Sequences Cards List */}
          {filteredSequences.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
                <Zap className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  {automatedSequences.length === 0
                    ? 'No automated sequences active yet'
                    : 'No sequences match this filter'}
                </h3>
                <p className="text-xs text-slate-500">
                  {automatedSequences.length === 0
                    ? 'When you log initial outreach to a lead, or click "Start Sequence", Kashi automatically schedules follow-ups at 3, 7, and 14 days.'
                    : 'Try clearing the search query or changing your status filter.'}
                </p>
              </div>
              {unsequencedContactedLeads.length > 0 && onBatchStartSequences && (
                <button
                  onClick={onBatchStartSequences}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition inline-flex items-center gap-1.5 shadow-sm"
                >
                  <Zap className="w-4 h-4" /> Enroll {unsequencedContactedLeads.length} Contacted Leads
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSequences.map((seq) => {
                const lead = leads.find((l) => l.id === seq.leadId);
                const isExpanded = expandedSeqIds[seq.id] ?? true; // Default open
                const pendingSteps = seq.steps.filter((s) => s.status === 'Pending' || s.status === 'Scheduled');
                const sentSteps = seq.steps.filter((s) => s.status === 'Sent');

                return (
                  <div
                    key={seq.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition overflow-hidden"
                  >
                    {/* Sequence Header Bar */}
                    <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50">
                      <div className="flex items-start sm:items-center gap-3">
                        <button
                          onClick={() => toggleSequenceExpanded(seq.id)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition shrink-0 mt-0.5 sm:mt-0"
                        >
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-extrabold text-slate-900 text-sm">{seq.businessName}</h3>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                seq.status === 'Active'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : seq.status === 'Halted'
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : seq.status === 'Completed'
                                  ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {seq.status === 'Active' && `Active • Step ${sentSteps.length + 1} of 3`}
                              {seq.status === 'Halted' && 'Auto-Halted (Replied/Won)'}
                              {seq.status === 'Completed' && 'Completed (3/3 Sent)'}
                              {seq.status === 'Paused' && 'Paused'}
                              {seq.status === 'Cancelled' && 'Cancelled'}
                            </span>
                            {lead && (
                              <span className="text-[11px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                                Status: <strong>{lead.contactStatus}</strong>
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                            <span>Contact: <strong className="text-slate-700">{seq.contactPerson}</strong></span>
                            <span>•</span>
                            <span className="text-slate-600 font-mono text-[11px]">{seq.email}</span>
                            <span>•</span>
                            <span>Initial Outreach: <strong className="text-slate-700">{seq.initialContactDate}</strong></span>
                          </div>

                          {seq.haltReason && (
                            <p className="text-[11px] text-amber-700 font-medium mt-1 bg-amber-50 px-2 py-1 rounded border border-amber-200 inline-block">
                              {seq.haltReason}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Sequence Level Action Controls */}
                      <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                        {seq.status === 'Active' && onPauseSequence && (
                          <button
                            onClick={() => onPauseSequence(seq.id)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition inline-flex items-center gap-1 border border-slate-300"
                            title="Pause automated sequence"
                          >
                            <Pause className="w-3 h-3" /> Pause
                          </button>
                        )}

                        {seq.status === 'Paused' && onResumeSequence && (
                          <button
                            onClick={() => onResumeSequence(seq.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition inline-flex items-center gap-1 shadow-sm"
                            title="Resume automated sequence"
                          >
                            <Play className="w-3 h-3 fill-white" /> Resume
                          </button>
                        )}

                        {seq.status === 'Active' && onCancelSequence && (
                          <button
                            onClick={() => onCancelSequence(seq.id)}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-lg transition inline-flex items-center gap-1 border border-rose-200"
                            title="Cancel sequence"
                          >
                            <XCircle className="w-3 h-3" /> Cancel
                          </button>
                        )}

                        {onDeleteSequence && (
                          <button
                            onClick={() => {
                              if (confirm(`Remove sequence for ${seq.businessName}?`)) {
                                onDeleteSequence(seq.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete sequence record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Visual 4-Stage Node Progress Bar */}
                    <div className="px-5 py-4 border-b border-slate-100 bg-white">
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 relative">
                        {/* Day 0 Node */}
                        <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] font-black uppercase text-emerald-800 block">Day 0: Initial Pitch</span>
                            <span className="text-[11px] text-slate-700 font-bold block truncate">{seq.initialContactDate}</span>
                          </div>
                        </div>

                        {/* Step 1 Node */}
                        {seq.steps.map((step) => {
                          const isSent = step.status === 'Sent';
                          const isPending = step.status === 'Pending' || step.status === 'Scheduled';
                          const isHaltedOrCancelled = seq.status === 'Halted' || seq.status === 'Cancelled';

                          return (
                            <div
                              key={step.stepNumber}
                              className={`p-2.5 rounded-xl border transition flex items-center gap-2.5 ${
                                isSent
                                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                                  : isHaltedOrCancelled
                                  ? 'bg-slate-50 border-slate-200 opacity-60 text-slate-500'
                                  : 'bg-indigo-50/50 border-indigo-200 text-indigo-950'
                              }`}
                            >
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-black ${
                                  isSent
                                    ? 'bg-emerald-600 text-white'
                                    : isHaltedOrCancelled
                                    ? 'bg-slate-300 text-slate-700'
                                    : 'bg-indigo-600 text-white'
                                }`}
                              >
                                {isSent ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : step.stepNumber}
                              </div>
                              <div className="min-w-0">
                                <span className="text-[10px] font-black uppercase block truncate">
                                  Day {step.delayDays}: {step.stepNumber === 1 ? 'Proof Demo' : step.stepNumber === 2 ? '3-Tier SOW' : 'Breakaway'}
                                </span>
                                <span className="text-[11px] font-bold block truncate">
                                  {isSent ? `Sent: ${step.sentAt?.split('T')[0] || 'Done'}` : `Due: ${step.scheduledDate}`}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Step Cards Details (Collapsible) */}
                    {isExpanded && (
                      <div className="p-5 bg-slate-50/70 space-y-3">
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                          Automated Sequence Steps Copy &amp; Scheduled Dispatches
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {seq.steps.map((step) => {
                            const isSent = step.status === 'Sent';
                            const isPending = step.status === 'Pending' || step.status === 'Scheduled';

                            return (
                              <div
                                key={step.stepNumber}
                                className={`p-4 rounded-xl border bg-white flex flex-col justify-between space-y-3 transition ${
                                  isSent
                                    ? 'border-emerald-200 shadow-xs'
                                    : isPending && seq.status === 'Active'
                                    ? 'border-indigo-200 ring-1 ring-indigo-500/20'
                                    : 'border-slate-200 opacity-80'
                                }`}
                              >
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black px-2 py-0.5 rounded uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
                                      Step {step.stepNumber} • +{step.delayDays} Days
                                    </span>
                                    <span
                                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                        isSent
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : step.status === 'Cancelled'
                                          ? 'bg-slate-100 text-slate-500'
                                          : 'bg-amber-100 text-amber-800'
                                      }`}
                                    >
                                      {step.status}
                                    </span>
                                  </div>

                                  <div>
                                    <p className="text-xs font-black text-slate-900 line-clamp-1">{step.subject}</p>
                                    <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                                      <Calendar className="w-3 h-3 text-indigo-600" />
                                      {isSent ? `Dispatched on ${step.sentAt?.split('T')[0]}` : `Scheduled for ${step.scheduledDate}`}
                                    </span>
                                  </div>

                                  <p className="text-[11px] text-slate-600 font-mono bg-slate-50 p-2 rounded-lg border border-slate-100 line-clamp-4 whitespace-pre-line leading-relaxed">
                                    {step.body}
                                  </p>
                                </div>

                                {/* Step Actions */}
                                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                  <button
                                    onClick={() => setEditingStepInfo({ sequence: seq, step })}
                                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
                                  >
                                    <Edit3 className="w-3 h-3" /> Edit Copy
                                  </button>

                                  {!isSent && onSendSequenceStepNow && (
                                    <button
                                      onClick={() => {
                                        if (confirm(`Dispatch Step ${step.stepNumber} now to ${seq.email}?`)) {
                                          onSendSequenceStepNow(seq.id, step.stepNumber);
                                        }
                                      }}
                                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] rounded-lg transition inline-flex items-center gap-1 shadow-xs"
                                    >
                                      <Send className="w-2.5 h-2.5" /> Send Now
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 1: SMART PROPOSALS & PROBLEM-GROUNDED TRACKER */}
      {activeTab === 'smartProposals' && (
        <div className="space-y-4">
          {/* Top Banner explaining problem-trained proposals */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl shadow-md border border-indigo-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="bg-indigo-500/30 text-indigo-200 border border-indigo-400/40 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Client Problem-Trained Architecture
                </span>
                <span className="text-xs text-amber-300 font-semibold flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" /> 0% Generic Templates
                </span>
              </div>
              <h2 className="text-lg font-black text-white">
                Bespoke Proposal Generator &amp; Problem Diagnostics Tracker
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Every client has a unique website bottleneck extracted from audit data. The proposal engine auto-generates 3 tailored pricing tiers ($450 Fix / $1,200 Modernize / $2,400+ Rebuild) addressing their exact diagnosed weakness.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-1.5 bg-white/10 p-1.5 rounded-xl backdrop-blur-xs border border-white/10 text-xs">
              <button
                onClick={() => setFilterArchetype('ALL')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
                  filterArchetype === 'ALL' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                All ({leads.length})
              </button>
              <button
                onClick={() => setFilterArchetype('SPEED_PERFORMANCE')}
                className={`px-2 py-1 rounded-lg font-bold text-[11px] transition ${
                  filterArchetype === 'SPEED_PERFORMANCE' ? 'bg-amber-500 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                ⚡ Speed
              </button>
              <button
                onClick={() => setFilterArchetype('MOBILE_RESPONSIVENESS')}
                className={`px-2 py-1 rounded-lg font-bold text-[11px] transition ${
                  filterArchetype === 'MOBILE_RESPONSIVENESS' ? 'bg-rose-500 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                📱 Mobile
              </button>
              <button
                onClick={() => setFilterArchetype('STARTUP_MVP_VELOCITY')}
                className={`px-2 py-1 rounded-lg font-bold text-[11px] transition ${
                  filterArchetype === 'STARTUP_MVP_VELOCITY' ? 'bg-purple-500 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                🚀 MVP
              </button>
              <button
                onClick={() => setFilterArchetype('LEGACY_CMS_REBUILD')}
                className={`px-2 py-1 rounded-lg font-bold text-[11px] transition ${
                  filterArchetype === 'LEGACY_CMS_REBUILD' ? 'bg-indigo-500 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                🧱 CMS
              </button>
            </div>
          </div>

          {/* Leads Matrix with Problem Archetypes */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-bold tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Client &amp; Website</th>
                    <th className="p-3.5">Diagnosed Problem Archetype</th>
                    <th className="p-3.5">Specific Audit Weakness</th>
                    <th className="p-3.5">Cadence &amp; Sequence</th>
                    <th className="p-3.5 text-right">Actions &amp; Proposals</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {filteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">
                        No leads match the selected problem filter. Use the AI Client Discovery engine to find more opportunities!
                      </td>
                    </tr>
                  ) : (
                    filteredLeads.map((lead) => {
                      const problem = getProblemArchetype(lead);
                      const hasLoggedOutreach = logs.some((l) => l.leadId === lead.id);
                      const hasReplied = logs.some((l) => l.leadId === lead.id && l.status === 'Replied');
                      const leadSequence = getSequenceForLead(lead.id);

                      return (
                        <tr key={lead.id} className="hover:bg-slate-50/80 transition">
                          <td className="p-3.5 font-bold text-slate-900 max-w-[200px]">
                            <div className="truncate text-slate-900">{lead.businessName}</div>
                            <div className="text-[11px] text-indigo-600 font-medium truncate">
                              {lead.website ? (
                                <a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-1">
                                  {lead.website} <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              ) : (
                                <span className="text-slate-400">No URL</span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-normal">
                              {lead.contactPerson && lead.contactPerson !== 'Not found' ? `Contact: ${lead.contactPerson}` : lead.industry}
                            </div>
                          </td>

                          <td className="p-3.5">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${problem.color}`}>
                              <span>{problem.icon}</span>
                              <span>{problem.label}</span>
                            </span>
                          </td>

                          <td className="p-3.5 max-w-xs">
                            <p className="text-slate-700 text-[11px] line-clamp-2 leading-relaxed font-medium">
                              {lead.auditIssue || lead.websiteStatus || 'Slow mobile viewport loading and low conversion CTA'}
                            </p>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              Speed: <span className="font-semibold text-slate-600">{lead.speedRating || 'Average'}</span> • Mobile: <span className="font-semibold text-slate-600">{lead.mobileViewport ? 'Responsive' : 'Broken'}</span>
                            </span>
                          </td>

                          <td className="p-3.5">
                            <div className="space-y-1">
                              {leadSequence ? (
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase inline-flex items-center gap-1 ${
                                    leadSequence.status === 'Active'
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                      : leadSequence.status === 'Halted'
                                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                      : 'bg-indigo-100 text-indigo-800'
                                  }`}
                                >
                                  <Zap className="w-2.5 h-2.5 fill-current" />
                                  Seq: {leadSequence.status}
                                </span>
                              ) : (
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                                    hasReplied
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                      : hasLoggedOutreach
                                      ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {hasReplied ? 'Replied' : hasLoggedOutreach ? 'Contacted' : 'Not Contacted'}
                                </span>
                              )}
                              <div className="flex gap-1 text-[9px] text-slate-400">
                                <span className={hasLoggedOutreach ? 'text-indigo-600 font-bold' : ''}>Day 1</span> →{' '}
                                <span className={hasLoggedOutreach ? 'text-indigo-600 font-bold' : ''}>Day 3</span> →{' '}
                                <span className={leadSequence ? 'text-indigo-600 font-bold' : ''}>Day 7</span> →{' '}
                                <span className={leadSequence ? 'text-indigo-600 font-bold' : ''}>Day 14</span>
                              </div>
                            </div>
                          </td>

                          <td className="p-3.5 text-right space-x-1.5">
                            {!leadSequence && onStartSequence && (
                              <button
                                onClick={() => onStartSequence(lead.id)}
                                className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-lg text-[11px] transition inline-flex items-center gap-1 shadow-xs"
                                title="Launch 3-7-14 day automated follow-up sequence"
                              >
                                <Zap className="w-3 h-3 fill-white" /> 3-Step Sequence
                              </button>
                            )}
                            <button
                              onClick={() => setSelectedLeadForProposal(lead)}
                              className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-[11px] transition inline-flex items-center gap-1 shadow-sm"
                            >
                              <FileText className="w-3 h-3" /> SOW Proposal
                            </button>
                            <button
                              onClick={() => onSelectLeadForEmail(lead)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-[11px] transition inline-flex items-center gap-1 border border-slate-300"
                            >
                              <Send className="w-3 h-3 text-indigo-600" /> Pitch Email
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SENT OUTREACH LOGS */}
      {activeTab === 'sent' && (
        <div className="space-y-4">
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200 gap-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <MailCheck className="w-4 h-4 text-indigo-600" />
                Gmail Outreach &amp; Dispatch History ({logs.length} Logged)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time tracking of emails dispatched via connected Gmail account or local client.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSyncGmail}
                disabled={syncingGmail}
                className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-lg transition inline-flex items-center gap-1.5 shadow-2xs"
              >
                {syncingGmail ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
                )}
                Sync Gmail Replies &amp; Bounces
              </button>
            </div>
          </div>

          {syncMessage && (
            <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-xl text-xs font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>{syncMessage}</span>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-bold tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Business &amp; Recipient</th>
                    <th className="p-3.5">Email Subject &amp; Thread</th>
                    <th className="p-3.5">Date Sent</th>
                    <th className="p-3.5">Delivery Status</th>
                    <th className="p-3.5">Sequence Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        No outreach emails logged yet. Click "Pitch Email" on any lead to generate, review the 12-point checklist, and send!
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => {
                      const lead = leads.find((l) => l.id === log.leadId);
                      const leadSequence = lead ? getSequenceForLead(lead.id) : undefined;
                      const gmailRecord = gmailRecords.find((g) => g.lead_id === log.leadId || g.recipient_email === log.email);

                      return (
                        <tr key={log.id} className="hover:bg-slate-50/80 transition">
                          <td className="p-3.5 font-bold text-slate-900">
                            <div>{log.businessName}</div>
                            <div className="text-[11px] text-slate-400 font-normal">{log.email}</div>
                          </td>
                          <td className="p-3.5 font-medium text-slate-800 max-w-xs">
                            <button
                              onClick={() => setViewingEmailBody({ subject: log.subject, body: log.body })}
                              className="text-left hover:text-indigo-600 hover:underline line-clamp-1 block"
                            >
                              {log.subject}
                            </button>
                            {gmailRecord?.gmail_thread_id && (
                              <a
                                href={`https://mail.google.com/mail/u/0/#inbox/${gmailRecord.gmail_thread_id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-indigo-600 font-bold hover:underline inline-flex items-center gap-0.5 mt-0.5"
                              >
                                <ExternalLink className="w-2.5 h-2.5" /> Open Thread in Gmail
                              </a>
                            )}
                          </td>
                          <td className="p-3.5 text-slate-600 font-medium">{log.sentDate}</td>
                          <td className="p-3.5">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                log.status === 'Replied' || gmailRecord?.status === 'REPLIED'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : gmailRecord?.status === 'BOUNCED'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                  : gmailRecord?.status === 'SEND_FAILED'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : log.status === 'Opened'
                                  ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {gmailRecord?.status === 'BOUNCED' ? 'Bounced' : log.status}
                            </span>
                            {gmailRecord?.gmail_message_id && (
                              <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                                ID: {gmailRecord.gmail_message_id.substring(0, 10)}...
                              </div>
                            )}
                          </td>
                          <td className="p-3.5">
                            {leadSequence ? (
                              <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 inline-flex items-center gap-1">
                                <Zap className="w-3 h-3 fill-indigo-600" />
                                {leadSequence.status} (Day 3/7/14)
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">Manual follow-up</span>
                            )}
                          </td>
                          <td className="p-3.5 text-right space-x-1.5">
                            {log.status !== 'Replied' && (
                              <button
                                onClick={() => onMarkReplied(log.id, log.leadId)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded text-[11px] transition inline-flex items-center gap-1 shadow-sm"
                              >
                                <CheckCircle2 className="w-3 h-3" /> Mark Replied
                              </button>
                            )}
                            {lead && (
                              <>
                                <button
                                  onClick={() => setSelectedLeadForProposal(lead)}
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded text-[11px] transition inline-flex items-center gap-1"
                                >
                                  <FileText className="w-3 h-3 text-indigo-600" /> SOW
                                </button>
                                <button
                                  onClick={() => onSelectLeadForEmail(lead)}
                                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded text-[11px] transition inline-flex items-center gap-1"
                                >
                                  <Send className="w-3 h-3" /> Follow-Up Draft
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SCHEDULED EMAILS QUEUE */}
      {activeTab === 'scheduled' && (
        <div className="space-y-4">
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-indigo-950 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                Scheduled Outreach Queue ({activeScheduled.length})
              </h2>
              <p className="text-xs text-indigo-700 mt-0.5">
                Emails queued for automated future sending. You can edit dates, dispatch immediately, or cancel at any time.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-bold tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Recipient &amp; Business</th>
                    <th className="p-3.5">Subject Line</th>
                    <th className="p-3.5">Scheduled Dispatch Time</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Manage Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {scheduledEmails.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">
                        No scheduled emails in queue. When composing an email in the Email Studio, toggle "Schedule Outreach" to pick a future date!
                      </td>
                    </tr>
                  ) : (
                    scheduledEmails.map((sched) => {
                      const isEditing = editingSchedId === sched.id;
                      return (
                        <tr key={sched.id} className="hover:bg-slate-50/80 transition">
                          <td className="p-3.5 font-bold text-slate-900">
                            <div>{sched.businessName}</div>
                            <div className="text-[11px] text-slate-400 font-normal">{sched.email}</div>
                          </td>
                          <td className="p-3.5 font-medium text-slate-800 max-w-xs truncate">
                            <button
                              onClick={() => setViewingEmailBody({ subject: sched.subject, body: sched.body })}
                              className="text-left hover:text-indigo-600 hover:underline"
                            >
                              {sched.subject}
                            </button>
                          </td>
                          <td className="p-3.5 text-slate-900 font-bold">
                            {isEditing ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="datetime-local"
                                  value={editDateTime}
                                  onChange={(e) => setEditDateTime(e.target.value)}
                                  className="border border-slate-300 rounded px-2 py-1 text-[11px] focus:ring-1 focus:ring-indigo-500"
                                />
                                <button
                                  onClick={() => handleSaveReschedule(sched.id)}
                                  className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => setEditingSchedId(null)}
                                  className="p-1 bg-slate-200 text-slate-700 rounded hover:bg-slate-300"
                                >
                                  <XCircle className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-indigo-700">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(sched.scheduledAt).toLocaleString([], {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            )}
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                sched.status === 'Scheduled'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : sched.status === 'Sent'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {sched.status}
                            </span>
                          </td>
                          <td className="p-3.5 text-right space-x-1.5">
                            {sched.status === 'Scheduled' && (
                              <>
                                <button
                                  onClick={() => onSendScheduledNow(sched.id)}
                                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded text-[11px] transition inline-flex items-center gap-1 shadow-sm"
                                >
                                  <Send className="w-3 h-3" /> Send Now
                                </button>
                                <button
                                  onClick={() => handleStartReschedule(sched)}
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-[11px] transition inline-flex items-center gap-1"
                                >
                                  <Edit3 className="w-3 h-3" /> Reschedule
                                </button>
                                <button
                                  onClick={() => onCancelScheduled(sched.id)}
                                  className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded text-[11px] transition inline-flex items-center gap-1"
                                >
                                  <Trash2 className="w-3 h-3" /> Cancel
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SEQUENCE CADENCE PLAYBOOK */}
      {activeTab === 'guide' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6 rounded-2xl shadow-xl space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-amber-400" />
              <h2 className="text-xl font-bold">
                Automated 3-7-14 Day Sequence Cadence Playbook
              </h2>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed max-w-3xl">
              High-converting outreach avoids aggressive chasing. By structuring follow-ups around value delivery (visual proof on Day 3, pricing packages on Day 7, and a permission breakaway on Day 14), response rates increase by over 300%.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-indigo-600 uppercase">Day 0: Initial Pitch</span>
                <span className="text-[10px] bg-slate-100 font-bold px-2 py-0.5 rounded">Diagnosis</span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm">The Specific Flaw Hook</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Call out their exact audited bug (e.g. mobile button overlap or slow LCP). Ask for permission to share a 2-minute Loom fix.
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-indigo-600 uppercase">Step 1: Day 3</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">Visual Proof</span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Interactive Fix Demo</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Send interactive before/after visual proof demonstrating the direct revenue impact of fixing their frontend bottleneck.
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-indigo-600 uppercase">Step 2: Day 7</span>
                <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded">SOW Packages</span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm">3-Tier SOW Proposal</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Provide $450 Quick Fix vs. $1,200 Modernization vs. $2,400+ Full Rebuild options with transparent turnaround times.
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-indigo-600 uppercase">Step 3: Day 14</span>
                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">Graceful Exit</span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm">The Permission Breakaway</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                &ldquo;Assuming you have this covered for now! Leaving the door open if you ever need a rapid frontend sprint partner.&rdquo;
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Enroll Single Lead in Sequence Modal */}
      {isEnrollModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Zap className="w-4 h-4 text-indigo-600" />
                Enroll Lead in 3-Step Sequence
              </h3>
              <button
                onClick={() => setIsEnrollModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Select Contacted Lead
                </label>
                <select
                  value={selectedLeadIdToEnroll}
                  onChange={(e) => setSelectedLeadIdToEnroll(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                >
                  <option value="">-- Choose a lead --</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.businessName} ({l.contactStatus}) • {l.contactPerson || 'Contact'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Initial Contact Date (Day 0)
                </label>
                <input
                  type="date"
                  value={enrollInitialDate}
                  onChange={(e) => setEnrollInitialDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 text-indigo-900 text-[11px] space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  Scheduled Follow-Ups (Calculated from Day 0):
                </p>
                <ul className="list-disc list-inside text-indigo-800 space-y-0.5 pl-1">
                  <li><strong>Day 3</strong>: Visual Proof &amp; Video Walkthrough</li>
                  <li><strong>Day 7</strong>: 3-Tier SOW Pricing Proposal</li>
                  <li><strong>Day 14</strong>: Permission Breakaway Follow-up</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => setIsEnrollModalOpen(false)}
                className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 font-semibold text-xs rounded-lg transition"
              >
                Cancel
              </button>
              <button
                disabled={!selectedLeadIdToEnroll}
                onClick={() => {
                  if (selectedLeadIdToEnroll && onStartSequence) {
                    onStartSequence(selectedLeadIdToEnroll, enrollInitialDate);
                    setIsEnrollModalOpen(false);
                    setSelectedLeadIdToEnroll('');
                  }
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition inline-flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 fill-white" />
                Launch 3-Step Sequence
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step Edit Modal */}
      {editingStepInfo && onUpdateSequenceStep && (
        <SequenceStepEditModal
          sequence={editingStepInfo.sequence}
          step={editingStepInfo.step}
          lead={leads.find((l) => l.id === editingStepInfo.sequence.leadId)}
          onClose={() => setEditingStepInfo(null)}
          onSave={(stepNum, subj, body, schedDate) => {
            onUpdateSequenceStep(editingStepInfo.sequence.id, stepNum, subj, body, schedDate);
          }}
          onSendNow={(stepNum) => {
            if (onSendSequenceStepNow) {
              onSendSequenceStepNow(editingStepInfo.sequence.id, stepNum);
            }
          }}
        />
      )}

      {/* Viewing Email Modal */}
      {viewingEmailBody && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">{viewingEmailBody.subject}</h3>
              <button
                onClick={() => setViewingEmailBody(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-700 whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto font-mono">
              {viewingEmailBody.body}
            </div>
            <div className="text-right">
              <button
                onClick={() => setViewingEmailBody(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Problem-Trained Proposal Modal */}
      {selectedLeadForProposal && (
        <ProposalModal
          lead={selectedLeadForProposal}
          profile={profile}
          onClose={() => setSelectedLeadForProposal(null)}
          onSendWithEmail={(subj, body) => {
            setSelectedLeadForProposal(null);
            onSelectLeadForEmail(selectedLeadForProposal);
          }}
        />
      )}
    </div>
  );
};
