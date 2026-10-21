import React, { useState, useEffect } from 'react';
import {
  Inbox,
  Mail,
  Send,
  Sparkles,
  Bot,
  User,
  Clock,
  Building2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Zap,
  FileCode2,
  Image as ImageIcon,
  Check,
  ChevronDown,
  ChevronUp,
  Cpu,
  Gauge,
  Copy,
  Info,
  Eye,
  EyeOff,
  Filter,
  CheckCheck,
  History,
  Tag,
  AlertTriangle,
  Calendar,
  X,
  Sliders,
  Play,
  Flame,
  PhoneCall,
  Wrench,
  FileText,
  Ban,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { Lead, InboundReply, UserProfile, OutreachLog, IntentClassification, SmartIntentTag, ClassifierRule } from '../types';
import { 
  DEFAULT_CLASSIFIER_RULES, 
  classifyMessageByRules, 
  processAndSmartTagReply 
} from '../services/smartClassifierService';

interface InboxViewProps {
  inboundReplies: InboundReply[];
  leads: Lead[];
  outreachLogs?: OutreachLog[];
  userProfile: UserProfile;
  onSimulateReply: (lead: Lead) => void;
  onSelectLeadForEmail: (lead: Lead) => void;
  onUpdateLeadStatus: (leadId: string, status: any) => void;
  onMarkReplyRead?: (replyId: string, read?: boolean) => void;
  onMarkReplyReplied?: (replyId: string, replyText: string) => void;
  onLogOutreach?: (leadId: string, subject: string, body: string) => void;
  onOpenMeetingsTab?: () => void;
  lastPolledAt?: Date | null;
  isPolling?: boolean;
  onManualPoll?: () => void;
  pollAlert?: { message: string; count: number } | null;
  onClearPollAlert?: () => void;
}

export const InboxView: React.FC<InboxViewProps> = ({
  inboundReplies,
  leads,
  outreachLogs = [],
  userProfile,
  onSimulateReply,
  onSelectLeadForEmail,
  onUpdateLeadStatus,
  onMarkReplyRead,
  onMarkReplyReplied,
  onLogOutreach,
  onOpenMeetingsTab,
  lastPolledAt,
  isPolling,
  onManualPoll,
  pollAlert,
  onClearPollAlert,
}) => {
  // Ensure all replies have Smart Tags processed
  const processedReplies = inboundReplies.map((r) => 
    r.smartTags && r.smartTags.length > 0 ? r : processAndSmartTagReply(r)
  );

  const [selectedReply, setSelectedReply] = useState<InboundReply | null>(
    processedReplies.length > 0 ? processedReplies[0] : null
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [inboxFilter, setInboxFilter] = useState<'all' | 'unread' | 'replied'>('all');
  const [intentFilter, setIntentFilter] = useState<string>('all');
  const [activeMainTab, setActiveMainTab] = useState<'threads' | 'sent_log'>('threads');

  const [isGenerating, setIsGenerating] = useState(false);
  const [isClassifying, setIsClassifying] = useState(false);
  const [aiFollowUp, setAiFollowUp] = useState('');
  const [replyHighlights, setReplyHighlights] = useState<string[]>([]);
  const [estimatedTimeline, setEstimatedTimeline] = useState<string>('');
  const [estimatedPricing, setEstimatedPricing] = useState<string>('');
  const [copiedResponse, setCopiedResponse] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [sentSuccessNotice, setSentSuccessNotice] = useState<string | null>(null);

  // Smart Classifier Rules Modal & Sandbox State
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [sandboxSubject, setSandboxSubject] = useState('Quick question regarding website speed & pricing');
  const [sandboxMessage, setSandboxMessage] = useState('Hi Waqas, we loved your audit! What are your package rates and pricing for a modern React frontend redesign? When can you start?');
  const [sandboxResult, setSandboxResult] = useState<any>(() => 
    classifyMessageByRules('Hi Waqas, we loved your audit! What are your package rates and pricing for a modern React frontend redesign? When can you start?', 'Quick question regarding website speed & pricing')
  );

  // Duplicate Email Prevention Safeguard State
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  // AI Message Analysis & Strategy State
  const [messageAnalysis, setMessageAnalysis] = useState<{
    intent?: string;
    empathyFocus?: string;
    recommendedPricingTier?: string;
  } | null>(null);

  // Strategy & Custom Context Controls
  const [replyStrategy, setReplyStrategy] = useState<'technical_nocall' | 'visual_proof' | 'call_pitch'>('technical_nocall');
  const [customNote, setCustomNote] = useState<string>('Focus on fixing site speed & modernizing frontend with flexible $450 - $1,200 package pricing and 3-7 day timeline.');
  const [showDataDrawer, setShowDataDrawer] = useState<boolean>(true);

  // GoFullPage Website Screenshot Attachments State
  const [uploadedScreenshots, setUploadedScreenshots] = useState<{ id: string; name: string; url: string }[]>([]);

  // Automatically mark message as read when selected
  useEffect(() => {
    if (selectedReply && !selectedReply.read && onMarkReplyRead) {
      onMarkReplyRead(selectedReply.id, true);
    }
  }, [selectedReply?.id]);

  // Re-run sandbox classifier on input change
  const handleTestSandbox = (msg: string, subj: string) => {
    setSandboxMessage(msg);
    setSandboxSubject(subj);
    const res = classifyMessageByRules(msg, subj);
    setSandboxResult(res);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files: File[] = Array.from(e.target.files);
    files.forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const newImg = {
            id: Math.random().toString(36).substring(2, 9),
            name: file.name,
            url: event.target.result as string,
          };
          setUploadedScreenshots((prev) => [...prev, newImg]);
          
          setAiFollowUp((prev) => 
            prev ? `${prev}\n\n[Attached GoFullPage Website Audit Screenshot: ${file.name}]` : `[Attached GoFullPage Website Audit Screenshot: ${file.name}]`
          );
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeScreenshot = (id: string) => {
    setUploadedScreenshots((prev) => prev.filter((img) => img.id !== id));
  };

  // Unread & Replied Count Calculations
  const unreadCount = processedReplies.filter((r) => !r.read && !r.replied).length;
  const repliedCount = processedReplies.filter((r) => r.replied).length;

  // Filter replies with Intent Classification & Smart Tags
  const filteredReplies = processedReplies.filter((reply) => {
    const matchesSearch =
      reply.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reply.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reply.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reply.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (reply.smartTags && reply.smartTags.some((t) => t.label.toLowerCase().includes(searchTerm.toLowerCase())));

    if (!matchesSearch) return false;

    if (inboxFilter === 'unread' && (reply.read || reply.replied)) return false;
    if (inboxFilter === 'replied' && !reply.replied) return false;

    if (intentFilter !== 'all') {
      const tagLabels = (reply.smartTags || []).map((t) => t.label);
      const primaryLabel = reply.primaryIntentTag?.label || '';
      const intentVal = reply.intent || '';

      if (
        primaryLabel !== intentFilter &&
        !tagLabels.includes(intentFilter) &&
        intentVal !== intentFilter
      ) {
        return false;
      }
    }

    return true;
  });

  const activeLead = leads.find((l) => l.id === selectedReply?.leadId);

  useEffect(() => {
    if (activeLead?.auditScreenshotUrl) {
      setUploadedScreenshots([
        {
          id: `audit-${activeLead.id}`,
          name: activeLead.auditScreenshotName || `${activeLead.businessName}_Audit.png`,
          url: activeLead.auditScreenshotUrl,
        },
      ]);
    } else {
      setUploadedScreenshots([]);
    }
  }, [activeLead]);

  const handleSimulateWebhook = async () => {
    const targetLead = leads.find((l) => l.contactStatus === 'Contacted' || l.contactStatus === 'Follow-Up Due') || leads[0];
    if (!targetLead) return;

    setSimulating(true);
    await onSimulateReply(targetLead);
    setSimulating(false);
  };

  // Classify Intent & Smart Tag with AI and Rule Engine
  const handleClassifyIntent = async () => {
    if (!selectedReply) return;
    setIsClassifying(true);
    try {
      // 1. Run local heuristic classifier rule engine
      const ruleResult = classifyMessageByRules(
        selectedReply.message,
        selectedReply.subject,
        selectedReply.sentiment
      );

      // 2. Call backend deep AI classification
      const res = await fetch('/api/ai/classify-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: selectedReply.message,
          subject: selectedReply.subject,
          senderName: selectedReply.senderName,
          businessName: selectedReply.businessName,
          sentiment: selectedReply.sentiment,
        }),
      });
      const data = await res.json();

      let finalTags: SmartIntentTag[] = ruleResult.tags;
      let primaryTag: SmartIntentTag = ruleResult.primaryTag;
      let explanation = ruleResult.details.explanation;

      if (data.success && data.primaryTag) {
        primaryTag = {
          id: `tag-${Date.now()}`,
          label: data.primaryTag.label || ruleResult.primaryTag.label,
          category: (data.primaryTag.category as any) || ruleResult.primaryTag.category,
          confidence: data.primaryTag.confidence || 95,
          color: data.primaryTag.color || ruleResult.primaryTag.color,
          priority: data.primaryTag.priority || ruleResult.primaryTag.priority,
          matchedRule: data.primaryTag.matchedRule || ruleResult.primaryTag.matchedRule,
          suggestedAction: data.primaryTag.suggestedAction || ruleResult.primaryTag.suggestedAction,
          keyPhrasesMatched: data.extractedSignals || ruleResult.primaryTag.keyPhrasesMatched,
        };
        if (data.smartTags && Array.isArray(data.smartTags)) {
          finalTags = data.smartTags.map((st: any, idx: number) => ({
            id: `tag-${Date.now()}-${idx}`,
            label: st.label,
            category: st.category,
            confidence: st.confidence || 90,
            color: st.color || 'emerald',
            priority: st.priority || 'HIGH',
            matchedRule: st.matchedRule || 'Smart Classifier Rule',
            suggestedAction: st.suggestedAction || '',
          }));
        }
        if (data.reasoning) {
          explanation = data.reasoning;
        }
      }

      const updated: InboundReply = {
        ...selectedReply,
        intent: (primaryTag.category === 'Pricing' ? 'Pricing Query' : primaryTag.category === 'Meeting' ? 'Meeting Request' : primaryTag.category === 'Urgency' ? 'Interested' : 'Follow-up') as IntentClassification,
        smartTags: finalTags,
        primaryIntentTag: primaryTag,
        classificationDetails: {
          ruleName: primaryTag.matchedRule,
          confidence: primaryTag.confidence,
          explanation,
          signals: primaryTag.keyPhrasesMatched || [],
          classifiedAt: new Date().toISOString(),
          provider: data.provider,
        },
      };

      setSelectedReply(updated);

      // Also update in parent reference array
      const target = inboundReplies.find((r) => r.id === selectedReply.id);
      if (target) {
        target.intent = updated.intent;
        target.smartTags = finalTags;
        target.primaryIntentTag = primaryTag;
        target.classificationDetails = updated.classificationDetails;
      }
    } catch (err) {
      console.error('Intent classification error:', err);
    } finally {
      setIsClassifying(false);
    }
  };

  // One-click apply suggested strategy from Smart Tag
  const handleApplySuggestedStrategy = () => {
    if (!selectedReply) return;
    const tag = selectedReply.primaryIntentTag || (selectedReply.smartTags && selectedReply.smartTags[0]);
    if (!tag) return;

    if (tag.category === 'Pricing') {
      setReplyStrategy('technical_nocall');
      setCustomNote(`Focus on ${tag.suggestedAction}. Detail 2 fixed package tiers ($450 core speed fix & $1,200 full modern rebuild) with 3-7 day turnaround.`);
    } else if (tag.category === 'Meeting') {
      setReplyStrategy('call_pitch');
      setCustomNote(`Focus on booking a 15-minute Google Meet/Zoom video walkthrough. Offer Calendly link.`);
    } else if (tag.category === 'Urgency') {
      setReplyStrategy('technical_nocall');
      setCustomNote(`High urgency project. Confirm immediate kickoff availability within 24 hours.`);
    } else {
      setReplyStrategy('technical_nocall');
      setCustomNote(`Address specific client questions and attach GoFullPage audit benchmark.`);
    }

    generateAIFollowUpResponse();
  };

  const generateAIFollowUpResponse = async () => {
    if (!selectedReply) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/ai/inbox-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedReply,
          lead: activeLead,
          userProfile,
          strategy: replyStrategy,
          customNote,
        }),
      });
      const data = await res.json();
      
      if (data.success && data.replyText) {
        setAiFollowUp(data.replyText);
        setReplyHighlights(data.technicalHighlights || []);
        setEstimatedTimeline(data.estimatedTimeline || '3-8 Business Days');
        setEstimatedPricing(data.estimatedPricing || '$450 - $1,400');
        if (data.messageAnalysis) {
          setMessageAnalysis(data.messageAnalysis);
        }
      } else {
        fallbackGenerate();
      }
    } catch {
      fallbackGenerate();
    } finally {
      setIsGenerating(false);
    }
  };

  const fallbackGenerate = () => {
    const firstName = selectedReply?.senderName.split(' ')[0] || 'there';
    const company = selectedReply?.businessName || 'your company';
    const industry = activeLead?.industry || 'Restaurants & Local Services';

    setMessageAnalysis({
      intent: 'Timeline & Custom Package Price Inquiry',
      empathyFocus: `Acknowledging ${company}'s current site bottlenecks with empathy and providing a clear, affordable roadmap`,
      recommendedPricingTier: `${industry} Tier ($450 - $1,400)`,
    });

    if (replyStrategy === 'technical_nocall') {
      setAiFollowUp(
        `Hi ${firstName},\n\nThanks for getting in touch! I took a close look at the website performance for ${company}.\n\nHere is a quick overview of what's slowing down the site and how we can get it loading almost instantly:\n\n### 1. What's Holding the Site Back\nThe main issue is heavy theme script execution and unoptimized asset loading, which delays initial rendering on mobile devices.\n\n[Attached GoFullPage Website Audit Screenshot]\n[Architecture Diagram: Fast Edge Cache & Mobile Optimization]\n\n### 2. Simple Package Options & Pricing\n- **Option A: Core Site Speed & Mobile Performance Fix ($450 - $650)**\n  Timeline: 3-5 Business Days\n  Includes script optimization, database query caching, image compression, and Core Web Vitals cleanup.\n\n- **Option B: Modern High-Speed Website Upgrade ($950 - $1,400)**\n  Timeline: 5-8 Business Days\n  Full frontend modernization with sub-second page loads, mobile redesign, and smooth user experience.\n\n### 3. Next Steps\nI can send over a 1-page project scope or start a quick 24-hour speed test pilot for your main landing page. Let me know what works best for you!\n\nBest,\n${userProfile.name}\n${userProfile.title}`
      );
      setReplyHighlights([
        '⚡ Mobile Speed Boost: Sub-second loading',
        '📦 Option A: $450 - $650 (3-5 days)',
        '🚀 Option B: $950 - $1,400 (5-8 days)',
        '🖼️ Includes GoFullPage Audit Proof'
      ]);
      setEstimatedTimeline('3-8 Business Days');
      setEstimatedPricing('$450 - $1,400');
    } else {
      setAiFollowUp(
        `Hi ${firstName},\n\nThanks for reaching out regarding ${company}! I'd be happy to put together a quick video walkthrough showing where we can boost site speed and conversions.\n\nAre you free for a quick 10-minute chat this week?\n\nBest,\n${userProfile.name}\n${userProfile.title}`
      );
    }
  };

  const handleInjectProofSnippet = (type: 'screenshot' | 'diagram' | 'benchmark') => {
    let snippet = '';
    if (type === 'screenshot') {
      snippet = `\n\n[Screenshot: Lighthouse Mobile Core Web Vitals Audit - 34/100 PHP Bottleneck]`;
    } else if (type === 'diagram') {
      snippet = `\n\n[Diagram: Legacy Monolithic PHP vs Headless React Edge Cache Architecture]`;
    } else {
      snippet = `\n\n[Benchmark: TTFB Response Time Comparison Chart (2,400ms PHP vs 180ms React Edge)]`;
    }
    setAiFollowUp((prev) => prev + snippet);
  };

  // Dispatch Email Reply with Duplicate Safeguard Check
  const handleInitiateSendReply = () => {
    if (!selectedReply || !aiFollowUp) return;

    // Check if reply already done on this thread to prevent duplicate sending
    if (selectedReply.replied) {
      setShowDuplicateModal(true);
      return;
    }

    executeActualSendReply();
  };

  const executeActualSendReply = () => {
    if (!selectedReply || !aiFollowUp) return;

    if (onLogOutreach && activeLead) {
      onLogOutreach(activeLead.id, `Re: ${selectedReply.subject}`, aiFollowUp);
    }

    if (onMarkReplyReplied) {
      onMarkReplyReplied(selectedReply.id, aiFollowUp);
    }

    onUpdateLeadStatus(selectedReply.leadId, 'Replied');

    // Update current selected reply local state
    setSelectedReply((prev) =>
      prev
        ? {
            ...prev,
            read: true,
            replied: true,
            repliedAt: new Date().toISOString(),
            repliedMessage: aiFollowUp,
          }
        : null
    );

    setShowDuplicateModal(false);
    setSentSuccessNotice(
      `Email reply successfully sent to ${selectedReply.senderName} (${selectedReply.businessName}) via Gmail! Thread marked as READ & REPLIED.`
    );
    setTimeout(() => setSentSuccessNotice(null), 5000);
  };

  // Helper to render Smart Intent Tag Pills
  const renderSmartTagBadge = (tag?: SmartIntentTag, showConfidence = true) => {
    if (!tag) return null;

    let bgClass = 'bg-emerald-50 text-emerald-800 border-emerald-300';
    let icon = <Tag className="w-3 h-3 text-emerald-600" />;

    if (tag.category === 'Pricing' || tag.label.includes('Pricing')) {
      bgClass = 'bg-emerald-100 text-emerald-900 border-emerald-400';
      icon = <Flame className="w-3 h-3 text-emerald-600 fill-emerald-500" />;
    } else if (tag.category === 'Urgency' || tag.label.includes('Immediate')) {
      bgClass = 'bg-amber-100 text-amber-900 border-amber-400';
      icon = <Zap className="w-3 h-3 text-amber-600 fill-amber-500" />;
    } else if (tag.category === 'Meeting' || tag.label.includes('Meeting')) {
      bgClass = 'bg-indigo-100 text-indigo-900 border-indigo-400';
      icon = <PhoneCall className="w-3 h-3 text-indigo-600" />;
    } else if (tag.category === 'Technical' || tag.label.includes('Technical')) {
      bgClass = 'bg-purple-100 text-purple-900 border-purple-400';
      icon = <Wrench className="w-3 h-3 text-purple-600" />;
    } else if (tag.category === 'Proposal' || tag.label.includes('Proposal')) {
      bgClass = 'bg-blue-100 text-blue-900 border-blue-400';
      icon = <FileText className="w-3 h-3 text-blue-600" />;
    } else if (tag.category === 'Negative' || tag.label.includes('Declined')) {
      bgClass = 'bg-rose-100 text-rose-800 border-rose-300';
      icon = <Ban className="w-3 h-3 text-rose-600" />;
    } else if (tag.category === 'Follow-up') {
      bgClass = 'bg-cyan-100 text-cyan-900 border-cyan-400';
      icon = <Clock className="w-3 h-3 text-cyan-600" />;
    }

    return (
      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold border flex items-center gap-1 shrink-0 ${bgClass}`}>
        {icon}
        <span>{tag.label}</span>
        {showConfidence && tag.confidence > 0 && (
          <span className="opacity-75 font-semibold text-[9px] bg-white/60 px-1 rounded ml-0.5">
            {tag.confidence}%
          </span>
        )}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Background Poller Status */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Inbox & Smart Tagging Studio
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold border border-indigo-200">
              Smart Intent Classifier Active
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time mailbox monitoring, automatic intent categorization (e.g., High-Intent Pricing Query), and proposal drafting.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Rules Engine Sandbox Button */}
          <button
            onClick={() => setShowRulesModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition shadow-2xs"
          >
            <Sliders className="w-3.5 h-3.5" />
            Classifier Rules Engine
          </button>

          {/* Main View Mode Toggles */}
          <div className="bg-slate-200 p-1 rounded-xl flex items-center gap-1 text-xs font-bold">
            <button
              onClick={() => setActiveMainTab('threads')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                activeMainTab === 'threads'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Inbox className="w-3.5 h-3.5" />
              Inbox Threads ({inboundReplies.length})
            </button>
            <button
              onClick={() => setActiveMainTab('sent_log')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                activeMainTab === 'sent_log'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Sent Replies Log ({repliedCount})
            </button>
          </div>

          <button
            onClick={handleSimulateWebhook}
            disabled={simulating}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-sm transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${simulating ? 'animate-spin' : ''}`} />
            {simulating ? 'Processing Webhook...' : 'Simulate Inbound Lead Reply'}
          </button>
        </div>
      </div>

      {/* Sent Success Toast Notification */}
      {sentSuccessNotice && (
        <div className="bg-emerald-600 text-white p-4 rounded-2xl flex justify-between items-center text-xs font-bold shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-200" />
            <span>{sentSuccessNotice}</span>
          </div>
          <button onClick={() => setSentSuccessNotice(null)} className="text-emerald-200 hover:text-white font-extrabold text-sm">
            ✕
          </button>
        </div>
      )}

      {/* 30-Min Automated Background Inbox Poller Status Bar */}
      <div className="bg-slate-900 text-white p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs border border-slate-800 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </div>
          <span className="font-bold tracking-wide">Inbox Engine & Smart Classifier Active</span>
          <span className="text-slate-400 text-[11px] hidden sm:inline">
            | Polling Account: <span className="font-semibold text-slate-200">{userProfile.email}</span>
          </span>
          {lastPolledAt && (
            <span className="text-slate-400 text-[11px] hidden md:inline">
              (Last checked: {lastPolledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onManualPoll}
            disabled={isPolling}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] rounded-lg transition border border-slate-700 flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3 h-3 ${isPolling ? 'animate-spin text-emerald-400' : ''}`} />
            {isPolling ? 'Polling Gmail...' : 'Poll Gmail Now'}
          </button>
        </div>
      </div>

      {pollAlert && (
        <div className="bg-emerald-50 border border-emerald-300 p-3.5 rounded-2xl flex justify-between items-center text-xs text-emerald-900">
          <div className="flex items-center gap-2 font-bold">
            <Zap className="w-4 h-4 text-emerald-600" />
            {pollAlert.message}
          </div>
          <button onClick={onClearPollAlert} className="text-emerald-700 font-extrabold hover:text-emerald-950">
            Dismiss
          </button>
        </div>
      )}

      {/* VIEW MODE 1: MAIN INBOX THREADS */}
      {activeMainTab === 'threads' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[660px]">
          {/* Left Column: Inbound Messages List */}
          <div className="lg:col-span-4 xl:col-span-3 border-r border-slate-200 flex flex-col bg-slate-50/50">
            {/* Filter Tabs & Search & Smart Tag Selector */}
            <div className="p-3 bg-slate-50 border-b border-slate-200 space-y-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search messages & smart tags..."
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Status Filter Pills */}
              <div className="flex gap-1 pt-1">
                <button
                  onClick={() => setInboxFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                    inboxFilter === 'all'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  All ({processedReplies.length})
                </button>
                <button
                  onClick={() => setInboxFilter('unread')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                    inboxFilter === 'unread'
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Action ({unreadCount})
                </button>
                <button
                  onClick={() => setInboxFilter('replied')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                    inboxFilter === 'replied'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Replied ({repliedCount})
                </button>
              </div>

              {/* Smart Tag Filter Dropdown */}
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200">
                <span className="font-bold text-slate-600 flex items-center gap-1">
                  <Tag className="w-3 h-3 text-indigo-600" /> Smart Tag:
                </span>
                <select
                  value={intentFilter}
                  onChange={(e) => setIntentFilter(e.target.value)}
                  className="bg-white border border-slate-300 rounded px-2 py-1 font-bold text-slate-800 focus:outline-none text-[11px] max-w-[170px]"
                >
                  <option value="all">All Intent Tags</option>
                  <option value="High-Intent Pricing Query">🔥 High-Intent Pricing</option>
                  <option value="Immediate Project Need">⚡ Immediate Need</option>
                  <option value="Meeting / Call Request">📞 Meeting Request</option>
                  <option value="Technical Scope Inquiry">🛠️ Technical Scope</option>
                  <option value="Proposal & SOW Request">📄 Proposal Request</option>
                  <option value="Follow-up Due">⏳ Follow-up</option>
                  <option value="Declined / Not Interested">🛑 Not Interested</option>
                </select>
              </div>
            </div>

            {/* Inbound Threads List */}
            <div className="divide-y divide-slate-100 overflow-y-auto flex-1 max-h-[640px]">
              {filteredReplies.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No messages found for this filter.
                </div>
              ) : (
                filteredReplies.map((reply) => {
                  const isSelected = selectedReply?.id === reply.id;
                  const isReplied = reply.replied === true;
                  const isUnread = !reply.read && !isReplied;
                  const primaryTag = reply.primaryIntentTag || (reply.smartTags && reply.smartTags[0]);

                  return (
                    <div
                      key={reply.id}
                      onClick={() => {
                        setSelectedReply(reply);
                        setAiFollowUp('');
                        setReplyHighlights([]);
                        setMessageAnalysis(null);
                        if (!reply.read && onMarkReplyRead) {
                          onMarkReplyRead(reply.id, true);
                        }
                      }}
                      className={`p-3.5 cursor-pointer transition relative ${
                        isSelected
                          ? 'bg-indigo-100/80 border-l-4 border-indigo-600 shadow-2xs'
                          : isUnread
                          ? 'bg-blue-50/60 border-l-4 border-blue-500 hover:bg-blue-100/50'
                          : 'bg-white hover:bg-slate-50 border-l-4 border-transparent'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <span className={`text-xs truncate flex items-center gap-1.5 ${isUnread ? 'font-extrabold text-slate-950' : 'font-bold text-slate-800'}`}>
                          {reply.businessName}
                        </span>

                        {/* Visual Status Badges */}
                        {isReplied ? (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded border border-emerald-300 flex items-center gap-0.5 shrink-0">
                            <CheckCheck className="w-3 h-3 text-emerald-600" /> REPLIED
                          </span>
                        ) : isUnread ? (
                          <span className="text-[10px] bg-rose-500 text-white font-extrabold px-1.5 py-0.5 rounded shadow-2xs flex items-center gap-0.5 shrink-0 animate-pulse">
                            ● UNREAD
                          </span>
                        ) : (
                          <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded shrink-0 border border-slate-200">
                            READ ✓
                          </span>
                        )}
                      </div>

                      <div className={`text-[11px] truncate mb-1 ${isUnread ? 'font-bold text-indigo-950' : 'font-semibold text-slate-700'}`}>
                        {reply.senderName} ({reply.subject})
                      </div>

                      <div className="text-[11px] text-slate-500 line-clamp-2 leading-tight mb-2">
                        {reply.message}
                      </div>

                      {/* Smart Tag and Time Stamp Row */}
                      <div className="flex justify-between items-center text-[10px] text-slate-400 gap-1">
                        <span>{new Date(reply.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {primaryTag ? (
                          renderSmartTagBadge(primaryTag, true)
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            Inbound
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Thread Header, Smart Tag Inspector, and Side-by-Side Drafting */}
          <div className="lg:col-span-8 xl:col-span-9 p-6 flex flex-col justify-between space-y-6">
            {selectedReply ? (
              <div className="space-y-6">
                {/* Thread Header Bar with Read/Unread & Smart Tag Badge */}
                <div className="border-b border-slate-200 pb-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-extrabold text-indigo-600 tracking-wide uppercase">
                          Client Email Thread
                        </span>
                        {renderSmartTagBadge(selectedReply.primaryIntentTag || (selectedReply.smartTags && selectedReply.smartTags[0]), true)}
                        
                        <button
                          onClick={handleClassifyIntent}
                          disabled={isClassifying}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[10px] rounded-lg border border-indigo-200 flex items-center gap-1 transition disabled:opacity-50"
                          title="Re-run deep AI intent classifier"
                        >
                          <Sparkles className={`w-3 h-3 text-indigo-600 ${isClassifying ? 'animate-spin' : ''}`} />
                          {isClassifying ? 'Classifying...' : 'Re-Run Smart Classifier'}
                        </button>
                      </div>
                      <h2 className="text-lg font-bold text-slate-900">
                        {selectedReply.subject}
                      </h2>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-bold text-slate-800">{selectedReply.senderName}</span>
                        <span className="text-slate-500">({selectedReply.senderEmail})</span>
                      </div>

                      {/* Schedule Meeting Button */}
                      {onOpenMeetingsTab && (
                        <button
                          onClick={onOpenMeetingsTab}
                          className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-2xs"
                        >
                          <Calendar className="w-3.5 h-3.5 text-purple-600" /> Schedule Meeting
                        </button>
                      )}

                      {/* Manual Toggle Read/Unread Button */}
                      <button
                        onClick={() => {
                          const newReadState = !selectedReply.read;
                          if (onMarkReplyRead) {
                            onMarkReplyRead(selectedReply.id, newReadState);
                          }
                          setSelectedReply((prev) => (prev ? { ...prev, read: newReadState } : null));
                        }}
                        className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-2xs"
                      >
                        {selectedReply.read ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5 text-slate-500" /> Mark Unread
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5 text-indigo-600" /> Mark Read
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* PROMINENT SMART INTENT CLASSIFIER & RULE TRIGGER CARD */}
                  {selectedReply.primaryIntentTag && (
                    <div className="bg-gradient-to-r from-indigo-50/90 via-emerald-50/60 to-slate-50 border border-indigo-200 p-3.5 rounded-2xl space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-950 flex items-center gap-1">
                            <ShieldCheck className="w-4 h-4 text-indigo-600" /> Smart Intent Classifier:
                          </span>
                          <span className="font-extrabold text-xs text-slate-900">
                            {selectedReply.primaryIntentTag.label}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-extrabold border border-emerald-300">
                            {selectedReply.primaryIntentTag.confidence}% Confidence
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleApplySuggestedStrategy}
                            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition flex items-center gap-1 shadow-2xs"
                          >
                            <Zap className="w-3 h-3 text-amber-300 fill-amber-300" />
                            Apply Rule Strategy to Draft
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-700 pt-1">
                        <div>
                          <span className="font-bold text-slate-500 block text-[10px] uppercase">
                            Triggered Classifier Rule:
                          </span>
                          <span className="font-semibold text-slate-900">
                            {selectedReply.classificationDetails?.ruleName || selectedReply.primaryIntentTag.matchedRule}
                          </span>
                          {selectedReply.classificationDetails?.signals && selectedReply.classificationDetails.signals.length > 0 && (
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Signals: <span className="font-mono text-indigo-700 font-semibold">{selectedReply.classificationDetails.signals.join(', ')}</span>
                            </div>
                          )}
                        </div>

                        <div>
                          <span className="font-bold text-slate-500 block text-[10px] uppercase">
                            Recommended Action:
                          </span>
                          <span className="font-bold text-emerald-900">
                            💡 {selectedReply.primaryIntentTag.suggestedAction}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* PROMINENT REPLIED & HANDLED BANNER IF ALREADY REPLIED */}
                {selectedReply.replied && (
                  <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                      <span className="font-extrabold text-emerald-950 text-xs flex items-center gap-2 uppercase tracking-wider">
                        <CheckCheck className="w-4 h-4 text-emerald-600" />
                        Status: Email Reply Sent & Thread Handled
                      </span>
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-200/80 px-2.5 py-0.5 rounded-full">
                        {selectedReply.repliedAt ? `Sent: ${new Date(selectedReply.repliedAt).toLocaleString()}` : 'Replied'}
                      </span>
                    </div>

                    {selectedReply.repliedMessage && (
                      <div className="text-xs text-slate-800 bg-white p-3 rounded-xl border border-emerald-200 space-y-1">
                        <span className="font-bold text-slate-500 block text-[10px] uppercase">
                          Previously Sent Reply to Client:
                        </span>
                        <p className="whitespace-pre-wrap font-mono text-slate-700 line-clamp-3">
                          {selectedReply.repliedMessage}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Side-by-Side Grid Layout */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {/* WINDOW 1: Original Inbound Email */}
                  <div className="space-y-4 flex flex-col justify-between bg-slate-50/70 p-5 rounded-2xl border border-slate-200">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                          <Mail className="w-4 h-4 text-slate-600" /> Original Inbound Email
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          Received: {new Date(selectedReply.receivedAt).toLocaleString()}
                        </span>
                      </div>

                      <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs text-slate-800 whitespace-pre-wrap leading-relaxed min-h-[160px] shadow-xs">
                        {selectedReply.message}
                      </div>

                      {/* AI Message Intelligence Summary */}
                      {messageAnalysis && (
                        <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-200 text-xs space-y-1.5">
                          <div className="flex items-center justify-between border-b border-indigo-100 pb-1.5">
                            <span className="font-extrabold text-indigo-950 text-[11px] uppercase tracking-wider flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Message Intelligence
                            </span>
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                              Human Tone / Custom Pricing
                            </span>
                          </div>
                          <div className="space-y-1 text-[11px] text-slate-700 pt-1">
                            <div>
                              <span className="font-bold text-slate-500">Client Intent:</span>{' '}
                              <span className="font-bold text-slate-900">{messageAnalysis.intent || 'Price & Scope Inquiry'}</span>
                            </div>
                            <div>
                              <span className="font-bold text-slate-500">Empathy Focus:</span>{' '}
                              <span className="font-semibold text-slate-800">{messageAnalysis.empathyFocus || 'Understanding legacy website bottlenecks'}</span>
                            </div>
                            <div>
                              <span className="font-bold text-slate-500">Industry Pricing Strategy:</span>{' '}
                              <span className="font-extrabold text-indigo-700">{messageAnalysis.recommendedPricingTier || `${activeLead?.industry || 'Local Services'} Tier ($450 - $1,400)`}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Company Intelligence Inspector Drawer */}
                    <div className="bg-slate-900 text-slate-100 rounded-xl border border-slate-800 overflow-hidden mt-2">
                      <div
                        onClick={() => setShowDataDrawer(!showDataDrawer)}
                        className="p-3 bg-slate-950 flex justify-between items-center cursor-pointer hover:bg-slate-900 transition"
                      >
                        <div className="flex items-center gap-2 text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
                          <Cpu className="w-3.5 h-3.5 text-indigo-400" /> Company Audit Data
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400">
                          <span>{showDataDrawer ? 'Hide' : 'Inspect'}</span>
                          {showDataDrawer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </div>
                      </div>

                      {showDataDrawer && (
                        <div className="p-3 space-y-2 text-[11px] border-t border-slate-800">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="p-2 bg-slate-800/60 rounded border border-slate-700">
                              <span className="text-slate-400 block text-[10px]">TECH STACK</span>
                              <span className="font-bold text-white truncate block">
                                {activeLead?.enrichment?.techStack?.join(', ') || 'PHP, WordPress, MySQL'}
                              </span>
                            </div>
                            <div className="p-2 bg-slate-800/60 rounded border border-slate-700">
                              <span className="text-slate-400 block text-[10px]">AUDIT BOTTLENECK</span>
                              <span className="font-bold text-amber-300 truncate block">
                                {activeLead?.auditIssue || 'Slow TTFB & Mobile render delay'}
                              </span>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                              Custom Context for AI Reply
                            </label>
                            <input
                              type="text"
                              value={customNote}
                              onChange={(e) => setCustomNote(e.target.value)}
                              className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-xs text-white focus:outline-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* WINDOW 2: Proposed AI Draft (Editable) */}
                  <div className="bg-gradient-to-br from-indigo-50/80 via-purple-50/50 to-slate-50 p-5 rounded-2xl border border-indigo-200 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-200/80 pb-2">
                        <span className="text-xs font-extrabold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                          <Bot className="w-4 h-4 text-indigo-600" /> Proposed AI Draft
                        </span>
                        <button
                          onClick={generateAIFollowUpResponse}
                          disabled={isGenerating}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          {isGenerating ? 'Drafting Technical Reply...' : 'Re-Generate AI Draft'}
                        </button>
                      </div>

                      {/* Mode Strategy Selector */}
                      <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-2 rounded-xl border border-indigo-100 text-xs">
                        <span className="font-bold text-slate-700">Strategy:</span>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => setReplyStrategy('technical_nocall')}
                            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
                              replyStrategy === 'technical_nocall'
                                ? 'bg-indigo-600 text-white shadow-2xs'
                                : 'bg-slate-100 text-slate-700 hover:bg-indigo-50'
                            }`}
                          >
                            Technical Breakdown
                          </button>
                          <button
                            onClick={() => setReplyStrategy('call_pitch')}
                            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
                              replyStrategy === 'call_pitch'
                                ? 'bg-indigo-600 text-white shadow-2xs'
                                : 'bg-slate-100 text-slate-700 hover:bg-indigo-50'
                            }`}
                          >
                            Discovery Call Pitch
                          </button>
                        </div>
                      </div>

                      {/* Proof Snippet Quick Injectors */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                        <span className="font-bold text-slate-500">Inject Proof:</span>
                        <button
                          onClick={() => handleInjectProofSnippet('screenshot')}
                          className="px-2 py-1 bg-white hover:bg-indigo-50 text-indigo-700 font-bold rounded border border-indigo-200 transition"
                        >
                          + Screenshot
                        </button>
                        <button
                          onClick={() => handleInjectProofSnippet('diagram')}
                          className="px-2 py-1 bg-white hover:bg-indigo-50 text-indigo-700 font-bold rounded border border-indigo-200 transition"
                        >
                          + Architecture
                        </button>
                        <button
                          onClick={() => handleInjectProofSnippet('benchmark')}
                          className="px-2 py-1 bg-white hover:bg-indigo-50 text-indigo-700 font-bold rounded border border-indigo-200 transition"
                        >
                          + TTFB Benchmark
                        </button>
                      </div>

                      {/* Editable Textarea */}
                      <textarea
                        value={aiFollowUp}
                        onChange={(e) => setAiFollowUp(e.target.value)}
                        placeholder="Click 'Re-Generate AI Draft' to craft a tailored technical proposal..."
                        className="w-full h-56 p-4 bg-white border border-indigo-200 rounded-xl text-xs font-mono text-slate-800 leading-relaxed focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none shadow-xs"
                      />

                      {/* Highlights Badges */}
                      {replyHighlights.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {replyHighlights.map((h, idx) => (
                            <span key={idx} className="text-[10px] bg-white border border-indigo-200 text-indigo-900 font-bold px-2 py-0.5 rounded shadow-2xs">
                              {h}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Send / Copy Action Buttons */}
                    <div className="flex items-center justify-between gap-3 pt-3 border-t border-indigo-100">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(aiFollowUp);
                          setCopiedResponse(true);
                          setTimeout(() => setCopiedResponse(false), 2000);
                        }}
                        disabled={!aiFollowUp}
                        className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition flex items-center gap-1.5 shadow-2xs disabled:opacity-40"
                      >
                        {copiedResponse ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedResponse ? 'Copied!' : 'Copy Draft'}
                      </button>

                      <button
                        onClick={handleInitiateSendReply}
                        disabled={!aiFollowUp}
                        className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-2 disabled:opacity-40"
                      >
                        <Send className="w-4 h-4" />
                        Send Reply via Gmail
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 text-slate-400 space-y-3">
                <Inbox className="w-12 h-12 text-slate-300" />
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-700">Select an Inbound Thread</h3>
                  <p className="text-xs max-w-sm">
                    Click any client reply in the left sidebar to inspect automatic intent tags and generate a technical proposal.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW MODE 2: SENT REPLIES AUDIT LOG */}
      {activeMainTab === 'sent_log' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" /> Sent Email Replies History ({outreachLogs.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Complete audit trail of all email replies and technical proposals sent to clients.
              </p>
            </div>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full border border-emerald-300">
              Verified Sent via Connected Gmail
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {outreachLogs.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No email replies sent yet. Select an inbound thread to generate and send a technical response.
              </div>
            ) : (
              outreachLogs.map((log) => (
                <div key={log.id} className="py-4 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{log.businessName}</span>
                      <span className="text-xs text-slate-500">({log.email})</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-400 font-semibold">{log.sentDate}</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px] border border-emerald-300">
                        ✓ {log.status}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs font-bold text-slate-800">
                    Subject: {log.subject}
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-700 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                    {log.body}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SMART CLASSIFIER RULES ENGINE & LIVE SANDBOX MODAL */}
      {showRulesModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-indigo-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-100 rounded-xl text-indigo-700">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Smart Tagging Classifier Rules Engine
                  </h3>
                  <p className="text-xs text-slate-500">
                    Rule-based heuristic classifier & AI intent detector running on incoming inbox messages.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRulesModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* LIVE INTENT TESTING SANDBOX */}
            <div className="bg-indigo-50/70 border border-indigo-200 p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-950 flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5 text-indigo-600" /> Live Intent Classifier Sandbox
                </span>
                <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
                  Real-time Evaluation
                </span>
              </div>

              <div className="space-y-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Subject Line:
                  </label>
                  <input
                    type="text"
                    value={sandboxSubject}
                    onChange={(e) => handleTestSandbox(sandboxMessage, e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Incoming Message Body:
                  </label>
                  <textarea
                    value={sandboxMessage}
                    onChange={(e) => handleTestSandbox(e.target.value, sandboxSubject)}
                    rows={3}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 font-mono focus:outline-none resize-none"
                  />
                </div>
              </div>

              {/* Real-time Sandbox Output */}
              {sandboxResult && sandboxResult.primaryTag && (
                <div className="bg-white p-3 rounded-xl border border-indigo-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-500">Predicted Smart Tag:</span>
                      {renderSmartTagBadge(sandboxResult.primaryTag, true)}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">
                      Priority: {sandboxResult.primaryTag.priority}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-600 space-y-1 pt-1 border-t border-slate-100">
                    <div>
                      <span className="font-bold text-slate-500">Matched Rule:</span>{' '}
                      <span className="font-semibold text-slate-800">{sandboxResult.primaryTag.matchedRule}</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-500">Signals Extracted:</span>{' '}
                      <span className="font-mono text-indigo-700 font-semibold">
                        {(sandboxResult.primaryTag.keyPhrasesMatched || []).join(', ') || 'General Context'}
                      </span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-500">Automated Next Step:</span>{' '}
                      <span className="font-bold text-emerald-800">
                        {sandboxResult.primaryTag.suggestedAction}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ACTIVE RULES LIST */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-indigo-600" /> Active Classifier Rules ({DEFAULT_CLASSIFIER_RULES.length})
              </h4>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {DEFAULT_CLASSIFIER_RULES.map((rule) => (
                  <div key={rule.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{rule.name}</span>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                          {rule.targetTag}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Active
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500">
                      <span className="font-semibold text-slate-600">Triggers:</span>{' '}
                      <span className="font-mono text-[10px] text-slate-700">
                        {rule.triggerKeywords.slice(0, 8).join(', ')}...
                      </span>
                    </div>

                    <div className="text-[11px] text-emerald-800 font-semibold">
                      Action: {rule.suggestedAction}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowRulesModal(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DUPLICATE EMAIL PREVENTION SAFEGUARD MODAL */}
      {showDuplicateModal && selectedReply && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-amber-200 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-amber-100 rounded-xl text-amber-700 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  Duplicate Email Prevention Warning
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  You have already sent an email reply to <strong>{selectedReply.senderName}</strong> at <strong>{selectedReply.businessName}</strong>.
                </p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-xs text-amber-900 space-y-1">
              <span className="font-extrabold block text-[11px] uppercase tracking-wider text-amber-950">
                ⚠️ Spam Risk Safeguard:
              </span>
              <p>
                Sending multiple direct replies to an already handled thread without new inbound activity may mark your domain as spam or cause client confusion.
              </p>
            </div>

            {selectedReply.repliedMessage && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">
                  Last Sent Reply ({selectedReply.repliedAt ? new Date(selectedReply.repliedAt).toLocaleDateString() : 'Earlier'}):
                </span>
                <p className="font-mono text-[11px] line-clamp-3">
                  {selectedReply.repliedMessage}
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowDuplicateModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition"
              >
                Cancel & Keep Inbox Safe
              </button>

              <button
                onClick={executeActualSendReply}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                Override & Send Second Reply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
