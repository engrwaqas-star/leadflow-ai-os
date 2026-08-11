import React from 'react';
import { 
  Users, 
  Flame, 
  Zap, 
  Mail, 
  AlertCircle, 
  UserPlus, 
  Download, 
  ExternalLink, 
  Send, 
  ShieldAlert, 
  CheckCircle2, 
  Sparkles 
} from 'lucide-react';
import { Lead } from '../types';

interface DashboardViewProps {
  leads: Lead[];
  emailsSentCount: number;
  followupsDueCount: number;
  onNavigateTab: (tab: string) => void;
  onExportExcel: () => void;
  onSelectLeadForEmail: (lead: Lead) => void;
  onSelectLeadForAudit: (lead: Lead) => void;
  onEditLead: (lead: Lead) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  leads,
  emailsSentCount,
  followupsDueCount,
  onNavigateTab,
  onExportExcel,
  onSelectLeadForEmail,
  onSelectLeadForAudit,
  onEditLead,
}) => {
  const hotLeads = leads.filter((l) => l.temperature === 'HOT');
  const warmLeads = leads.filter((l) => l.temperature === 'WARM');

  const getTemperatureBadge = (temp: string) => {
    switch (temp) {
      case 'HOT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-300">
            <Flame className="w-3 h-3 fill-rose-500 text-rose-500" /> HOT
          </span>
        );
      case 'WARM':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Zap className="w-3 h-3 fill-amber-500 text-amber-500" /> WARM
          </span>
        );
      case 'POTENTIAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-300">
            POTENTIAL
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-300">
            LOW
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Outreach Command Center
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Find prospects, audit website opportunities, score with AI, and manage outreach.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateTab('kashi_agent')}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-sm rounded-lg shadow-sm transition"
          >
            <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" /> Agent Kashi Co-Pilot
          </button>
          <button
            onClick={() => onNavigateTab('finder')}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm rounded-lg border border-slate-300 shadow-sm transition"
          >
            <UserPlus className="w-4 h-4 text-indigo-600" /> Find Clients
          </button>
          <button
            onClick={onExportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm rounded-lg border border-slate-300 shadow-sm transition"
          >
            <Download className="w-4 h-4" /> Export Excel
          </button>
        </div>
      </div>

      {/* Agent Kashi Daily 30 Outreach Tracker Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-4 border border-slate-800 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 font-black shadow-md border border-indigo-400">
            🤖
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-black text-sm text-white">Agent Kashi Operations Alert</span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Target: 30 Leads/Day
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Daily Outreach Goal: <strong>30 Leads</strong>. Kashi is monitoring your queue and ready to auto-dispatch skills-based pitches (Full Stack React, Sub-second Speed).
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('kashi_agent')}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl transition shrink-0 flex items-center gap-1.5 shadow-md"
        >
          Open Agent Kashi Hub & Autopilot →
        </button>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            Total Leads <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">{leads.length}</div>
          <div className="text-xs text-slate-500 mt-1">In Database</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            HOT Prospects <Flame className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-extrabold text-rose-600 mt-2">{hotLeads.length}</div>
          <div className="text-xs text-slate-500 mt-1">Score 90–100</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            WARM Prospects <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600 mt-2">{warmLeads.length}</div>
          <div className="text-xs text-slate-500 mt-1">Score 75–89</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            Emails Sent <Mail className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">{emailsSentCount}</div>
          <div className="text-xs text-slate-500 mt-1">Initial Outreach</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            Follow-ups Due <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-extrabold text-rose-600 mt-2">{followupsDueCount}</div>
          <div className="text-xs text-rose-500 font-medium mt-1">&gt; 5 Days Since Sent</div>
        </div>
      </div>

      {/* High Opportunity Prospects Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">High Opportunity Prospects</h3>
            <p className="text-xs text-slate-500">
              Sorted by highest AI qualification lead score
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('database')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
          >
            View All Leads ({leads.length}) &rarr;
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3.5">Business</th>
                <th className="p-3.5">Industry</th>
                <th className="p-3.5">Country</th>
                <th className="p-3.5">AI Score</th>
                <th className="p-3.5">Temp</th>
                <th className="p-3.5">Suggested Service</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {leads
                .slice()
                .sort((a, b) => b.score - a.score)
                .slice(0, 5)
                .map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 font-semibold text-slate-900">
                      <div>{lead.businessName}</div>
                      <div className="text-[11px] text-slate-400 font-normal">
                        {lead.contactPerson}
                      </div>
                    </td>
                    <td className="p-3.5">{lead.industry}</td>
                    <td className="p-3.5 font-medium">{lead.country}</td>
                    <td className="p-3.5">
                      <span className="font-extrabold text-sm text-slate-900">
                        {lead.score}
                      </span>
                      <span className="text-slate-400">/100</span>
                    </td>
                    <td className="p-3.5">{getTemperatureBadge(lead.temperature)}</td>
                    <td className="p-3.5 text-slate-600 max-w-xs truncate">
                      {lead.suggestedService}
                    </td>
                    <td className="p-3.5 text-right space-x-1.5">
                      <button
                        onClick={() => onSelectLeadForAudit(lead)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-[11px] transition inline-flex items-center gap-1"
                        title="Audit Website"
                      >
                        <Sparkles className="w-3 h-3 text-indigo-600" /> Audit
                      </button>
                      <button
                        onClick={() => onSelectLeadForEmail(lead)}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded text-[11px] transition inline-flex items-center gap-1 shadow-sm"
                        title="Cold Email"
                      >
                        <Send className="w-3 h-3" /> Email
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
