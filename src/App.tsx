import React, { useState, useEffect, useMemo } from 'react';
import { Menu, Zap } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { ApiBanner } from './components/ApiBanner';
import { DashboardView } from './components/DashboardView';
import { FinderView } from './components/FinderView';
import { DatabaseView } from './components/DatabaseView';
import { InboxView } from './components/InboxView';
import { OpportunitiesView } from './components/OpportunitiesView';
import { OutreachTrackerView } from './components/OutreachTrackerView';
import { FollowupsView } from './components/FollowupsView';
import { TemplatesView } from './components/TemplatesView';
import { PortfolioView } from './components/PortfolioView';
import { PipelineView } from './components/PipelineView';
import { SeoAgentView } from './components/SeoAgentView';
import { AnalyticsView } from './components/AnalyticsView';
import { SettingsView } from './components/SettingsView';
import { MediaVaultView } from './components/MediaVaultView';
import { CrmSuiteView } from './components/CrmSuiteView';
import { KashiAgentView } from './components/KashiAgentView';
import { TeamActivityView } from './components/TeamActivityView';

import { LeadModal } from './components/LeadModal';
import { EmailModal } from './components/EmailModal';
import { LinkedInModal } from './components/LinkedInModal';
import { AuditModal } from './components/AuditModal';
import { ImportModal } from './components/ImportModal';

import { INITIAL_LEADS, INITIAL_OUTREACH_LOGS, INITIAL_SCHEDULED_EMAILS, INITIAL_INBOUND_REPLIES } from './data/initialLeads';
import { Lead, OutreachLog, ScheduledEmail, UserProfile, EmailTemplate, InboundReply, ContactStatus } from './types';
import { exportLeadsToExcel } from './utils/excel';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Persistent Lead State
  const [leads, setLeads] = useState<Lead[]>(() => {
    const saved = localStorage.getItem('leadflow_leads');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_LEADS;
  });

  // Persistent Outreach Logs
  const [outreachLogs, setOutreachLogs] = useState<OutreachLog[]>(() => {
    const saved = localStorage.getItem('leadflow_outreach');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_OUTREACH_LOGS;
  });

  // Persistent Inbound Replies
  const [inboundReplies, setInboundReplies] = useState<InboundReply[]>(() => {
    const saved = localStorage.getItem('leadflow_replies');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_INBOUND_REPLIES;
  });

  // Persistent Scheduled Emails
  const [scheduledEmails, setScheduledEmails] = useState<ScheduledEmail[]>(() => {
    const saved = localStorage.getItem('leadflow_scheduled');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_SCHEDULED_EMAILS;
  });

  // Persistent User Profile
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('leadflow_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          name: 'Muhammad Waqas',
          title: 'Full Stack Developer',
          email: 'waqasashiq0381@gmail.com',
          portfolioUrl: 'https://muhammadwaqas.dev',
          githubUrl: 'https://github.com/engrwaqas-star',
          linkedInUrl: 'https://www.linkedin.com/in/waqas-ashiq-b489b041b?utm_source=share_via&utm_content=profile&utm_medium=member_android',
          profilePicUrl: undefined,
        };
      } catch (e) { /* ignore */ }
    }
    return {
      name: 'Muhammad Waqas',
      title: 'Full Stack Developer',
      email: 'waqasashiq0381@gmail.com',
      portfolioUrl: 'https://muhammadwaqas.dev',
      githubUrl: 'https://github.com/engrwaqas-star',
      linkedInUrl: 'https://www.linkedin.com/in/waqas-ashiq-b489b041b?utm_source=share_via&utm_content=profile&utm_medium=member_android',
      targetNiches: ['Real Estate', 'Clinics', 'Law Firms', 'Software Development'],
      dailyOutreachGoal: 30,
    };
  });

  // Modal States
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailLead, setEmailLead] = useState<Lead | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);

  const [isLinkedInModalOpen, setIsLinkedInModalOpen] = useState(false);
  const [linkedInLead, setLinkedInLead] = useState<Lead | null>(null);

  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [auditLead, setAuditLead] = useState<Lead | null>(null);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Background 30-Minute Inbox Poller State
  const [lastPolledAt, setLastPolledAt] = useState<Date | null>(new Date());
  const [isPolling, setIsPolling] = useState(false);
  const [pollAlert, setPollAlert] = useState<{ message: string; count: number } | null>(null);

  const triggerInboxPolling = async () => {
    setIsPolling(true);
    try {
      const res = await fetch('/api/gmail/poll-inbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          configuredEmail: profile.email,
          leadDomains: leads.map((l) => l.website).filter(Boolean),
        }),
      });
      const data = await res.json();
      setLastPolledAt(new Date());

      if (data.success && data.foundReplies && data.foundReplies.length > 0) {
        setInboundReplies((prev) => {
          const existingIds = new Set(prev.map((r) => r.id));
          const newItems = data.foundReplies.filter((r: any) => !existingIds.has(r.id));
          if (newItems.length > 0) {
            setPollAlert({
              message: `Background Inbox Poller detected ${newItems.length} new incoming message(s)!`,
              count: newItems.length,
            });
            return [...newItems, ...prev];
          }
          return prev;
        });
      }
    } catch (err) {
      console.warn('Background inbox polling error:', err);
    } finally {
      setIsPolling(false);
    }
  };

  // Automated Background Poller: Runs every 30 minutes
  useEffect(() => {
    const pollerInterval = setInterval(() => {
      triggerInboxPolling();
    }, 30 * 60 * 1000); // 30 mins

    return () => clearInterval(pollerInterval);
  }, [profile.email, leads]);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('leadflow_leads', JSON.stringify(leads));
  }, [leads]);

  useEffect(() => {
    localStorage.setItem('leadflow_outreach', JSON.stringify(outreachLogs));
  }, [outreachLogs]);

  useEffect(() => {
    localStorage.setItem('leadflow_replies', JSON.stringify(inboundReplies));
  }, [inboundReplies]);

  useEffect(() => {
    localStorage.setItem('leadflow_scheduled', JSON.stringify(scheduledEmails));
  }, [scheduledEmails]);

  useEffect(() => {
    localStorage.setItem('leadflow_profile', JSON.stringify(profile));
  }, [profile]);

  // Real-Time Company Enrichment Action
  const handleEnrichLead = async (lead: Lead) => {
    try {
      const res = await fetch('/api/enrich/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: lead.businessName,
          website: lead.website,
          city: lead.city,
          country: lead.country,
          industry: lead.industry,
          contactPerson: lead.contactPerson,
        }),
      });
      const data = await res.json();
      if (data.success && data.enrichment) {
        setLeads((prev) =>
          prev.map((l) =>
            l.id === lead.id
              ? {
                  ...l,
                  enrichment: data.enrichment,
                }
              : l
          )
        );
      }
    } catch (e) {
      console.error('Failed to enrich company profile:', e);
    }
  };

  // Simulate Inbound Email Reply Webhook Handler
  const handleSimulateReply = async (lead: Lead) => {
    try {
      const res = await fetch('/api/mailbox/simulate-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead }),
      });
      const data = await res.json();
      if (data.success && data.inboundReply) {
        setInboundReplies((prev) => [data.inboundReply, ...prev]);
        // Automatically update lead contactStatus to Replied!
        setLeads((prev) =>
          prev.map((l) =>
            l.id === lead.id ? { ...l, contactStatus: 'Replied' } : l
          )
        );
        setActiveTab('inbox');
      }
    } catch (e) {
      console.error('Failed to simulate reply:', e);
    }
  };


  // Calculate Follow-up Due Leads
  const followupLeads = useMemo(() => {
    return leads.filter((l) => {
      if (l.contactStatus === 'Replied' || l.contactStatus === 'Closed Won' || l.contactStatus === 'Declined') {
        return false;
      }
      if (l.contactStatus === 'Follow-Up Due') return true;
      if (l.lastContactDate) {
        const sentTime = new Date(l.lastContactDate).getTime();
        const currentTime = new Date('2026-08-10').getTime();
        const diffDays = Math.floor((currentTime - sentTime) / (1000 * 60 * 60 * 24));
        return diffDays >= 5;
      }
      return false;
    });
  }, [leads]);

  // Lead Handlers
  const handleSaveLead = (leadData: Omit<Lead, 'id' | 'createdAt'>, existingId?: string) => {
    if (existingId) {
      setLeads((prev) =>
        prev.map((l) => (l.id === existingId ? { ...l, ...leadData } : l))
      );
    } else {
      const newLead: Lead = {
        ...leadData,
        id: `lead-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        createdAt: new Date().toISOString().split('T')[0],
      };
      setLeads((prev) => [newLead, ...prev]);
    }
  };

  const handleDeleteLead = (id: string) => {
    if (confirm('Are you sure you want to delete this lead?')) {
      setLeads((prev) => prev.filter((l) => l.id !== id));
    }
  };

  const handleUpdateLeadStatus = (leadId: string, status: ContactStatus) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, contactStatus: status } : l))
    );
  };

  const handleImportLeads = (newLeads: Omit<Lead, 'id' | 'createdAt'>[]) => {
    const formatted: Lead[] = newLeads.map((nl, idx) => ({
      ...nl,
      id: `imported-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 5)}`,
      createdAt: new Date().toISOString().split('T')[0],
    }));
    setLeads((prev) => [...formatted, ...prev]);
  };

  // Inbox Reply Read / Replied State Handlers
  const handleMarkReplyRead = (replyId: string, read: boolean = true) => {
    setInboundReplies((prev) =>
      prev.map((r) => (r.id === replyId ? { ...r, read } : r))
    );
  };

  const handleMarkReplyReplied = (replyId: string, replyText: string) => {
    const nowISO = new Date().toISOString();
    setInboundReplies((prev) =>
      prev.map((r) =>
        r.id === replyId
          ? {
              ...r,
              read: true,
              replied: true,
              repliedAt: nowISO,
              repliedMessage: replyText,
            }
          : r
      )
    );
  };

  // Outreach Handlers
  const handleLogOutreach = (leadId: string, subject: string, body: string) => {
    const today = '2026-08-10';
    const dueDate = '2026-08-15';

    const targetLead = leads.find((l) => l.id === leadId);

    const newLog: OutreachLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      leadId,
      businessName: targetLead?.businessName || 'Prospect Business',
      email: targetLead?.email || 'contact@example.com',
      subject,
      body,
      sentDate: today,
      status: 'Sent',
      followupDueDate: dueDate,
    };

    setOutreachLogs((prev) => [newLog, ...prev]);

    // Automatically mark matching inbound replies for this lead/email as READ & REPLIED!
    setInboundReplies((prev) =>
      prev.map((r) =>
        r.leadId === leadId || (targetLead && r.senderEmail === targetLead.email)
          ? {
              ...r,
              read: true,
              replied: true,
              repliedAt: new Date().toISOString(),
              repliedMessage: body,
            }
          : r
      )
    );

    // Update Lead contact status
    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId
          ? {
              ...l,
              contactStatus: 'Contacted',
              lastContactDate: today,
            }
          : l
      )
    );
  };

  const handleScheduleOutreach = (
    leadId: string,
    subject: string,
    body: string,
    scheduledAt: string
  ) => {
    const targetLead = leads.find((l) => l.id === leadId);
    const newSched: ScheduledEmail = {
      id: `sched-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      leadId,
      businessName: targetLead?.businessName || 'Prospect Business',
      email: targetLead?.email || 'contact@example.com',
      subject,
      body,
      scheduledAt,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'Scheduled',
    };

    setScheduledEmails((prev) => [newSched, ...prev]);
  };

  const handleSendScheduledNow = (scheduledId: string) => {
    const target = scheduledEmails.find((s) => s.id === scheduledId);
    if (!target) return;

    handleLogOutreach(target.leadId, target.subject, target.body);

    setScheduledEmails((prev) =>
      prev.map((s) => (s.id === scheduledId ? { ...s, status: 'Sent' } : s))
    );
  };

  const handleCancelScheduled = (scheduledId: string) => {
    setScheduledEmails((prev) =>
      prev.map((s) => (s.id === scheduledId ? { ...s, status: 'Cancelled' } : s))
    );
  };

  const handleRescheduleEmail = (scheduledId: string, newDateTime: string) => {
    setScheduledEmails((prev) =>
      prev.map((s) =>
        s.id === scheduledId ? { ...s, scheduledAt: newDateTime } : s
      )
    );
  };

  const handleMarkReplied = (logId: string, leadId: string) => {
    const today = '2026-08-10';

    setOutreachLogs((prev) =>
      prev.map((log) =>
        log.id === logId
          ? { ...log, status: 'Replied', repliedDate: today }
          : log
      )
    );

    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId
          ? { ...l, contactStatus: 'Replied' }
          : l
      )
    );
  };

  const handleMarkRepliedDirect = (leadId: string) => {
    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId ? { ...l, contactStatus: 'Replied' } : l
      )
    );
  };

  const handleResetData = () => {
    setLeads(INITIAL_LEADS);
    setOutreachLogs(INITIAL_OUTREACH_LOGS);
    localStorage.removeItem('leadflow_leads');
    localStorage.removeItem('leadflow_outreach');
    alert('Database successfully reset to initial sample leads dataset!');
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex-col lg:flex-row">
      {/* Mobile Top Header */}
      <div className="lg:hidden bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black">
            <Zap className="w-4 h-4 fill-white" />
          </div>
          <span className="font-extrabold text-base tracking-tight text-white">
            LeadFlow <span className="text-indigo-400">AI</span>
          </span>
        </div>

        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition flex items-center gap-1.5 text-xs font-bold"
        >
          <Menu className="w-5 h-5 text-indigo-400" /> Menu
        </button>
      </div>

      {/* Mobile Sidebar Overlay Backdrop */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/70 z-50 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
        isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          followupCount={followupLeads.length}
          unreadInboxCount={inboundReplies.filter((r) => !r.read && !r.replied).length}
          profile={profile}
          onOpenImportModal={() => setIsImportModalOpen(true)}
          onCloseMobileSidebar={() => setIsMobileSidebarOpen(false)}
        />
      </div>

      {/* Main View Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
        {/* Top API Banner */}
        <ApiBanner onConfigureKeys={() => setActiveTab('settings')} />

        {/* Tab Views */}
        {activeTab === 'dashboard' && (
          <DashboardView
            leads={leads}
            emailsSentCount={outreachLogs.length}
            followupsDueCount={followupLeads.length}
            onNavigateTab={setActiveTab}
            onExportExcel={() => exportLeadsToExcel(leads)}
            onSelectLeadForEmail={(lead) => {
              setEmailLead(lead);
              setSelectedTemplate(null);
              setIsEmailModalOpen(true);
            }}
            onSelectLeadForAudit={(lead) => {
              setAuditLead(lead);
              setIsAuditModalOpen(true);
            }}
            onEditLead={(lead) => {
              setEditingLead(lead);
              setIsLeadModalOpen(true);
            }}
          />
        )}

        {activeTab === 'kashi_agent' && (
          <KashiAgentView
            leads={leads}
            profile={profile}
            onUpdateLead={handleSaveLead}
            onOpenEmail={(lead) => {
              setEmailLead(lead);
              setSelectedTemplate(null);
              setIsEmailModalOpen(true);
            }}
            onOpenAudit={(lead) => {
              setAuditLead(lead);
              setIsAuditModalOpen(true);
            }}
          />
        )}

        {activeTab === 'team_activity' && (
          <TeamActivityView
            leads={leads}
            profile={profile}
            onOpenAudit={(lead) => {
              setAuditLead(lead);
              setIsAuditModalOpen(true);
            }}
            onOpenEmail={(lead) => {
              setEmailLead(lead);
              setSelectedTemplate(null);
              setIsEmailModalOpen(true);
            }}
          />
        )}

        {activeTab === 'finder' && (
          <FinderView
            existingLeads={leads}
            onImportLead={(lead) => handleSaveLead(lead)}
            onSelectLeadForEmail={(lead) => {
              setEmailLead(lead);
              setSelectedTemplate(null);
              setIsEmailModalOpen(true);
            }}
          />
        )}

        {activeTab === 'crm_suite' && (
          <CrmSuiteView
            leads={leads}
            onSelectLead={(lead) => {
              setEditingLead(lead);
              setIsLeadModalOpen(true);
            }}
            onOpenEmail={(lead) => {
              setEmailLead(lead);
              setSelectedTemplate(null);
              setIsEmailModalOpen(true);
            }}
            onOpenLinkedIn={(lead) => {
              setLinkedInLead(lead);
              setIsLinkedInModalOpen(true);
            }}
          />
        )}

        {activeTab === 'media_vault' && (
          <MediaVaultView
            leads={leads}
            onOpenAudit={(lead) => {
              setAuditLead(lead);
              setIsAuditModalOpen(true);
            }}
            onOpenEmail={(lead) => {
              setEmailLead(lead);
              setSelectedTemplate(null);
              setIsEmailModalOpen(true);
            }}
          />
        )}

        {activeTab === 'database' && (
          <DatabaseView
            leads={leads}
            onAddLead={() => {
              setEditingLead(null);
              setIsLeadModalOpen(true);
            }}
            onEditLead={(lead) => {
              setEditingLead(lead);
              setIsLeadModalOpen(true);
            }}
            onDeleteLead={handleDeleteLead}
            onSelectLeadForEmail={(lead) => {
              setEmailLead(lead);
              setSelectedTemplate(null);
              setIsEmailModalOpen(true);
            }}
            onSelectLeadForLinkedIn={(lead) => {
              setLinkedInLead(lead);
              setIsLinkedInModalOpen(true);
            }}
            onSelectLeadForAudit={(lead) => {
              setAuditLead(lead);
              setIsAuditModalOpen(true);
            }}
            onEnrichLead={handleEnrichLead}
            onExportExcel={() => exportLeadsToExcel(leads)}
          />
        )}

        {activeTab === 'inbox' && (
          <InboxView
            inboundReplies={inboundReplies}
            leads={leads}
            outreachLogs={outreachLogs}
            userProfile={profile}
            onSimulateReply={handleSimulateReply}
            onSelectLeadForEmail={(lead) => {
              setEmailLead(lead);
              setSelectedTemplate(null);
              setIsEmailModalOpen(true);
            }}
            onUpdateLeadStatus={handleMarkRepliedDirect}
            onMarkReplyRead={handleMarkReplyRead}
            onMarkReplyReplied={handleMarkReplyReplied}
            onLogOutreach={handleLogOutreach}
            onOpenMeetingsTab={() => setActiveTab('meetings')}
            lastPolledAt={lastPolledAt}
            isPolling={isPolling}
            onManualPoll={triggerInboxPolling}
            pollAlert={pollAlert}
            onClearPollAlert={() => setPollAlert(null)}
          />
        )}

        {activeTab === 'opportunities' && (
          <OpportunitiesView
            leads={leads}
            onSelectLeadForAudit={(lead) => {
              setAuditLead(lead);
              setIsAuditModalOpen(true);
            }}
            onSelectLeadForEmail={(lead) => {
              setEmailLead(lead);
              setSelectedTemplate(null);
              setIsEmailModalOpen(true);
            }}
          />
        )}

        {activeTab === 'outreach' && (
          <OutreachTrackerView
            logs={outreachLogs}
            scheduledEmails={scheduledEmails}
            leads={leads}
            profile={profile}
            onMarkReplied={handleMarkReplied}
            onSelectLeadForEmail={(lead) => {
              setEmailLead(lead);
              setSelectedTemplate(null);
              setIsEmailModalOpen(true);
            }}
            onSendScheduledNow={handleSendScheduledNow}
            onCancelScheduled={handleCancelScheduled}
            onRescheduleEmail={handleRescheduleEmail}
          />
        )}

        {activeTab === 'followups' && (
          <FollowupsView
            followupLeads={followupLeads}
            onSelectLeadForEmail={(lead) => {
              setEmailLead(lead);
              setSelectedTemplate(null);
              setIsEmailModalOpen(true);
            }}
            onMarkRepliedDirect={handleMarkRepliedDirect}
          />
        )}

        {activeTab === 'templates' && (
          <TemplatesView
            leads={leads}
            onSelectTemplateForEmail={(tpl, lead) => {
              setSelectedTemplate(tpl);
              setEmailLead(lead || leads[0]);
              setIsEmailModalOpen(true);
            }}
          />
        )}

        {activeTab === 'portfolio' && (
          <PortfolioView profile={profile} />
        )}

        {activeTab === 'pipeline' && (
          <PipelineView
            leads={leads}
            onUpdateLeadStatus={handleUpdateLeadStatus}
            onSelectLead={(lead) => {
              setEditingLead(lead);
              setIsLeadModalOpen(true);
            }}
          />
        )}

        {activeTab === 'seo' && (
          <SeoAgentView />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView leads={leads} logs={outreachLogs} />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            profile={profile}
            onUpdateProfile={setProfile}
            onResetData={handleResetData}
          />
        )}
      </main>

      {/* Global Modals */}
      <LeadModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        onSave={handleSaveLead}
        initialLead={editingLead}
      />

      <EmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        lead={emailLead}
        profile={profile}
        onLogOutreach={handleLogOutreach}
        onScheduleOutreach={handleScheduleOutreach}
        initialTemplate={selectedTemplate}
      />

      <LinkedInModal
        isOpen={isLinkedInModalOpen}
        onClose={() => setIsLinkedInModalOpen(false)}
        lead={linkedInLead}
        userProfile={profile}
        onLogOutreach={(leadId, channel, note) => {
          const targetLead = leads.find((l) => l.id === leadId);
          handleLogOutreach(leadId, `[LinkedIn Outreach] ${targetLead?.businessName}`, note);
        }}
      />

      <AuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        lead={auditLead}
        onUpdateLead={(updatedLead) => {
          setLeads((prev) => prev.map((l) => (l.id === updatedLead.id ? updatedLead : l)));
          setAuditLead(updatedLead);
        }}
        onOpenEmail={(lead) => {
          setEmailLead(lead);
          setSelectedTemplate(null);
          setIsEmailModalOpen(true);
        }}
      />

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportLeads={handleImportLeads}
      />
    </div>
  );
}
