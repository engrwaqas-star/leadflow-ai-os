import React, { useState } from 'react';
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
} from 'lucide-react';
import { OutreachLog, ScheduledEmail, Lead, UserProfile } from '../types';

interface OutreachTrackerViewProps {
  logs: OutreachLog[];
  scheduledEmails: ScheduledEmail[];
  leads: Lead[];
  profile: UserProfile;
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
  onMarkReplied,
  onSelectLeadForEmail,
  onSendScheduledNow,
  onCancelScheduled,
  onRescheduleEmail,
}) => {
  const [activeTab, setActiveTab] = useState<'sent' | 'scheduled' | 'guide'>('sent');
  const [editingSchedId, setEditingSchedId] = useState<string | null>(null);
  const [editDateTime, setEditDateTime] = useState<string>('');
  const [viewingEmailBody, setViewingEmailBody] = useState<{ subject: string; body: string } | null>(null);

  const activeScheduled = scheduledEmails.filter((s) => s.status === 'Scheduled');

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Outreach & Campaign Hub
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track sent messages, manage queued scheduled outreach, and monitor client replies.
          </p>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
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
                ? 'bg-indigo-600 text-white shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Scheduled Queue
            {activeScheduled.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white text-indigo-700 font-bold ml-1">
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
            Outreach Strategy & Reply Guide
          </button>
        </div>
      </div>

      {/* TAB 1: SENT OUTREACH LOGS */}
      {activeTab === 'sent' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Business & Email</th>
                  <th className="p-3.5">Email Subject</th>
                  <th className="p-3.5">Date Sent</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Follow-Up Due</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      No outreach emails logged yet. Click "Email" on any lead to generate and log outreach!
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const lead = leads.find((l) => l.id === log.leadId);
                    return (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3.5 font-bold text-slate-900">
                          <div>{log.businessName}</div>
                          <div className="text-[11px] text-slate-400 font-normal">{log.email}</div>
                        </td>
                        <td className="p-3.5 font-medium text-slate-800 max-w-xs truncate">
                          <button
                            onClick={() => setViewingEmailBody({ subject: log.subject, body: log.body })}
                            className="text-left hover:text-indigo-600 hover:underline"
                          >
                            {log.subject}
                          </button>
                        </td>
                        <td className="p-3.5 text-slate-600 font-medium">{log.sentDate}</td>
                        <td className="p-3.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              log.status === 'Replied'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : log.status === 'Opened'
                                ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-600 font-medium">
                          {log.followupDueDate}
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
                            <button
                              onClick={() => onSelectLeadForEmail(lead)}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded text-[11px] transition inline-flex items-center gap-1"
                            >
                              <Send className="w-3 h-3" /> Follow-Up Draft
                            </button>
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
      )}

      {/* TAB 2: SCHEDULED EMAILS QUEUE */}
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
                    <th className="p-3.5">Recipient & Business</th>
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

      {/* TAB 3: COLD OUTREACH & REPLY STRATEGY GUIDE */}
      {activeTab === 'guide' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6 rounded-2xl shadow-xl space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-amber-400" />
              <h2 className="text-xl font-bold">
                Cold Outreach Masterclass & Reply Tracking Strategy
              </h2>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed max-w-3xl">
              Learn how LeadFlow AI manages cold outreach to guarantee genuine responses, how reply tracking works seamlessly with your personal email (<span className="text-amber-300 font-bold">{profile.email}</span>), and how to organize follow-ups effectively.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            {/* Guide Card 1 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
                <Mail className="w-4 h-4" />
                1. How Your Email Address Is Used for Outreach & Follow-Ups
              </div>
              <p className="text-slate-600 leading-relaxed">
                When you click <span className="font-bold text-slate-800">"Send via My Gmail"</span> or copy outreach content, LeadFlow AI formats the message specifically for your email client (<span className="font-semibold">{profile.email}</span>).
              </p>
              <ul className="space-y-2 text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Direct Mailto Integration:</strong> Pre-fills your native Gmail/Outlook window with recipient, subject, and AI body.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>100% Inbound Replies:</strong> Because emails originate directly from your address, client replies arrive safely into your primary inbox!</span>
                </li>
              </ul>
            </div>

            {/* Guide Card 2 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4" />
                2. Knowing When a Client Has Replied
              </div>
              <p className="text-slate-600 leading-relaxed">
                Reply management is structured to maintain 100% accuracy across all your client threads:
              </p>
              <ul className="space-y-2 text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Manual Mark Replied:</strong> When a prospect responds to your email inbox, click "Mark Replied". LeadFlow AI immediately updates lead status to <span className="text-emerald-700 font-bold">"Replied"</span> and updates pipeline revenue potential!</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Follow-Up Due Alerts:</strong> Leads without replies automatically trigger follow-up reminders 5 days after initial outreach.</span>
                </li>
              </ul>
            </div>

            {/* Guide Card 3 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
                <Sparkles className="w-4 h-4" />
                3. How to Get High Reply Rates (30%+ Response Strategy)
              </div>
              <p className="text-slate-600 leading-relaxed">
                Follow these 4 golden rules generated by LeadFlow AI's audit engine:
              </p>
              <ol className="space-y-2 text-slate-700 list-decimal list-inside bg-slate-50 p-3 rounded-xl border border-slate-200">
                <li><strong>Offer Low-Friction Video Walkthroughs:</strong> Don't ask for a 30-minute sales call right away. Ask: <em>"Mind if I send over a 2-minute video walkthrough?"</em></li>
                <li><strong>Point Out Specific Flaws:</strong> Mention their exact mobile layout overlap or slow speed metric.</li>
                <li><strong>Keep Under 120 Words:</strong> Busy business owners read cold emails on their phones during breaks.</li>
                <li><strong>Always Follow Up Twice:</strong> 80% of closed deals happen on the 2nd or 3rd follow-up message!</li>
              </ol>
            </div>

            {/* Guide Card 4 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
                <Calendar className="w-4 h-4" />
                4. Scheduling Outreach for Maximum Open Rates
              </div>
              <p className="text-slate-600 leading-relaxed">
                Timing is critical for cold emails:
              </p>
              <ul className="space-y-2 text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <li><strong>Best Sending Windows:</strong> Tuesday - Thursday between 8:30 AM - 10:00 AM local prospect time.</li>
                <li><strong>Use Scheduled Queue:</strong> Prepare emails over the weekend or evening and schedule them to send during peak business hours!</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TO PREVIEW EMAIL BODY */}
      {viewingEmailBody && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative border border-slate-200">
            <button
              onClick={() => setViewingEmailBody(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <XCircle className="w-5 h-5" />
            </button>
            <h3 className="font-bold text-slate-900 text-base">
              {viewingEmailBody.subject}
            </h3>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-800 font-sans leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto">
              {viewingEmailBody.body}
            </div>
            <div className="text-right">
              <button
                onClick={() => setViewingEmailBody(null)}
                className="px-4 py-2 bg-slate-900 text-white font-semibold text-xs rounded-lg hover:bg-slate-800 transition"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
