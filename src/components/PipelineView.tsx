import React, { useState } from 'react';
import { 
  Columns, 
  Search, 
  DollarSign, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Send, 
  MessageSquare, 
  TrendingUp, 
  Building2, 
  Globe, 
  MoreVertical,
  ArrowRight,
  Filter,
  ShieldCheck,
  Target,
  Handshake
} from 'lucide-react';
import { Lead, ContactStatus, LeadStage, LeadStrategy } from '../types';
import { determineLeadStage } from '../utils/leadPipeline';

interface PipelineViewProps {
  leads: Lead[];
  onUpdateLeadStatus: (leadId: string, status: ContactStatus) => void;
  onSelectLead: (lead: Lead) => void;
}

interface ColumnConfig {
  id: string;
  title: string;
  statuses: ContactStatus[];
  color: string;
  badgeBg: string;
  badgeText: string;
  icon: React.ElementType;
}

export const PipelineView: React.FC<PipelineViewProps> = ({
  leads,
  onUpdateLeadStatus,
  onSelectLead,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('ALL');

  const columns: ColumnConfig[] = [
    {
      id: 'not_contacted',
      title: 'Not Contacted',
      statuses: ['Not Contacted'],
      color: 'border-slate-300 bg-slate-100/70',
      badgeBg: 'bg-slate-200 border border-slate-300',
      badgeText: 'text-slate-900 font-black',
      icon: Clock,
    },
    {
      id: 'contacted',
      title: 'Contacted',
      statuses: ['Contacted', 'Follow-Up Due'],
      color: 'border-blue-300 bg-blue-50/80',
      badgeBg: 'bg-blue-100 border border-blue-200',
      badgeText: 'text-blue-900 font-black',
      icon: Send,
    },
    {
      id: 'negotiating',
      title: 'Negotiating / Replied',
      statuses: ['Replied', 'Negotiating'],
      color: 'border-amber-300 bg-amber-50/80',
      badgeBg: 'bg-amber-100 border border-amber-200',
      badgeText: 'text-amber-900 font-black',
      icon: MessageSquare,
    },
    {
      id: 'closed_won',
      title: 'Closed Won',
      statuses: ['Closed Won'],
      color: 'border-emerald-300 bg-emerald-50/80',
      badgeBg: 'bg-emerald-100 border border-emerald-200',
      badgeText: 'text-emerald-900 font-black',
      icon: CheckCircle2,
    },
    {
      id: 'closed_lost',
      title: 'Closed Lost',
      statuses: ['Declined', 'Closed Lost'],
      color: 'border-red-300 bg-red-50/80',
      badgeBg: 'bg-red-100 border border-red-200',
      badgeText: 'text-red-900 font-black',
      icon: XCircle,
    },
  ];

  const industries = Array.from(new Set(leads.map(l => l.industry).filter(Boolean)));

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          lead.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          lead.city?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesIndustry = selectedIndustry === 'ALL' || lead.industry === selectedIndustry;
    return matchesSearch && matchesIndustry;
  });

  // Calculate estimated deal value based on lead score ($450 - $1,500)
  const getDealValue = (score: number) => {
    if (score >= 80) return 1450;
    if (score >= 60) return 950;
    return 450;
  };

  const calculateColumnTotalValue = (statuses: ContactStatus[]) => {
    return filteredLeads
      .filter(l => statuses.includes(l.contactStatus))
      .reduce((sum, l) => sum + getDealValue(l.score), 0);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Columns className="w-6 h-6 text-indigo-600" />
            <h1 className="text-xl font-bold text-slate-900">Visual Sales Pipeline</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Kanban board tracking lead conversions, deal negotiations, and outreach lifecycle stages.
          </p>
        </div>

        {/* Pipeline Value Metrics */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
            <span className="text-[10px] font-bold uppercase text-emerald-700 block">Won Pipeline Value</span>
            <span className="text-base font-extrabold text-emerald-800">
              ${calculateColumnTotalValue(['Closed Won']).toLocaleString()}
            </span>
          </div>

          <div className="px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl">
            <span className="text-[10px] font-bold uppercase text-amber-700 block">Active Deals Value</span>
            <span className="text-base font-extrabold text-amber-800">
              ${calculateColumnTotalValue(['Contacted', 'Follow-Up Due', 'Replied', 'Negotiating']).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter pipeline leads by company, contact, or location..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedIndustry}
            onChange={(e) => setSelectedIndustry(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Industries</option>
            {industries.map(ind => (
              <option key={ind} value={ind}>{ind}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start overflow-x-auto">
        {columns.map((col) => {
          const colLeads = filteredLeads.filter(l => col.statuses.includes(l.contactStatus));
          const colValue = calculateColumnTotalValue(col.statuses);
          const IconComp = col.icon;

          return (
            <div
              key={col.id}
              className={`rounded-2xl border ${col.color} p-3 space-y-3 min-w-[250px] shadow-xs flex flex-col min-h-[500px]`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                <div className="flex items-center gap-2">
                  <IconComp className="w-4 h-4 text-slate-700" />
                  <h3 className="font-extrabold text-xs text-slate-800">{col.title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${col.badgeBg} ${col.badgeText}`}>
                    {colLeads.length}
                  </span>
                </div>

                <span className="text-[11px] font-extrabold text-slate-600">
                  ${colValue.toLocaleString()}
                </span>
              </div>

              {/* Cards list */}
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[650px] pr-1">
                {colLeads.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs italic border border-dashed border-slate-200 rounded-xl">
                    No leads in this stage
                  </div>
                ) : (
                  colLeads.map((lead) => {
                    const dealVal = getDealValue(lead.score);
                    const currentStage: LeadStage = lead.stage || determineLeadStage(lead);
                    return (
                      <div
                        key={lead.id}
                        className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-sm hover:border-indigo-500 hover:shadow-md transition space-y-2.5 cursor-pointer group"
                        onClick={() => onSelectLead(lead)}
                      >
                        <div className="flex justify-between items-start gap-1">
                          <span className="font-extrabold text-xs text-slate-900 group-hover:text-indigo-600 transition truncate">
                            {lead.businessName}
                          </span>
                          <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-900 font-black text-[10px] rounded-md border border-indigo-200 shrink-0">
                            {lead.score} pts
                          </span>
                        </div>

                        {/* Strategy and Stage badges */}
                        <div className="flex flex-wrap items-center gap-1 text-[9px] font-black uppercase">
                          <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded border border-slate-200">
                            {lead.leadStrategy === 'AGENCY_PARTNERSHIPS' ? 'Agency Partner' : 'Direct Client'}
                          </span>
                          <span className="px-1.5 py-0.2 bg-indigo-50 text-indigo-800 rounded border border-indigo-200">
                            {currentStage.replace(/_/g, ' ')}
                          </span>
                          {lead.auditStatus === 'Audited' ? (
                            <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-800 rounded border border-emerald-200">
                              ✓ Audited
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 bg-amber-50 text-amber-800 rounded border border-amber-200">
                              Audit Pending
                            </span>
                          )}
                        </div>

                        {lead.skillGaps && lead.skillGaps.length > 0 && (
                          <div className="text-[9px] text-rose-700 font-extrabold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                            SKILL GAP — VERIFY BEFORE OUTREACH: {lead.skillGaps.join(', ')}
                          </div>
                        )}

                        <p className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="truncate">{lead.contactPerson} • {lead.city || lead.country}</span>
                        </p>

                        <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-[10px] text-slate-700 leading-snug line-clamp-2">
                          <strong className="text-slate-900 font-bold">Service:</strong> {lead.suggestedService}
                        </div>

                        <div className="flex items-center justify-between pt-1.5 border-t border-slate-200 text-[11px]">
                          <span className="font-black text-emerald-800 flex items-center gap-0.5 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <DollarSign className="w-3 h-3 text-emerald-600" />
                            {lead.estimatedBudget ? lead.estimatedBudget : 'Scope Pending'}
                          </span>

                          {/* Quick Stage Move Dropdown */}
                          <select
                            value={lead.contactStatus}
                            onChange={(e) => {
                              e.stopPropagation();
                              onUpdateLeadStatus(lead.id, e.target.value as ContactStatus);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white hover:bg-slate-50 text-slate-900 text-[10px] font-extrabold rounded-md px-2 py-1 border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                          >
                            <option value="Not Contacted">Not Contacted</option>
                            <option value="Contacted">Contacted</option>
                            <option value="Follow-Up Due">Follow-Up Due</option>
                            <option value="Replied">Replied</option>
                            <option value="Negotiating">Negotiating</option>
                            <option value="Closed Won">Closed Won</option>
                            <option value="Declined">Declined</option>
                            <option value="Closed Lost">Closed Lost</option>
                          </select>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
