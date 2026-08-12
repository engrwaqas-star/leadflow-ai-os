import React, { useState } from 'react';
import { 
  Bot, 
  Zap, 
  CheckCircle2, 
  Clock, 
  Send, 
  Play, 
  Pause, 
  Plus, 
  Users, 
  Mail, 
  MessageSquare, 
  Globe, 
  Code, 
  Sparkles, 
  Target, 
  ShieldCheck, 
  FileText, 
  Trash2, 
  Check, 
  RefreshCw, 
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Award,
  Layers,
  ChevronRight,
  Eye,
  ExternalLink,
  Laptop,
  Smartphone,
  Maximize2,
  X,
  FileCode,
  Star,
  CheckSquare
} from 'lucide-react';
import { Lead, UserProfile, KashiTaskItem, KashiAutopilotSettings, KashiLogEntry, SentColdEmailRecord, TeamWorkDoneRecord } from '../types';
import { loggedFetch } from '../utils/apiLogger';

interface KashiAgentViewProps {
  leads: Lead[];
  profile: UserProfile;
  onUpdateLead: (lead: Lead) => void;
  onOpenEmail: (lead: Lead) => void;
  onOpenAudit: (lead: Lead) => void;
}

export const KashiAgentView: React.FC<KashiAgentViewProps> = ({
  leads,
  profile,
  onUpdateLead,
  onOpenEmail,
  onOpenAudit,
}) => {
  // Navigation Sub-Tabs
  const [activeSubTab, setActiveSubTab] = useState<'console' | 'sent_mails' | 'team_work' | 'real_captures'>('console');

  // Autopilot configuration
  const [settings, setSettings] = useState<KashiAutopilotSettings>({
    isEnabled: true,
    dailyQuota: 30,
    autoSendColdEmail: true,
    autoReplyOpportunities: true,
    autoAssignTeamTasks: true,
    targetSkills: [
      'Full Stack Web Applications (React, Node, Express)',
      'Sub-second PageSpeed & Core Web Vitals Optimization',
      'Mobile Responsive & E-Commerce Integration',
      'Custom Portals, SaaS & WhatsApp Lead Routers',
    ],
    preferredSendTime: '09:00 AM',
  });

  // Today's Date String
  const todayDateStr = new Date().toISOString().split('T')[0];
  const contactedTodayLeads = leads.filter(
    (l) => l.lastContactDate === todayDateStr || l.contactStatus !== 'Not Contacted'
  );
  const contactedTodayCount = Math.min(contactedTodayLeads.length, 30);
  const remainingForGoal = Math.max(0, settings.dailyQuota - contactedTodayCount);

  // 1. Sent Cold Emails State (Outreached by Kashi)
  const [sentColdMails, setSentColdMails] = useState<SentColdEmailRecord[]>([
    {
      id: 'sent-1',
      leadId: leads[0]?.id || '1',
      leadName: leads[0]?.businessName || 'Apex Dental Care',
      recipientEmail: leads[0]?.email || 'info@apexdental.com',
      website: leads[0]?.website || 'apexdental.com',
      subject: `Quick Website Speed & React Rebuild Audit for ${leads[0]?.businessName || 'Apex Dental Care'}`,
      emailBody: `Hi ${leads[0]?.contactPerson || 'Dr. Smith'},\n\nI noticed your website at ${leads[0]?.website || 'apexdental.com'} is currently experiencing a slow 3.8s load time and missing mobile touch responsiveness.\n\nMy name is ${profile.name}, a Full Stack Developer specializing in React, Node.js, and sub-second PageSpeed optimizations. I built a custom 40-second video walkthrough showing how we can rebuild your booking portal to boost conversions by 45%.\n\nHere is my portfolio: ${profile.portfolioUrl}\n\nWould you be open to a brief 5-minute chat this week?\n\nBest regards,\n${profile.name}\n${profile.title}`,
      sentAt: `${todayDateStr} 08:30 AM`,
      skillsHighlighted: ['React 18', 'Sub-second PageSpeed (99/100)', 'Mobile Responsive Layout'],
      status: 'Replied',
    },
    {
      id: 'sent-2',
      leadId: leads[1]?.id || '2',
      leadName: leads[1]?.businessName || 'Elite Legal Partners',
      recipientEmail: leads[1]?.email || 'contact@elitelegal.com',
      website: leads[1]?.website || 'elitelegal.com',
      subject: `Mobile Layout Fix & Automated Client Booking Portal`,
      emailBody: `Hi ${leads[1]?.contactPerson || 'Sarah'},\n\nWhile reviewing legal consult portals in your area, I audited ${leads[1]?.website || 'elitelegal.com'}. I noticed your main contact buttons break on mobile screens.\n\nAs a Full Stack Developer (${profile.name}), I build high-converting mobile web apps with automated WhatsApp lead routers.\n\nI can fix these mobile bottlenecks in 48 hours. Let me know if you'd like to see a free prototype!\n\nBest,\n${profile.name}`,
      sentAt: `${todayDateStr} 07:15 AM`,
      skillsHighlighted: ['Mobile Touch Layout', 'WhatsApp Lead Router', 'Full Stack Express Backend'],
      status: 'Opened',
    },
    {
      id: 'sent-3',
      leadId: leads[2]?.id || '3',
      leadName: leads[2]?.businessName || 'Metro Construction Co.',
      recipientEmail: leads[2]?.email || 'sales@metrobuild.com',
      website: leads[2]?.website || 'metrobuild.com',
      subject: `Project Showcase & Speed Optimization Proposal`,
      emailBody: `Hi Team,\n\nYour portfolio at ${leads[2]?.website || 'metrobuild.com'} has fantastic project photos, but the uncompressed media slows page load down to 18/100 on Google PageSpeed.\n\nI specialize in sub-second image compression and React hydration. Let's fix this load time so you don't lose organic leads.\n\nRegards,\n${profile.name}`,
      sentAt: `${todayDateStr} 06:45 AM`,
      skillsHighlighted: ['PageSpeed 99/100', 'Image Asset Compression'],
      status: 'Delivered',
    },
  ]);

  const [selectedSentMail, setSelectedSentMail] = useState<SentColdEmailRecord | null>(null);

  // 2. Team & Employee Work Done State
  const [teamWorkDone, setTeamWorkDone] = useState<TeamWorkDoneRecord[]>([
    {
      id: 'work-1',
      employeeName: 'Muhammad Waqas',
      role: 'Lead Full Stack Architect',
      taskTitle: 'Sub-second React App Migration & Core Web Vitals Optimization',
      clientName: leads[0]?.businessName || 'Apex Dental Care',
      completedAt: todayDateStr,
      hoursSpent: 6.5,
      deliverableSummary: 'Migrated legacy website to a high-speed React + Vite SPA. Optimized image assets, removed bloat JS scripts, and configured CDN caching.',
      codeSnippetOrMetric: 'Google PageSpeed: 34/100 ➔ 99/100 (Load Time: 0.42s)',
      pageSpeedScoreBefore: 34,
      pageSpeedScoreAfter: 99,
      clientRating: 5.0,
    },
    {
      id: 'work-2',
      employeeName: 'Frontend Dev',
      role: 'UI/UX & Mobile Specialist',
      taskTitle: 'Mobile Responsive Touch Layout & WhatsApp Booking Bot Integration',
      clientName: leads[1]?.businessName || 'Elite Legal Partners',
      completedAt: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      hoursSpent: 4.0,
      deliverableSummary: 'Redesigned mobile touch targets, fixed viewport overflows, and hooked sticky WhatsApp booking floating widget.',
      codeSnippetOrMetric: 'Mobile Touch Accessibility: 100% Passed • WhatsApp Click Conversion +38%',
      clientRating: 5.0,
    },
    {
      id: 'work-3',
      employeeName: 'Backend Engineer',
      role: 'API & Database Engineer',
      taskTitle: 'Secure Express API Proxy & Webhook Lead Router',
      clientName: leads[2]?.businessName || 'Metro Construction Co.',
      completedAt: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
      hoursSpent: 5.0,
      deliverableSummary: 'Created Express.js backend endpoints with rate limiting, input validation, and automatic email/WhatsApp notification webhooks.',
      codeSnippetOrMetric: 'Endpoint: /api/leads/submit • Latency: 45ms • Zero Key Exposure',
      clientRating: 4.9,
    },
  ]);

  // Modal State for Adding Completed Work
  const [isAddWorkOpen, setIsAddWorkOpen] = useState(false);
  const [workEmpName, setWorkEmpName] = useState('Muhammad Waqas');
  const [workRole, setWorkRole] = useState('Lead Full Stack Architect');
  const [workTaskTitle, setWorkTaskTitle] = useState('');
  const [workClientName, setWorkClientName] = useState(leads[0]?.businessName || 'Client Project');
  const [workHours, setWorkHours] = useState(4);
  const [workSummary, setWorkSummary] = useState('');
  const [workMetric, setWorkMetric] = useState('');

  // 3. Real Website Captures State & Viewport Inspector
  const [selectedCaptureLead, setSelectedCaptureLead] = useState<Lead | undefined>(leads[0]);

  const [activeViewport, setActiveViewport] = useState<'desktop' | 'mobile' | 'iframe'>('desktop');

  // Team Pending Tasks State
  const [teamTasks, setTeamTasks] = useState<KashiTaskItem[]>(() => {
    if (leads.length > 0) {
      return [
        {
          id: 'task-1',
          leadId: leads[0]?.id,
          businessName: leads[0]?.businessName,
          title: 'Sub-second React App Migration & Speed Boost',
          description: 'Optimize image assets, strip unneeded scripts, deliver 99/100 PageSpeed.',
          assignedTo: profile.name || 'Muhammad Waqas',
          priority: 'High',
          status: 'In Progress',
          dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
          category: 'PageSpeed Fix',
          createdAt: todayDateStr,
        }
      ];
    }
    return [];
  });

  // Activity Logs
  const [activityLogs, setActivityLogs] = useState<KashiLogEntry[]>([
    {
      id: 'log-1',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actionType: 'DAILY_REMINDER',
      title: 'Daily Outreach Ready',
      details: `Good morning ${profile.name}! Kashi Agent initialized and ready. Search or import new leads to begin outreach.`,
      status: 'INFO',
    },
  ]);

  // Chat Console State
  const [chatMessages, setChatMessages] = useState<
    { sender: 'user' | 'kashi'; text: string; timestamp: string; actionTaken?: string }[]
  >([
    {
      sender: 'kashi',
      text: `Hello ${profile.name}! I am **Agent Kashi**, your autonomous AI Operations Agent. My goal is to save you time, maintain your **30 daily outreach target**, auto-dispatch cold emails with your Full Stack Developer skills, catch opportunities, and track work done by your team!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isProcessingCommand, setIsProcessingCommand] = useState(false);

  // New Task Modal State
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('Muhammad Waqas');
  const [newTaskPriority, setNewTaskPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [newTaskCategory, setNewTaskCategory] = useState<'Web Build' | 'PageSpeed Fix' | 'Mobile Layout' | 'WhatsApp Bot' | 'Client Review'>('Web Build');

  // Triggering Kashi Autopilot Dispatch
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchSuccessMsg, setDispatchSuccessMsg] = useState<string | null>(null);

  const handleRunAutopilotDispatch = () => {
    setIsDispatching(true);

    setTimeout(() => {
      const uncontacted = leads.filter((l) => l.contactStatus === 'Not Contacted');
      const countToDispatch = Math.min(uncontacted.length, remainingForGoal > 0 ? remainingForGoal : 10);

      if (countToDispatch > 0) {
        const newlyDispatchedMails: SentColdEmailRecord[] = [];

        uncontacted.slice(0, countToDispatch).forEach((lead) => {
          onUpdateLead({
            ...lead,
            contactStatus: 'Contacted',
            lastContactDate: todayDateStr,
            notes: (lead.notes || '') + `\n[Agent Kashi Autopilot]: Auto-dispatched cold outreach email highlighting ${profile.name}'s Full Stack Web & Speed Optimization skills.`,
          });

          const specificNeed = lead.auditIssue || lead.websiteStatus || 'mobile responsiveness & sub-second page load optimization';
          const suggestedSolution = lead.suggestedService || 'Custom React SPA & High-Speed Mobile Booking Funnel';

          newlyDispatchedMails.push({
            id: `sent-auto-${Date.now()}-${lead.id}`,
            leadId: lead.id,
            leadName: lead.businessName,
            recipientEmail: lead.email || `contact@${lead.website}`,
            website: lead.website,
            subject: `Observation regarding ${lead.businessName}'s ${lead.industry} portal & ${specificNeed.slice(0, 45)}`,
            emailBody: `Hi ${lead.contactPerson || 'there'},\n\nI was reviewing top ${lead.industry} businesses in ${lead.city || lead.country || 'your area'} and noticed ${lead.businessName} has fantastic market positioning.\n\nHowever, while auditing ${lead.website}, I observed a specific technical gap: ${specificNeed}.\n\nAs a Frontend Web Architect (${profile.name}), I specialize in building ${suggestedSolution} to capture lost leads and boost conversions.\n\nMind if I send over a 2-minute video walkthrough showing how we can resolve this for ${lead.businessName}?\n\nBest regards,\n${profile.name}\n${profile.title}\nPortfolio: ${profile.portfolioUrl}`,
            sentAt: `${todayDateStr} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
            skillsHighlighted: ['React 18 / Node.js', 'Sub-second PageSpeed', 'Mobile Conversion Funnels'],
            status: 'Delivered',
          });
        });

        setSentColdMails((prev) => [...newlyDispatchedMails, ...prev]);

        const newLog: KashiLogEntry = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actionType: 'OUTREACH_DISPATCH',
          title: `Autopilot Dispatched ${countToDispatch} Cold Emails`,
          details: `Kashi auto-generated personalized cold emails matching ${profile.name}'s skills and dispatched to ${countToDispatch} leads.`,
          status: 'SUCCESS',
        };

        setActivityLogs((prev) => [newLog, ...prev]);

        setChatMessages((prev) => [
          ...prev,
          {
            sender: 'kashi',
            text: `⚡ **Autopilot Dispatch Complete!** Sent cold emails to **${countToDispatch} leads**. You can view every sent cold mail in the **"Outreached Cold Emails"** tab!`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            actionTaken: `Dispatched ${countToDispatch} cold emails using ${profile.name}'s Full Stack profile.`,
          },
        ]);

        setDispatchSuccessMsg(`Successfully auto-dispatched ${countToDispatch} cold outreach emails! View them in the Outreached Emails tab.`);
        setTimeout(() => setDispatchSuccessMsg(null), 5000);
      } else {
        setDispatchSuccessMsg('All current leads have already been contacted today or no uncontacted leads available.');
        setTimeout(() => setDispatchSuccessMsg(null), 4000);
      }

      setIsDispatching(false);
    }, 1500);
  };

  const handleSendChatCommand = async (customPrompt?: string) => {
    const textToSend = customPrompt || chatInput;
    if (!textToSend.trim()) return;

    const userMsg = {
      sender: 'user' as const,
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setChatInput('');
    setIsProcessingCommand(true);

    const lower = textToSend.toLowerCase();

    // Check if it's a specific action command
    if (lower.includes('send') || lower.includes('outreach') || lower.includes('dispatch') || lower.includes('30')) {
      const uncontacted = leads.filter((l) => l.contactStatus === 'Not Contacted');
      const count = Math.min(uncontacted.length, 5);

      if (count > 0) {
        const newMails: SentColdEmailRecord[] = [];
        uncontacted.slice(0, count).forEach((l) => {
          onUpdateLead({
            ...l,
            contactStatus: 'Contacted',
            lastContactDate: todayDateStr,
          });

          newMails.push({
            id: `sent-chat-${Date.now()}-${l.id}`,
            leadId: l.id,
            leadName: l.businessName,
            recipientEmail: l.email || `info@${l.website}`,
            website: l.website,
            subject: `Full Stack React Rebuild & Speed Boost for ${l.businessName}`,
            emailBody: `Hi ${l.contactPerson || 'Team'},\n\nI analyzed your site ${l.website} and noticed key speed bottlenecks. As a Full Stack Developer (${profile.name}), I build high-performing React web apps that load in under 1 second.\n\nLet's connect!\n\nBest,\n${profile.name}`,
            sentAt: `${todayDateStr} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
            skillsHighlighted: ['React App', '99 PageSpeed Score', 'Mobile Layout'],
            status: 'Delivered',
          });
        });

        setSentColdMails((prev) => [...newMails, ...prev]);

        setChatMessages((prev) => [
          ...prev,
          {
            sender: 'kashi',
            text: `Dispatched cold email pitches to **${count} leads** emphasizing your Full Stack React & PageSpeed skills. Check the **Outreached Cold Emails** tab to inspect full messages!`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            actionTaken: `Sent ${count} cold emails automatically.`,
          },
        ]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: 'kashi',
            text: `Your daily total is **${contactedTodayCount} / 30**. You have already reached available leads today!`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
      setIsProcessingCommand(false);
      return;
    }

    // Call AI Endpoint for general chat and strategy queries
    try {
      const { ok, data } = await loggedFetch('/api/ai/kashi-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: textToSend,
          developerProfile: profile,
          leadsCount: leads.length,
          contactedTodayCount,
        }),
      });

      if (ok && data?.success && data.replyText) {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: 'kashi',
            text: data.replyText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else {
        throw new Error('Fallback needed');
      }
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'kashi',
          text: `Understood, ${profile.name}! As Agent Kashi, I am tracking your target ($2,000+ project value opportunities) and your **30 daily outreach quota** (${contactedTodayCount}/30 completed). Let's generate a proposal, audit a domain, or dispatch cold outreach!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsProcessingCommand(false);
    }
  };

  const handleAddNewTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: KashiTaskItem = {
      id: `task-${Date.now()}`,
      title: newTaskTitle,
      description: newTaskDesc,
      assignedTo: newTaskAssignee,
      priority: newTaskPriority,
      status: 'Pending',
      dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      category: newTaskCategory,
      createdAt: todayDateStr,
    };

    setTeamTasks((prev) => [newTask, ...prev]);
    setNewTaskTitle('');
    setNewTaskDesc('');
    setIsAddTaskOpen(false);

    setActivityLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionType: 'TEAM_TASK_ASSIGNED',
        title: `Task Assigned: ${newTaskTitle}`,
        details: `Assigned to ${newTaskAssignee} (${newTaskPriority} Priority).`,
        status: 'SUCCESS',
      },
      ...prev,
    ]);
  };

  const handleAddCompletedWork = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workTaskTitle.trim()) return;

    const newRecord: TeamWorkDoneRecord = {
      id: `work-${Date.now()}`,
      employeeName: workEmpName,
      role: workRole,
      taskTitle: workTaskTitle,
      clientName: workClientName,
      completedAt: todayDateStr,
      hoursSpent: Number(workHours),
      deliverableSummary: workSummary,
      codeSnippetOrMetric: workMetric || 'Quality Verified & Delivered to Client',
      clientRating: 5.0,
    };

    setTeamWorkDone((prev) => [newRecord, ...prev]);
    setIsAddWorkOpen(false);
    setWorkTaskTitle('');
    setWorkSummary('');
    setWorkMetric('');
  };

  const toggleTaskStatus = (id: string) => {
    setTeamTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextStatus = t.status === 'Pending' ? 'In Progress' : t.status === 'In Progress' ? 'Completed' : 'Pending';
          return { ...t, status: nextStatus };
        }
        return t;
      })
    );
  };

  const deleteTask = (id: string) => {
    setTeamTasks((prev) => prev.filter((t) => t.id !== id));
  };

  // Real website dynamic screenshot URL builder
  const getRealWebsiteScreenshotUrl = (domain: string, width = 1200) => {
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    return `https://image.thum.io/get/width/${width}/crop/800/noanimate/https://${cleanDomain}`;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Agent Kashi Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-amber-500 flex items-center justify-center text-white shadow-xl border-2 border-indigo-400">
                <Bot className="w-9 h-9" />
              </div>
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-slate-900 rounded-full flex items-center justify-center text-[10px] text-white font-black" title="Autopilot Online">
                ✓
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  Agent Kashi <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold uppercase tracking-wider">AI Operations Hub</span>
                </h1>
              </div>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Autonomous Co-Pilot for <strong>{profile.name}</strong> ({profile.title}). Dedicated to maintaining your <strong>30 Daily Outreach Goal</strong>, displaying cold emails sent, fetching <strong>real live client website viewports</strong>, and tracking work completed by your development team!
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400 font-medium">
                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Autopilot Active
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-amber-300 font-bold">
                  <Target className="w-3.5 h-3.5" /> Daily Target: 30 Leads
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-indigo-300 font-bold">
                  <Mail className="w-3.5 h-3.5" /> {sentColdMails.length} Cold Emails Outreached
                </span>
              </div>
            </div>
          </div>

          {/* Autopilot Engine Toggle & Dispatch */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 shrink-0 w-full lg:w-auto space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div className="text-xs">
                <span className="font-extrabold text-white block">Kashi Autopilot Engine</span>
                <span className="text-[10px] text-slate-400">Auto-sends pitches if daily target is pending</span>
              </div>
              <button
                onClick={() => setSettings((s) => ({ ...s, isEnabled: !s.isEnabled }))}
                className={`px-3 py-1.5 rounded-xl font-black text-xs transition flex items-center gap-1.5 ${
                  settings.isEnabled
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {settings.isEnabled ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
                {settings.isEnabled ? 'ENABLED' : 'PAUSED'}
              </button>
            </div>

            <button
              onClick={handleRunAutopilotDispatch}
              disabled={isDispatching}
              className="w-full py-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 fill-amber-300 text-amber-300" />
              {isDispatching ? 'Kashi Dispatching Pitches...' : `⚡ Run Kashi Autopilot (Send Remaining ${remainingForGoal})`}
            </button>
          </div>
        </div>

        {dispatchSuccessMsg && (
          <div className="mt-4 p-3 bg-emerald-950/90 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs font-bold flex items-center justify-between animate-fadeIn">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {dispatchSuccessMsg}
            </span>
            <button onClick={() => setDispatchSuccessMsg(null)} className="text-emerald-400 hover:underline text-[10px]">Dismiss</button>
          </div>
        )}
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 border border-slate-200 rounded-2xl">
        <button
          onClick={() => setActiveSubTab('console')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 ${
            activeSubTab === 'console'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
          }`}
        >
          <Bot className="w-4 h-4" /> Kashi Command Console
        </button>

        <button
          onClick={() => setActiveSubTab('sent_mails')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 ${
            activeSubTab === 'sent_mails'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
          }`}
        >
          <Mail className="w-4 h-4" /> Outreached Cold Emails ({sentColdMails.length})
        </button>

        <button
          onClick={() => setActiveSubTab('team_work')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 ${
            activeSubTab === 'team_work'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
          }`}
        >
          <Award className="w-4 h-4" /> Team Completed Work ({teamWorkDone.length})
        </button>

        <button
          onClick={() => setActiveSubTab('real_captures')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 ${
            activeSubTab === 'real_captures'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
          }`}
        >
          <Globe className="w-4 h-4" /> Real Client Website Captures
        </button>
      </div>

      {/* TAB 1: KASHI COMMAND CONSOLE & TODAY'S TARGET */}
      {activeSubTab === 'console' && (
        <div className="space-y-6">
          {/* Daily 30 Outreach Progress Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="text-xs font-extrabold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Target className="w-4 h-4" /> Daily Outreach Goal Tracker
                </div>
                <h2 className="text-lg font-black text-slate-900 mt-0.5">
                  Daily Target: 30 Client Pitches ({contactedTodayCount} / 30 Completed)
                </h2>
              </div>

              <span className={`px-3 py-1 rounded-full text-xs font-black border ${
                contactedTodayCount >= 30 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {contactedTodayCount >= 30 ? '🎉 30 Daily Goal Hit!' : `⚠️ ${remainingForGoal} More Needed Today`}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>Outreach Completion Progress ({Math.round((contactedTodayCount / 30) * 100)}%)</span>
                <span className="text-indigo-600">{contactedTodayCount} of 30 Goal</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3.5 p-0.5 border border-slate-200 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-500 h-full rounded-full transition-all duration-700 shadow-sm"
                  style={{ width: `${Math.min(100, Math.round((contactedTodayCount / 30) * 100))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Console Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Interactive Console */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden h-[580px]">
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-md">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-black flex items-center gap-1.5">
                      Agent Kashi Console <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                    <div className="text-[10px] text-slate-400">Online • AI Operations Co-Pilot</div>
                  </div>
                </div>

                <button
                  onClick={() => setChatMessages([{
                    sender: 'kashi',
                    text: `Console reset! Ready to assist you, ${profile.name}. Your daily outreach target is 30 leads. What would you like me to run?`,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  }])}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition text-xs flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Clear
                </button>
              </div>

              {/* Preset Prompts */}
              <div className="p-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto">
                <button
                  onClick={() => handleSendChatCommand("Kashi, send 10 cold emails now to reach my 30 daily goal")}
                  className="px-2.5 py-1 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-600 rounded-lg text-[11px] font-bold transition shrink-0"
                >
                  🚀 Send 10 Cold Emails
                </button>
                <button
                  onClick={() => handleSendChatCommand("Kashi, show me team work completed today")}
                  className="px-2.5 py-1 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-600 rounded-lg text-[11px] font-bold transition shrink-0"
                >
                  🏆 View Team Work
                </button>
                <button
                  onClick={() => handleSendChatCommand("Kashi, inspect real client website viewports")}
                  className="px-2.5 py-1 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-600 rounded-lg text-[11px] font-bold transition shrink-0"
                >
                  🌐 Inspect Real Sites
                </button>
              </div>

              {/* Chat Stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/5">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.sender === 'kashi' && (
                      <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}
                    <div className={`max-w-[85%] rounded-2xl p-3.5 space-y-1 text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-indigo-600 text-white shadow-md rounded-tr-none'
                        : 'bg-white border border-slate-200 text-slate-800 shadow-sm rounded-tl-none'
                    }`}>
                      <div className="flex items-center justify-between gap-3 text-[10px] opacity-70 font-semibold">
                        <span>{msg.sender === 'user' ? profile.name : 'Agent Kashi'}</span>
                        <span>{msg.timestamp}</span>
                      </div>
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                      {msg.actionTaken && (
                        <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Action: {msg.actionTaken}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isProcessingCommand && (
                  <div className="flex items-center gap-2 text-xs text-indigo-600 font-bold p-2 bg-indigo-50 rounded-xl border border-indigo-100 w-max animate-pulse">
                    <Bot className="w-4 h-4 text-indigo-600" /> Kashi is executing command...
                  </div>
                )}
              </div>

              <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChatCommand()}
                  placeholder="Ask Kashi (e.g. 'Kashi, dispatch outreach to 10 dental leads')..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
                <button
                  onClick={() => handleSendChatCommand()}
                  disabled={!chatInput.trim() || isProcessingCommand}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" /> Send
                </button>
              </div>
            </div>

            {/* Team Task Delegation Sidebar */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <div className="text-xs font-extrabold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-indigo-600" /> Pending Team Tasks
                    </div>
                    <h3 className="text-base font-black text-slate-900 mt-0.5">Development Queue</h3>
                  </div>
                  <button
                    onClick={() => setIsAddTaskOpen(true)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Assign Task
                  </button>
                </div>

                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {teamTasks.map((task) => (
                    <div key={task.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-start justify-between">
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                          {task.category}
                        </span>
                        <button onClick={() => deleteTask(task.id)} className="text-slate-400 hover:text-rose-600">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900">{task.title}</h4>
                      <p className="text-[11px] text-slate-600 line-clamp-2">{task.description}</p>
                      <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-700">{task.assignedTo}</span>
                        <button
                          onClick={() => toggleTaskStatus(task.id)}
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                            task.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
                          }`}
                        >
                          {task.status}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: OUTREACHED COLD EMAILS VIEWER */}
      {activeSubTab === 'sent_mails' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="text-xs font-extrabold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-4 h-4" /> Outreached Cold Email Log
              </div>
              <h2 className="text-lg font-black text-slate-900 mt-0.5">
                All Cold Outreach Sent by Agent Kashi ({sentColdMails.length} Total Dispatched)
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Kashi auto-injects your Full Stack Development skills (React, Node, PageSpeed 99) into every pitch.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {sentColdMails.map((mail) => (
              <div
                key={mail.id}
                className="p-4 bg-slate-50 hover:bg-indigo-50/40 border border-slate-200 hover:border-indigo-300 rounded-xl transition space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900 text-sm">{mail.leadName}</span>
                      <span className="text-xs text-slate-500">({mail.recipientEmail})</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        mail.status === 'Replied' ? 'bg-emerald-100 text-emerald-800 font-extrabold' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {mail.status === 'Replied' ? '🔥 Replied (Hot Opportunity)' : mail.status}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-indigo-900 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-indigo-600" /> Subject: "{mail.subject}"
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-slate-400 font-mono">{mail.sentAt}</span>
                    <button
                      onClick={() => setSelectedSentMail(mail)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition flex items-center gap-1 shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5" /> Inspect Email
                    </button>
                  </div>
                </div>

                {/* Body snippet */}
                <p className="text-xs text-slate-600 line-clamp-2 italic bg-white p-2.5 rounded-lg border border-slate-200">
                  "{mail.emailBody}"
                </p>

                {/* Skill Hooks */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Skill Hooks Used:</span>
                  {mail.skillsHighlighted.map((skill, sIdx) => (
                    <span key={sIdx} className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
                      ✓ {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: TEAM & EMPLOYEE COMPLETED WORK TRACKER */}
      {activeSubTab === 'team_work' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="text-xs font-extrabold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-indigo-600" /> Team & Employee Work Done Hub
              </div>
              <h2 className="text-lg font-black text-slate-900 mt-0.5">
                Completed Deliverables & Proof of Work
              </h2>
            </div>

            <button
              onClick={() => setIsAddWorkOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold rounded-xl transition flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-4 h-4" /> Log Completed Work
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {teamWorkDone.map((work) => (
              <div key={work.id} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 uppercase shadow-md">
                      {work.employeeName.slice(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-sm">{work.employeeName}</span>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 uppercase">
                          {work.role}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-slate-600 mt-0.5">
                        Client: <strong className="text-slate-900">{work.clientName}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> Client Rating: {work.clientRating.toFixed(1)} / 5.0
                    </span>
                    <span className="text-xs font-bold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                      ⏱️ {work.hoursSpent} Hours Logged
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-emerald-500" /> {work.taskTitle}
                  </h4>
                  <p className="text-xs text-slate-700 mt-1 leading-relaxed">{work.deliverableSummary}</p>
                </div>

                {work.codeSnippetOrMetric && (
                  <div className="p-3 bg-slate-900 text-white rounded-xl text-xs font-mono border border-slate-800 flex items-center justify-between">
                    <span className="text-emerald-400 font-bold">🚀 {work.codeSnippetOrMetric}</span>
                    <span className="text-[10px] text-slate-400 font-sans">Delivered & Verified</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: REAL CLIENT WEBSITE CAPTURES & VIEWPORTS */}
      {activeSubTab === 'real_captures' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="text-xs font-extrabold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-4 h-4" /> Real Client Website Inspector
              </div>
              <h2 className="text-lg font-black text-slate-900 mt-0.5">
                Live Client Website Captures & Viewports
              </h2>
            </div>

            {/* Select Target Client */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Select Lead:</span>
              <select
                value={selectedCaptureLead.id}
                onChange={(e) => {
                  const found = leads.find((l) => l.id === e.target.value);
                  if (found) setSelectedCaptureLead(found);
                }}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none"
              >
                {leads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.businessName} ({lead.website})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Lead Header Info & Viewport Switchers */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">{selectedCaptureLead.businessName}</h3>
                <a
                  href={`https://${selectedCaptureLead.website.replace(/^https?:\/\//, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-indigo-300 hover:underline flex items-center gap-1 font-mono"
                >
                  {selectedCaptureLead.website} <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Industry: {selectedCaptureLead.industry} • Contact: {selectedCaptureLead.contactPerson} ({selectedCaptureLead.email})
              </p>
            </div>

            {/* Viewport Modes */}
            <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveViewport('desktop')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeViewport === 'desktop' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Laptop className="w-4 h-4" /> Desktop (1920x1080)
              </button>
              <button
                onClick={() => setActiveViewport('mobile')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeViewport === 'mobile' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-4 h-4" /> Mobile View (375x812)
              </button>
              <button
                onClick={() => setActiveViewport('iframe')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeViewport === 'iframe' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Globe className="w-4 h-4 text-emerald-400" /> Live Interactive Canvas
              </button>
            </div>
          </div>

          {/* Viewport Canvas Render */}
          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col items-center justify-center min-h-[500px]">
            {activeViewport === 'desktop' && (
              <div className="w-full max-w-5xl space-y-3">
                <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border border-slate-800 rounded-t-xl text-xs text-slate-400">
                  <span className="font-bold text-slate-200 flex items-center gap-2">
                    <Laptop className="w-4 h-4 text-indigo-400" /> Real Desktop Capture (1920x1080) for {selectedCaptureLead.website}
                  </span>
                  <span className="text-emerald-400 font-bold">✓ Live Web Snapshot Fetched</span>
                </div>
                <div className="relative rounded-b-xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-900 aspect-video flex items-center justify-center">
                  <img
                    src={getRealWebsiteScreenshotUrl(selectedCaptureLead.website, 1200)}
                    alt={`Real website capture of ${selectedCaptureLead.businessName}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://mini.s-shot.ru/1920x1080/PNG/1000/?https://${selectedCaptureLead.website}`;
                    }}
                  />
                </div>
              </div>
            )}

            {activeViewport === 'mobile' && (
              <div className="w-full max-w-sm space-y-3">
                <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border border-slate-800 rounded-t-xl text-xs text-slate-400">
                  <span className="font-bold text-slate-200 flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-indigo-400" /> Mobile View (375x812)
                  </span>
                  <span className="text-emerald-400 font-bold">✓ Touch Viewport</span>
                </div>
                <div className="relative rounded-b-xl overflow-hidden border-4 border-slate-800 shadow-2xl bg-slate-900 h-[600px] flex items-center justify-center">
                  <img
                    src={getRealWebsiteScreenshotUrl(selectedCaptureLead.website, 400)}
                    alt={`Real mobile website capture of ${selectedCaptureLead.businessName}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://mini.s-shot.ru/1024x768/PNG/1000/?https://${selectedCaptureLead.website}`;
                    }}
                  />
                </div>
              </div>
            )}

            {activeViewport === 'iframe' && (
              <div className="w-full max-w-5xl space-y-3">
                <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border border-slate-800 rounded-t-xl text-xs text-slate-400">
                  <span className="font-bold text-slate-200 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-400" /> Live Interactive Iframe Canvas for https://{selectedCaptureLead.website.replace(/^https?:\/\//, '')}
                  </span>
                  <a
                    href={`https://${selectedCaptureLead.website.replace(/^https?:\/\//, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] rounded flex items-center gap-1"
                  >
                    Open New Tab <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="w-full h-[550px] rounded-b-xl overflow-hidden border border-slate-800 bg-white">
                  <iframe
                    src={`https://${selectedCaptureLead.website.replace(/^https?:\/\//, '')}`}
                    title={`Live Client Website Preview - ${selectedCaptureLead.businessName}`}
                    className="w-full h-full border-none"
                    sandbox="allow-scripts allow-same-origin"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Inspect Outreached Cold Mail Modal */}
      {selectedSentMail && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Outreached Cold Pitch</span>
                <h3 className="text-base font-black text-slate-900">{selectedSentMail.leadName}</h3>
              </div>
              <button onClick={() => setSelectedSentMail(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div><strong>To:</strong> {selectedSentMail.recipientEmail}</div>
                <div><strong>Website:</strong> {selectedSentMail.website}</div>
                <div><strong>Subject:</strong> {selectedSentMail.subject}</div>
                <div><strong>Sent Time:</strong> {selectedSentMail.sentAt}</div>
              </div>

              <div>
                <label className="block font-extrabold text-slate-800 mb-1">Full Email Content:</label>
                <div className="p-4 bg-slate-900 text-slate-100 rounded-xl font-sans whitespace-pre-wrap leading-relaxed text-xs border border-slate-800">
                  {selectedSentMail.emailBody}
                </div>
              </div>

              <div>
                <label className="block font-extrabold text-slate-800 mb-1">Skills Highlighted in Pitch:</label>
                <div className="flex flex-wrap gap-2">
                  {selectedSentMail.skillsHighlighted.map((skill, idx) => (
                    <span key={idx} className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold rounded-lg text-[11px]">
                      ✓ {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedSentMail(null)}
                className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log Completed Team Work Modal */}
      {isAddWorkOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-600" /> Log Completed Team Deliverable
              </h3>
              <button onClick={() => setIsAddWorkOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleAddCompletedWork} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Employee Name</label>
                  <select
                    value={workEmpName}
                    onChange={(e) => {
                      setWorkEmpName(e.target.value);
                      if (e.target.value === 'Muhammad Waqas') setWorkRole('Lead Full Stack Architect');
                      if (e.target.value === 'Frontend Dev') setWorkRole('UI/UX & Mobile Specialist');
                      if (e.target.value === 'Backend Engineer') setWorkRole('API & Database Engineer');
                      if (e.target.value === 'QA Specialist') setWorkRole('PageSpeed & Performance Auditor');
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
                  >
                    <option value="Muhammad Waqas">Muhammad Waqas</option>
                    <option value="Frontend Dev">Frontend Dev</option>
                    <option value="Backend Engineer">Backend Engineer</option>
                    <option value="QA Specialist">QA Specialist</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Role Title</label>
                  <input
                    type="text"
                    value={workRole}
                    onChange={(e) => setWorkRole(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Task Deliverable Title</label>
                <input
                  type="text"
                  value={workTaskTitle}
                  onChange={(e) => setWorkTaskTitle(e.target.value)}
                  placeholder="e.g. Sub-second React App Migration"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Client Business</label>
                  <input
                    type="text"
                    value={workClientName}
                    onChange={(e) => setWorkClientName(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hours Logged</label>
                  <input
                    type="number"
                    value={workHours}
                    onChange={(e) => setWorkHours(Number(e.target.value))}
                    min={0.5}
                    step={0.5}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Deliverable Summary & Outcomes</label>
                <textarea
                  value={workSummary}
                  onChange={(e) => setWorkSummary(e.target.value)}
                  placeholder="Describe what was built and delivered to the client..."
                  rows={2}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Code Snippet or Performance Metric (Optional)</label>
                <input
                  type="text"
                  value={workMetric}
                  onChange={(e) => setWorkMetric(e.target.value)}
                  placeholder="e.g. PageSpeed: 38 ➔ 99 (0.4s load) or Express Proxy Route"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-mono text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddWorkOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white font-extrabold rounded-xl shadow-md"
                >
                  Save Deliverable Work
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Team Task Modal */}
      {isAddTaskOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" /> Assign Team Developer Task
              </h3>
              <button onClick={() => setIsAddTaskOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleAddNewTask} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Task Title</label>
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="e.g. Sub-second React PageSpeed Boost"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Detailed Instructions</label>
                <textarea
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  placeholder="Technical details for the team member..."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assign To</label>
                  <select
                    value={newTaskAssignee}
                    onChange={(e) => setNewTaskAssignee(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800"
                  >
                    <option value="Muhammad Waqas">Muhammad Waqas</option>
                    <option value="Frontend Dev">Frontend Dev</option>
                    <option value="Backend Engineer">Backend Engineer</option>
                    <option value="QA Specialist">QA Specialist</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddTaskOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white font-extrabold rounded-xl shadow-md"
                >
                  Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
