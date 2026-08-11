import React from 'react';
import { AlertCircle, Clock, Send, CheckCircle2, Flame, Zap } from 'lucide-react';
import { Lead } from '../types';

interface FollowupsViewProps {
  followupLeads: Lead[];
  onSelectLeadForEmail: (lead: Lead) => void;
  onMarkRepliedDirect: (leadId: string) => void;
}

export const FollowupsView: React.FC<FollowupsViewProps> = ({
  followupLeads,
  onSelectLeadForEmail,
  onMarkRepliedDirect,
}) => {
  const calculateDaysAgo = (dateStr?: string) => {
    if (!dateStr) return 0;
    const sent = new Date(dateStr).getTime();
    const now = new Date('2026-08-10').getTime(); // Current app timestamp reference
    const diff = Math.floor((now - sent) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          Follow-Up Tracker
          {followupLeads.length > 0 && (
            <span className="bg-rose-100 text-rose-700 text-xs px-2.5 py-0.5 rounded-full font-extrabold border border-rose-300">
              {followupLeads.length} Urgent
            </span>
          )}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Automated warning system for emails sent &gt; 5 days ago without a reply.
        </p>
      </div>

      {followupLeads.length === 0 ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 text-center text-emerald-900 space-y-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
          <h3 className="font-bold text-lg text-emerald-950">All Follow-ups Up To Date!</h3>
          <p className="text-sm text-emerald-700">
            You have no pending follow-ups older than 5 days. Great job staying on top of client outreach!
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Recipient & Business</th>
                  <th className="p-3.5">Last Outreach</th>
                  <th className="p-3.5">Days Pending</th>
                  <th className="p-3.5">Lead Score</th>
                  <th className="p-3.5">Suggested Solution</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {followupLeads.map((lead) => {
                  const daysAgo = calculateDaysAgo(lead.lastContactDate);
                  return (
                    <tr key={lead.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5 font-bold text-slate-900">
                        <div>{lead.businessName}</div>
                        <div className="text-[11px] text-slate-500 font-normal">
                          {lead.contactPerson} ({lead.email})
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-600 font-medium">
                        {lead.lastContactDate || 'Over 5 days ago'}
                      </td>
                      <td className="p-3.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-xs bg-rose-100 text-rose-700 border border-rose-300">
                          <Clock className="w-3 h-3 text-rose-500" /> {daysAgo} days ago ({daysAgo - 5} days overdue)
                        </span>
                      </td>
                      <td className="p-3.5 font-extrabold text-slate-900 text-sm">
                        {lead.score}/100
                      </td>
                      <td className="p-3.5 text-slate-800 font-medium">
                        {lead.suggestedService}
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        <button
                          onClick={() => onMarkRepliedDirect(lead.id)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition inline-flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Got Reply
                        </button>
                        <button
                          onClick={() => onSelectLeadForEmail(lead)}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg text-xs transition inline-flex items-center gap-1 shadow-sm"
                        >
                          <Send className="w-3.5 h-3.5" /> Draft Follow-up
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
