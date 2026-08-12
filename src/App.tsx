import React, { useState, useEffect, useMemo } from 'react';
import { Menu, Zap, Terminal } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { ApiBanner } from './components/ApiBanner';
import { LiveClock } from './components/LiveClock';
import { DebugPanel } from './components/DebugPanel';
import { loggedFetch } from './utils/apiLogger';
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
import { CleanupCenterView } from './components/CleanupCenterView';
import { DataSourcesView } from './components/DataSourcesView';
import { ToastContainer } from './components/ToastContainer';

import { LeadModal } from './components/LeadModal';
import { EmailModal } from './components/EmailModal';
import { LinkedInModal } from './components/LinkedInModal';
import { AuditModal } from './components/AuditModal';
import { ImportModal } from './components/ImportModal';

import { INITIAL_LEADS, INITIAL_OUTREACH_LOGS, INITIAL_SCHEDULED_EMAILS, INITIAL_INBOUND_REPLIES } from './data/initialLeads';
import { 
  Lead, 
  OutreachLog, 
  ScheduledEmail, 
  UserProfile, 
  EmailTemplate, 
  InboundReply, 
  ContactStatus,
  TrashItem,
  SuppressedDomainRecord,
  AutoCleanupSettings,
  ToastNotice,
  CleanupReason
} from './types';
import { exportLeadsToExcel } from './utils/excel';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Persistent Lead State
  const [leads, setLeads] = useState<Lead[]>(() => {
    const saved = localStorage.getItem('leadflow_leads');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const filtered = parsed.filter(item => !item.isDemo && !item.id?.startsWith('lead-'));
          const seen = new Set<string>();
          return filtered.map((item, idx) => {
            let id = item.id;
            if (!id || seen.has(id)) {
              id = `custom-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 8)}`;
            }
            seen.add(id);
            return { ...item, id };
          });
        }
      } catch (e) { /* ignore */ }
    }
    return INITIAL_LEADS;
  });

  // Persistent Outreach Logs
  const [outreachLogs, setOutreachLogs] = useState<OutreachLog[]>(() => {
    const saved = localStorage.getItem('leadflow_outreach');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(item => !item.id?.startsWith('log-'));
        }
      } catch (e) { /* ignore */ }
    }
    return INITIAL_OUTREACH_LOGS;
  });

  // Persistent Inbound Replies
  const [inboundReplies, setInboundReplies] = useState<InboundReply[]>(() => {
    const saved = localStorage.getItem('leadflow_replies');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(item => !item.id?.startsWith('reply-'));
        }
      } catch (e) { /* ignore */ }
    }
    return INITIAL_INBOUND_REPLIES;
  });

  // Persistent Scheduled Emails
  const [scheduledEmails, setScheduledEmails] = useState<ScheduledEmail[]>(() => {
    const saved = localStorage.getItem('leadflow_scheduled');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(item => !item.id?.startsWith('sched-'));
        }
      } catch (e) { /* ignore */ }
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

  // Persistent Trash Bin State
  const [trashItems, setTrashItems] = useState<TrashItem[]>(() => {
    const saved = localStorage.getItem('leadflow_trash');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return [];
  });

  // Persistent Suppressed Blacklist
  const [suppressedRecords, setSuppressedRecords] = useState<SuppressedDomainRecord[]>(() => {
    const saved = localStorage.getItem('leadflow_suppressed');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return [];
  });

  // Persistent Auto-Cleanup Settings
  const [autoCleanupSettings, setAutoCleanupSettings] = useState<AutoCleanupSettings>(() => {
    const saved = localStorage.getItem('leadflow_autocleanup');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return {
      enabled: false,
      autoRemoveTestDays: 0,
      autoArchiveInactiveDays: 0,
      autoArchiveCompletedDays: 0,
    };
  });

  // Toast Notifications
  const [toasts, setToasts] = useState<ToastNotice[]>([]);

  const showToast = (message: string, undoAction?: () => void) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastNotice = { id, message, undoAction };
    setToasts((prev) => [newToast, ...prev].slice(0, 4));

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };
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
  const [isDebugOpen, setIsDebugOpen] = useState(false);

  // Background 30-Minute Inbox Poller State
  const [lastPolledAt, setLastPolledAt] = useState<Date | null>(new Date());
  const [isPolling, setIsPolling] = useState(false);
  const [pollAlert, setPollAlert] = useState<{ message: string; count: number } | null>(null);

  const triggerInboxPolling = async () => {
    setIsPolling(true);
    try {
      const { ok, data } = await loggedFetch('/api/gmail/poll-inbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          configuredEmail: profile.email,
          leadDomains: leads.map((l) => l.website).filter(Boolean),
        }),
      });
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

  useEffect(() => {
    localStorage.setItem('leadflow_trash', JSON.stringify(trashItems));
  }, [trashItems]);

  useEffect(() => {
    localStorage.setItem('leadflow_suppressed', JSON.stringify(suppressedRecords));
  }, [suppressedRecords]);

  useEffect(() => {
    localStorage.setItem('leadflow_autocleanup', JSON.stringify(autoCleanupSettings));
  }, [autoCleanupSettings]);

  // Clean Data Action Handlers with Undo Support
  const handleArchiveLead = (lead: Lead, reason?: CleanupReason) => {
    const previousLeads = [...leads];
    const updated = leads.map(l => l.id === lead.id ? { 
      ...l, 
      archived: true, 
      recordStatus: 'archived' as const, 
      archiveReason: reason || 'Outdated' 
    } : l);
    setLeads(updated);

    showToast(`Archived ${lead.businessName}`, () => setLeads(previousLeads));
  };

  const handleSuppressLead = (lead: Lead, reason?: CleanupReason) => {
    const previousLeads = [...leads];
    const previousSuppressed = [...suppressedRecords];

    const updated = leads.map(l => l.id === lead.id ? { 
      ...l, 
      suppressed: true, 
      recordStatus: 'suppressed' as const, 
      suppressReason: reason || 'Irrelevant' 
    } : l);
    setLeads(updated);

    const cleanDomain = lead.website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].toLowerCase().trim();
    if (cleanDomain) {
      setSuppressedRecords(prev => [
        {
          id: `suppress-${Date.now()}`,
          domainOrEmail: cleanDomain,
          reason: reason || 'Irrelevant',
          suppressedAt: new Date().toISOString().split('T')[0],
          leadId: lead.id,
        },
        ...prev,
      ]);
    }

    showToast(`Suppressed ${lead.businessName} from discovery`, () => {
      setLeads(previousLeads);
      setSuppressedRecords(previousSuppressed);
    });
  };

  const handleTrashLead = (lead: Lead, reason?: CleanupReason) => {
    const previousLeads = [...leads];
    const previousTrash = [...trashItems];

    const updated = leads.map(l => l.id === lead.id ? { 
      ...l, 
      trashed: true, 
      recordStatus: 'trashed' as const, 
      trashReason: reason || 'Irrelevant' 
    } : l);
    setLeads(updated);

    const trashEntry: TrashItem = {
      id: `trash-${Date.now()}-${lead.id}`,
      originalId: lead.id,
      originalType: 'Lead',
      title: lead.businessName,
      description: `${lead.industry} • ${lead.website}`,
      deletedAt: new Date().toISOString().split('T')[0],
      reason: reason || 'Manual deletion',
      payload: lead,
    };
    setTrashItems(prev => [trashEntry, ...prev]);

    showToast(`Moved ${lead.businessName} to Trash`, () => {
      setLeads(previousLeads);
      setTrashItems(previousTrash);
    });
  };

  const handlePermanentDeleteLead = (lead: Lead) => {
    const previousLeads = [...leads];
    setLeads(prev => prev.filter(l => l.id !== lead.id));
    setTrashItems(prev => prev.filter(t => t.originalId !== lead.id));

    showToast(`Permanently deleted ${lead.businessName}`, () => {
      setLeads(previousLeads);
    });
  };

  const handleRestoreLead = (lead: Lead) => {
    const previousLeads = [...leads];
    const updated = leads.map(l => l.id === lead.id ? { 
      ...l, 
      archived: false, 
      suppressed: false, 
      trashed: false, 
      recordStatus: 'active' as const 
    } : l);
    setLeads(updated);
    setTrashItems(prev => prev.filter(t => t.originalId !== lead.id));

    showToast(`Restored ${lead.businessName} to Active Leads`, () => {
      setLeads(previousLeads);
    });
  };

  const handleRestoreTrashItem = (id: string) => {
    const trash = trashItems.find(t => t.id === id);
    if (!trash) return;

    if (trash.originalType === 'lead' && trash.originalId) {
      setLeads(prev => prev.map(l => l.id === trash.originalId ? { 
        ...l, 
        trashed: false, 
        recordStatus: 'active' as const 
      } : l));
    }
    setTrashItems(prev => prev.filter(t => t.id !== id));
    showToast(`Restored ${trash.title}`);
  };

  const handlePermanentlyDeleteTrashItem = (id: string) => {
    const trash = trashItems.find(t => t.id === id);
    if (trash && trash.originalId) {
      setLeads(prev => prev.filter(l => l.id !== trash.originalId));
    }
    setTrashItems(prev => prev.filter(t => t.id !== id));
    showToast(`Permanently removed from Trash`);
  };

  const handleEmptyTrash = () => {
    const trashedIds = new Set(trashItems.map(t => t.originalId).filter(Boolean));
    setLeads(prev => prev.filter(l => !trashedIds.has(l.id) && !l.trashed));
    setTrashItems([]);
    showToast('Trash bin emptied successfully');
  };

  const handleUnsuppressRecord = (id: string) => {
    const rec = suppressedRecords.find(r => r.id === id);
    if (rec && rec.leadId) {
      setLeads(prev => prev.map(l => l.id === rec.leadId ? { ...l, suppressed: false, recordStatus: 'active' as const } : l));
    }
    setSuppressedRecords(prev => prev.filter(r => r.id !== id));
    showToast(`Unsuppressed record`);
  };

  const handleDeleteAllDemoData = () => {
    const previousLeads = [...leads];
    setLeads(prev => prev.filter(l => !l.isDemo && !l.id.startsWith('lead-')));
    showToast('Purged all sample demo data records', () => setLeads(previousLeads));
  };

  const handleBulkArchive = (leadIds: string[]) => {
    const previousLeads = [...leads];
    const idSet = new Set(leadIds);
    setLeads(prev => prev.map(l => idSet.has(l.id) ? { ...l, archived: true, recordStatus: 'archived' as const } : l));
    showToast(`Archived ${leadIds.length} leads`, () => setLeads(previousLeads));
  };

  const handleBulkSuppress = (leadIds: string[]) => {
    const previousLeads = [...leads];
    const idSet = new Set(leadIds);
    setLeads(prev => prev.map(l => idSet.has(l.id) ? { ...l, suppressed: true, recordStatus: 'suppressed' as const } : l));
    showToast(`Suppressed ${leadIds.length} leads`, () => setLeads(previousLeads));
  };

  const handleBulkTrash = (leadIds: string[]) => {
    const previousLeads = [...leads];
    const idSet = new Set(leadIds);
    setLeads(prev => prev.map(l => idSet.has(l.id) ? { ...l, trashed: true, recordStatus: 'trashed' as const } : l));

    const newTrashEntries: TrashItem[] = leads.filter(l => idSet.has(l.id)).map(l => ({
      id: `trash-${Date.now()}-${l.id}`,
      originalId: l.id,
      originalType: 'Lead' as const,
      title: l.businessName,
      description: `${l.industry} • ${l.website}`,
      deletedAt: new Date().toISOString().split('T')[0],
      reason: 'Bulk deletion',
      payload: l,
    }));

    setTrashItems(prev => [...newTrashEntries, ...prev]);
    showToast(`Moved ${leadIds.length} leads to Trash`, () => setLeads(previousLeads));
  };

  const handleBulkDelete = (leadIds: string[]) => {
    const previousLeads = [...leads];
    const idSet = new Set(leadIds);
    setLeads(prev => prev.filter(l => !idSet.has(l.id)));
    setTrashItems(prev => prev.filter(t => !idSet.has(t.originalId || '')));
    showToast(`Permanently deleted ${leadIds.length} leads`, () => setLeads(previousLeads));
  };

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
        const currentTime = new Date().getTime();
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
      const uniqueId = `lead-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newLead: Lead = {
        ...leadData,
        id: uniqueId,
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
      id: `imported-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 9)}`,
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
    const today = new Date().toISOString().split('T')[0];

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
    setLeads([]);
    setOutreachLogs([]);
    setInboundReplies([]);
    setScheduledEmails([]);
    localStorage.removeItem('leadflow_leads');
    localStorage.removeItem('leadflow_outreach');
    localStorage.removeItem('leadflow_replies');
    localStorage.removeItem('leadflow_scheduled');
    alert('Database successfully cleared. All sample and demo records have been removed.');
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
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-x-hidden space-y-4">
        {/* Top Real-time System Header & Live Clock */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center font-extrabold shadow-sm">
              <Zap className="w-4 h-4 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-sm tracking-tight">Agent Kashi OS</span>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full border border-indigo-200/80">
                  v3.6 Acquisition Engine
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Muhammad Waqas • Frontend Developer Client Acquisition Platform
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDebugOpen(!isDebugOpen)}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              title="Open Netlify API & Deployment Debugger"
            >
              <Terminal className="w-3.5 h-3.5 text-emerald-400" /> API Debugger
            </button>
            <LiveClock />
          </div>
        </div>

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
            suppressedRecords={suppressedRecords}
            onSuppressLead={(lead) => handleSuppressLead(lead, 'Other')}
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
            onArchiveLead={handleArchiveLead}
            onSuppressLead={handleSuppressLead}
            onTrashLead={handleTrashLead}
            onPermanentDeleteLead={handlePermanentDeleteLead}
            onRestoreLead={handleRestoreLead}
            onBulkArchive={handleBulkArchive}
            onBulkSuppress={handleBulkSuppress}
            onBulkTrash={handleBulkTrash}
            onBulkDelete={handleBulkDelete}
          />
        )}

        {(activeTab === 'data_sources' || activeTab === 'ai_status') && (
          <DataSourcesView />
        )}

        {activeTab === 'cleanup' && (
          <CleanupCenterView
            leads={leads}
            trashItems={trashItems}
            suppressedRecords={suppressedRecords}
            autoCleanupSettings={autoCleanupSettings}
            onUpdateLeads={setLeads}
            onRestoreTrashItem={handleRestoreTrashItem}
            onPermanentlyDeleteTrashItem={handlePermanentlyDeleteTrashItem}
            onEmptyTrash={handleEmptyTrash}
            onUnsuppressRecord={handleUnsuppressRecord}
            onDeleteAllDemoData={handleDeleteAllDemoData}
            onUpdateAutoCleanupSettings={setAutoCleanupSettings}
            onShowToast={showToast}
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

      <DebugPanel isOpen={isDebugOpen} onClose={() => setIsDebugOpen(false)} />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
