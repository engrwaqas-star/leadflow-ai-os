import React, { useState } from 'react';
import { 
  Building2, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Send, 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  Phone, 
  Mail, 
  MessageSquare, 
  MoreVertical, 
  ShieldCheck, 
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Lead, CrmDeal, CrmDealStage } from '../types';

interface CrmSuiteViewProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  onOpenEmail: (lead: Lead) => void;
  onOpenLinkedIn: (lead: Lead) => void;
}

export const CrmSuiteView: React.FC<CrmSuiteViewProps> = ({
  leads,
  onSelectLead,
  onOpenEmail,
  onOpenLinkedIn,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('ALL');

  // Initial mock CRM deals derived from leads
  const [deals, setDeals] = useState<CrmDeal[]>(() => {
    return leads.map((lead, idx) => {
      const dealValue = 450 + (idx * 250) % 1800;
      let stage: CrmDealStage = 'Prospect';
      if (lead.contactStatus === 'Contacted') stage = 'Audit Sent';
      if (lead.contactStatus === 'Negotiating') stage = 'Proposal Accepted';
      if (lead.contactStatus === 'Closed Won') stage = 'Closed Won';

      return {
        id: `deal-${lead.id}`,
        leadId: lead.id,
        businessName: lead.businessName,
        contactPerson: lead.contactPerson,
        email: lead.email,
        phone: lead.phone,
        stage,
        dealValue,
        invoiceStatus: stage === 'Closed Won' ? 'Paid' : stage === 'Proposal Accepted' ? 'Sent' : 'Draft',
        dueDate: new Date(Date.now() + (idx + 3) * 86400000).toISOString().split('T')[0],
        lastActivity: 'Website audit generated & pitch ready',
        serviceType: lead.suggestedService,
        notes: `Focus area: ${lead.auditIssue}`
      };
    });
  });

  const handleStageChange = (dealId: string, newStage: CrmDealStage) => {
    setDeals(prev => prev.map(d => d.id === dealId ? { ...d, stage: newStage, invoiceStatus: newStage === 'Closed Won' ? 'Paid' : d.invoiceStatus } : d));
  };

  const handleInvoiceChange = (dealId: string, status: 'Draft' | 'Sent' | 'Paid' | 'Overdue') => {
    setDeals(prev => prev.map(d => d.id === dealId ? { ...d, invoiceStatus: status } : d));
  };

  const filteredDeals = deals.filter(deal => {
    const matchesSearch = deal.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.serviceType.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedStageFilter === 'ALL') return matchesSearch;
    return matchesSearch && deal.stage === selectedStageFilter;
  });

  // Financial summary metrics
  const totalPipelineValue = deals.reduce((acc, d) => acc + d.dealValue, 0);
  const closedWonValue = deals.filter(d => d.stage === 'Closed Won' || d.stage === 'Retainer Client').reduce((acc, d) => acc + d.dealValue, 0);
  const activeProposalsCount = deals.filter(d => d.stage === 'Proposal Accepted' || d.stage === 'In Development').length;
  const pendingInvoicesValue = deals.filter(d => d.invoiceStatus === 'Sent' || d.invoiceStatus === 'Overdue').reduce((acc, d) => acc + d.dealValue, 0);

  const stages: CrmDealStage[] = ['Prospect', 'Audit Sent', 'Proposal Accepted', 'In Development', 'Closed Won', 'Retainer Client'];

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-6 h-6 text-indigo-400" />
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold text-xs rounded-full">
                Full-Stack Client CRM Suite
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Client Relationship & Revenue CRM
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Track client deal stages, proposal values, invoices, interaction history, and payment status in one clear workspace.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl text-right">
              <span className="text-[10px] uppercase font-bold text-emerald-300 block">Closed Revenue</span>
              <span className="text-xl font-extrabold text-emerald-400">${closedWonValue.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase text-slate-500 flex items-center justify-between">
            Total Pipeline Value
            <DollarSign className="w-4 h-4 text-indigo-600" />
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">${totalPipelineValue.toLocaleString()}</div>
          <p className="text-[11px] text-slate-500">{deals.length} Active Client Opportunities</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase text-slate-500 flex items-center justify-between">
            Active Proposals
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600">{activeProposalsCount}</div>
          <p className="text-[11px] text-slate-500">In Development / Proposal Accepted</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase text-slate-500 flex items-center justify-between">
            Pending Invoices
            <Clock className="w-4 h-4 text-amber-600" />
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-600">${pendingInvoicesValue.toLocaleString()}</div>
          <p className="text-[11px] text-slate-500">Sent & Awaiting Payment</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase text-slate-500 flex items-center justify-between">
            Closed Won Revenue
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">${closedWonValue.toLocaleString()}</div>
          <p className="text-[11px] text-slate-500">Earned & Settled Payments</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search clients, deals, or services..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <span className="text-xs font-bold text-slate-500 uppercase mr-1 flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-400" /> Stage:
          </span>
          <button
            onClick={() => setSelectedStageFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
              selectedStageFilter === 'ALL'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Deals ({deals.length})
          </button>
          {stages.map((stg) => {
            const count = deals.filter(d => d.stage === stg).length;
            return (
              <button
                key={stg}
                onClick={() => setSelectedStageFilter(stg)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                  selectedStageFilter === stg
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {stg} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Deals CRM Cards / Table View */}
      <div className="space-y-4">
        {filteredDeals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDeals.map((deal) => {
              const matchingLead = leads.find(l => l.id === deal.leadId);

              return (
                <div
                  key={deal.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-400 hover:shadow-md transition space-y-4 relative"
                >
                  {/* Top Header */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="overflow-hidden">
                      <div className="font-extrabold text-sm text-slate-900 truncate">
                        {deal.businessName}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{deal.contactPerson}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Deal Value</span>
                      <span className="text-lg font-black text-emerald-700">
                        ${deal.dealValue.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Service & Notes */}
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                      <span className="text-[10px] font-extrabold text-slate-500 uppercase block mb-0.5">Service Requested:</span>
                      <p className="font-bold text-slate-800">{deal.serviceType}</p>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1">
                      <span className="flex items-center gap-1 font-semibold">
                        <Mail className="w-3.5 h-3.5 text-indigo-600" /> {deal.email}
                      </span>
                      <span className="font-bold text-slate-700">{deal.phone}</span>
                    </div>
                  </div>

                  {/* Stage & Invoice Controls */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">
                        CRM Stage
                      </label>
                      <select
                        value={deal.stage}
                        onChange={(e) => handleStageChange(deal.id, e.target.value as CrmDealStage)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      >
                        {stages.map(stg => (
                          <option key={stg} value={stg}>{stg}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">
                        Invoice Status
                      </label>
                      <select
                        value={deal.invoiceStatus}
                        onChange={(e) => handleInvoiceChange(deal.id, e.target.value as any)}
                        className={`w-full border rounded-lg px-2 py-1.5 text-xs font-extrabold focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
                          deal.invoiceStatus === 'Paid'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : deal.invoiceStatus === 'Sent'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : 'bg-slate-50 text-slate-800 border-slate-300'
                        }`}
                      >
                        <option value="Draft">Draft Invoice</option>
                        <option value="Sent">Sent ($ Invoice)</option>
                        <option value="Paid">Paid ($ Settled)</option>
                        <option value="Overdue">Overdue</option>
                      </select>
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    {matchingLead && (
                      <button
                        onClick={() => onOpenEmail(matchingLead)}
                        className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition flex items-center justify-center gap-1 shadow-2xs"
                      >
                        <Mail className="w-3.5 h-3.5" /> Pitch Email
                      </button>
                    )}

                    {matchingLead && (
                      <button
                        onClick={() => onOpenLinkedIn(matchingLead)}
                        className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition flex items-center justify-center gap-1 shadow-2xs"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> LinkedIn
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
            No deals found matching your search.
          </div>
        )}
      </div>
    </div>
  );
};
