import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Flame, 
  Zap, 
  Send, 
  Edit3, 
  Trash2, 
  Sparkles, 
  ExternalLink, 
  Download,
  Linkedin,
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  RefreshCw,
  Building2,
  Users,
  Code2,
  MessageSquare,
  Archive,
  EyeOff,
  CheckSquare,
  Square,
  Filter,
  Layers,
  RotateCcw,
  X,
  CheckCircle2
} from 'lucide-react';
import { Lead, Temperature, ContactStatus, CleanupReason, LeadStage, LeadStrategy } from '../types';
import { createWhatsAppDeepLink, generateLeadWhatsAppPitch } from '../utils/whatsapp';
import { LeadActionMenu } from './LeadActionMenu';
import { ConfirmModal } from './ConfirmModal';
import { determineLeadStage } from '../utils/leadPipeline';

interface DatabaseViewProps {
  leads: Lead[];
  onAddLead: () => void;
  onEditLead: (lead: Lead) => void;
  onDeleteLead: (leadId: string) => void;
  onSelectLeadForEmail: (lead: Lead) => void;
  onSelectLeadForLinkedIn: (lead: Lead) => void;
  onSelectLeadForAudit: (lead: Lead) => void;
  onEnrichLead: (lead: Lead) => void;
  onExportExcel: () => void;
  onArchiveLead?: (lead: Lead, reason?: CleanupReason) => void;
  onSuppressLead?: (lead: Lead, reason?: CleanupReason) => void;
  onTrashLead?: (lead: Lead, reason?: CleanupReason) => void;
  onPermanentDeleteLead?: (lead: Lead) => void;
  onRestoreLead?: (lead: Lead) => void;
  onBulkArchive?: (leadIds: string[]) => void;
  onBulkSuppress?: (leadIds: string[]) => void;
  onBulkTrash?: (leadIds: string[]) => void;
  onBulkDelete?: (leadIds: string[]) => void;
}

export const DatabaseView: React.FC<DatabaseViewProps> = ({
  leads,
  onAddLead,
  onEditLead,
  onDeleteLead,
  onSelectLeadForEmail,
  onSelectLeadForLinkedIn,
  onSelectLeadForAudit,
  onEnrichLead,
  onExportExcel,
  onArchiveLead,
  onSuppressLead,
  onTrashLead,
  onPermanentDeleteLead,
  onRestoreLead,
  onBulkArchive,
  onBulkSuppress,
  onBulkTrash,
  onBulkDelete,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [tempFilter, setTempFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [countryFilter, setCountryFilter] = useState<string>('');
  const [industryFilter, setIndustryFilter] = useState<string>('');
  const [recordStatusFilter, setRecordStatusFilter] = useState<'active' | 'archived' | 'suppressed' | 'trashed' | 'demo' | 'all'>('active');
  const [enrichingId, setEnrichingId] = useState<string | null>(null);

  // Multi-select state
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);

  // Confirmation modal state
  const [confirmModalState, setConfirmModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: (reason?: CleanupReason) => void;
    type?: 'danger' | 'warning' | 'archive' | 'suppress';
    requireReason?: boolean;
    itemCount?: number;
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: () => {},
  });

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Record Status Filter
      if (recordStatusFilter === 'active' && (lead.archived || lead.suppressed || lead.trashed)) return false;
      if (recordStatusFilter === 'archived' && (!lead.archived || lead.trashed)) return false;
      if (recordStatusFilter === 'suppressed' && (!lead.suppressed || lead.trashed)) return false;
      if (recordStatusFilter === 'trashed' && !lead.trashed) return false;
      if (recordStatusFilter === 'demo' && !lead.isDemo && !lead.id.startsWith('lead-')) return false;

      const matchSearch =
        searchTerm === '' ||
        lead.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.website.toLowerCase().includes(searchTerm.toLowerCase());

      const matchTemp = tempFilter === '' || lead.temperature === tempFilter;
      const matchStatus = statusFilter === '' || lead.contactStatus === statusFilter;
      const matchCountry = countryFilter === '' || lead.country === countryFilter;
      const matchIndustry = industryFilter === '' || lead.industry === industryFilter;

      return matchSearch && matchTemp && matchStatus && matchCountry && matchIndustry;
    });
  }, [leads, recordStatusFilter, searchTerm, tempFilter, statusFilter, countryFilter, industryFilter]);

  const uniqueCountries = useMemo(() => {
    return Array.from(new Set(leads.map((l) => l.country))).filter(Boolean);
  }, [leads]);

  const uniqueIndustries = useMemo(() => {
    return Array.from(new Set(leads.map((l) => l.industry))).filter(Boolean);
  }, [leads]);

  // Selection Handlers
  const handleToggleSelectAll = () => {
    if (selectedLeadIds.length === filteredLeads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(filteredLeads.map((l) => l.id));
    }
  };

  const handleToggleSelectLead = (id: string) => {
    if (selectedLeadIds.includes(id)) {
      setSelectedLeadIds((prev) => prev.filter((i) => i !== id));
    } else {
      setSelectedLeadIds((prev) => [...prev, id]);
    }
  };

  const getTemperatureBadge = (temp: Temperature) => {
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

  const getStatusBadge = (status: ContactStatus) => {
    switch (status) {
      case 'Follow-Up Due':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-300 animate-pulse">
            Follow-Up Due
          </span>
        );
      case 'Contacted':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-100 text-indigo-700 border border-indigo-300">
            Contacted
          </span>
        );
      case 'Replied':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            Replied 🎉
          </span>
        );
      case 'Closed Won':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-600 text-white">
            Closed Won 🏆
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-300">
            Not Contacted
          </span>
        );
    }
  };

  const getStageBadge = (lead: Lead) => {
    const currentStage: LeadStage = lead.stage || determineLeadStage(lead);
    const badgeMap: Record<LeadStage, { label: string; bg: string; text: string; border: string }> = {
      DISCOVERED: { label: 'Discovered', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
      IDENTITY_VERIFIED: { label: 'Identity Verified', bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-300' },
      WEBSITE_REVIEWED: { label: 'Website Reviewed', bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-300' },
      OPPORTUNITY_QUALIFIED: { label: 'Opportunity Qualified', bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-300' },
      CONTACT_READY: { label: 'Contact Ready', bg: 'bg-cyan-50', text: 'text-cyan-800', border: 'border-cyan-300' },
      OUTREACH_DRAFTED: { label: 'Outreach Drafted', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300' },
      CONTACTED: { label: 'Contacted', bg: 'bg-blue-100', text: 'text-blue-900', border: 'border-blue-400' },
      REPLIED: { label: 'Replied 🎉', bg: 'bg-emerald-100', text: 'text-emerald-900', border: 'border-emerald-400' },
      WON: { label: 'Closed Won 🏆', bg: 'bg-emerald-600', text: 'text-white', border: 'border-emerald-700' },
      LOST: { label: 'Closed Lost', bg: 'bg-rose-100', text: 'text-rose-900', border: 'border-rose-300' },
    };

    const config = badgeMap[currentStage] || badgeMap.DISCOVERED;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${config.bg} ${config.text} border ${config.border}`}>
        {config.label}
      </span>
    );
  };

  const renderCredibilityBadge = (lead: Lead) => {
    const cred = lead.credibility || {
      hasSSL: lead.website.startsWith('https://'),
      hasMobileViewport: lead.mobileViewport,
      hasMetaTags: true,
      seoGrade: 'A',
      credibilityScore: lead.score >= 90 ? 95 : 82,
      securityStatus: lead.website.startsWith('https://') ? 'Secure (HTTPS)' : 'Not Secure (HTTP)',
    };

    return (
      <div className="space-y-1">
        <div className="flex items-center gap-1.5">
          {cred.hasSSL ? (
            <span
              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200"
              title="SSL Certificate Valid"
            >
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              HTTPS
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200"
              title="Missing SSL Certificate"
            >
              <ShieldAlert className="w-3 h-3 text-rose-600" />
              HTTP
            </span>
          )}

          <span
            className="text-[11px] font-extrabold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200"
            title={`SEO Grade: ${cred.seoGrade}`}
          >
            SEO {cred.seoGrade}
          </span>
        </div>

        <div className="text-[10px] text-slate-500 font-medium">
          Credibility: <span className="font-bold text-slate-800">{cred.credibilityScore}/100</span>
        </div>
      </div>
    );
  };

  const handleEnrich = async (lead: Lead) => {
    setEnrichingId(lead.id);
    await onEnrichLead(lead);
    setEnrichingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Lead Database ({filteredLeads.length})
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Complete client intelligence, credibility scores, and multi-channel outreach.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onExportExcel}
            className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm rounded-lg border border-slate-300 shadow-sm transition"
          >
            <Download className="w-4 h-4" /> Export
          </button>
          <button
            onClick={onAddLead}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4" /> Add Lead
          </button>
        </div>
      </div>

      {/* Record View Mode Tabs & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
        {/* Status Filter Selector Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
            <button
              onClick={() => { setRecordStatusFilter('active'); setSelectedLeadIds([]); }}
              className={`px-3 py-1.5 rounded-lg transition ${
                recordStatusFilter === 'active' ? 'bg-indigo-600 text-white font-extrabold shadow-sm' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Active Leads ({leads.filter(l => !l.archived && !l.suppressed && !l.trashed).length})
            </button>
            <button
              onClick={() => { setRecordStatusFilter('archived'); setSelectedLeadIds([]); }}
              className={`px-3 py-1.5 rounded-lg transition ${
                recordStatusFilter === 'archived' ? 'bg-amber-600 text-white font-extrabold shadow-sm' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Archived ({leads.filter(l => l.archived && !l.trashed).length})
            </button>
            <button
              onClick={() => { setRecordStatusFilter('suppressed'); setSelectedLeadIds([]); }}
              className={`px-3 py-1.5 rounded-lg transition ${
                recordStatusFilter === 'suppressed' ? 'bg-purple-600 text-white font-extrabold shadow-sm' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Suppressed ({leads.filter(l => l.suppressed && !l.trashed).length})
            </button>
            <button
              onClick={() => { setRecordStatusFilter('trashed'); setSelectedLeadIds([]); }}
              className={`px-3 py-1.5 rounded-lg transition ${
                recordStatusFilter === 'trashed' ? 'bg-rose-600 text-white font-extrabold shadow-sm' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Trash Bin ({leads.filter(l => l.trashed).length})
            </button>
            <button
              onClick={() => { setRecordStatusFilter('demo'); setSelectedLeadIds([]); }}
              className={`px-3 py-1.5 rounded-lg transition ${
                recordStatusFilter === 'demo' ? 'bg-blue-600 text-white font-extrabold shadow-sm' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Demo Data ({leads.filter(l => l.isDemo || l.id.startsWith('lead-')).length})
            </button>
            <button
              onClick={() => { setRecordStatusFilter('all'); setSelectedLeadIds([]); }}
              className={`px-3 py-1.5 rounded-lg transition ${
                recordStatusFilter === 'all' ? 'bg-slate-900 text-white font-extrabold shadow-sm' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All Records ({leads.length})
            </button>
          </div>

          {selectedLeadIds.length > 0 && (
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
              {selectedLeadIds.length} Selected
            </span>
          )}
        </div>

        {/* Bulk Action Bar when items selected */}
        {selectedLeadIds.length > 0 && (
          <div className="p-3 bg-indigo-950 text-white rounded-xl flex flex-wrap items-center justify-between gap-3 animate-fadeIn border border-indigo-800 shadow-md">
            <div className="flex items-center gap-2 text-xs font-extrabold">
              <CheckSquare className="w-4 h-4 text-emerald-400" />
              <span>{selectedLeadIds.length} leads selected for bulk action</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
              {onBulkArchive && (
                <button
                  onClick={() => onBulkArchive(selectedLeadIds)}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition flex items-center gap-1"
                >
                  <Archive className="w-3.5 h-3.5" /> Archive
                </button>
              )}

              {onBulkSuppress && (
                <button
                  onClick={() => onBulkSuppress(selectedLeadIds)}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition flex items-center gap-1"
                >
                  <EyeOff className="w-3.5 h-3.5" /> Suppress
                </button>
              )}

              {onBulkTrash && (
                <button
                  onClick={() => onBulkTrash(selectedLeadIds)}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Move to Trash
                </button>
              )}

              {onBulkDelete && (
                <button
                  onClick={() => {
                    setConfirmModalState({
                      isOpen: true,
                      title: `Permanently Delete ${selectedLeadIds.length} Selected Records?`,
                      message: `Permanently remove ${selectedLeadIds.length} selected leads, notes, and activity history? This cannot be undone.`,
                      action: () => {
                        onBulkDelete(selectedLeadIds);
                        setSelectedLeadIds([]);
                      },
                      type: 'danger',
                      itemCount: selectedLeadIds.length,
                    });
                  }}
                  className="px-3 py-1.5 bg-rose-900 hover:bg-rose-800 text-white rounded-lg transition flex items-center gap-1 font-extrabold"
                >
                  <X className="w-3.5 h-3.5" /> Delete Permanently
                </button>
              )}

              <button
                onClick={() => setSelectedLeadIds([])}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition text-xs"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}

        {/* Search & Secondary Filter Controls */}
        <div className="flex flex-col md:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by business, contact person, email, or website..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <select
              value={tempFilter}
              onChange={(e) => setTempFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="">All Temperatures</option>
              <option value="HOT">HOT (90–100)</option>
              <option value="WARM">WARM (75–89)</option>
              <option value="POTENTIAL">POTENTIAL (50–74)</option>
              <option value="LOW">LOW (&lt;50)</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="Not Contacted">Not Contacted</option>
              <option value="Contacted">Contacted</option>
              <option value="Follow-Up Due">Follow-Up Due</option>
              <option value="Replied">Replied</option>
              <option value="Closed Won">Closed Won</option>
            </select>

            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="">All Countries</option>
              {uniqueCountries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="">All Industries</option>
              {uniqueIndustries.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Database Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3.5 w-10 text-center">
                  <button onClick={handleToggleSelectAll} title="Select All Visible">
                    {selectedLeadIds.length > 0 && selectedLeadIds.length === filteredLeads.length ? (
                      <CheckSquare className="w-4 h-4 text-indigo-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="p-3.5">Business & Strategy</th>
                <th className="p-3.5">Pipeline Stage</th>
                <th className="p-3.5">Contact Person</th>
                <th className="p-3.5">Audit & Evidence</th>
                <th className="p-3.5">Budget</th>
                <th className="p-3.5">Score</th>
                <th className="p-3.5">Temp</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-500">
                    No matching client leads found for this filter.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const isSelected = selectedLeadIds.includes(lead.id);

                  return (
                    <tr 
                      key={lead.id} 
                      className={`hover:bg-slate-50/80 transition ${isSelected ? 'bg-indigo-50/40' : ''}`}
                    >
                      <td className="p-3.5 text-center">
                        <button onClick={() => handleToggleSelectLead(lead.id)}>
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 hover:text-slate-400" />
                          )}
                        </button>
                      </td>

                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                          {lead.businessName}
                          {lead.leadStrategy === 'AGENCY_PARTNERSHIPS' ? (
                            <span className="text-[9px] bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded font-black uppercase border border-indigo-200">
                              Agency Partner
                            </span>
                          ) : (
                            <span className="text-[9px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-black uppercase border border-slate-200">
                              Direct Client
                            </span>
                          )}
                          {lead.archived && (
                            <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-black uppercase">
                              Archived
                            </span>
                          )}
                          {lead.suppressed && (
                            <span className="text-[9px] bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded font-black uppercase">
                              Suppressed
                            </span>
                          )}
                          {lead.trashed && (
                            <span className="text-[9px] bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded font-black uppercase">
                              Trash
                            </span>
                          )}
                          {lead.enrichment?.linkedinUrl && (
                            <a
                              href={lead.enrichment.linkedinUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800"
                              title="LinkedIn Company Page"
                            >
                              <Linkedin className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>{lead.industry}</span>
                          {lead.website && lead.website !== 'Not found' && (
                            <a
                              href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:underline flex items-center gap-0.5"
                            >
                              {lead.website.replace(/^https?:\/\//, '').replace(/\/.*$/, '')} <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                        {lead.skillGaps && lead.skillGaps.length > 0 && (
                          <div className="text-[10px] text-rose-700 font-extrabold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 inline-block mt-1">
                            SKILL GAP — VERIFY BEFORE OUTREACH: {lead.skillGaps.join(', ')}
                          </div>
                        )}
                      </td>

                      <td className="p-3.5">
                        {getStageBadge(lead)}
                      </td>

                      <td className="p-3.5">
                        <div className="font-medium text-slate-900">{lead.contactPerson}</div>
                        <div className="text-[11px] text-slate-400">{lead.email}</div>
                      </td>

                      <td className="p-3.5">
                        {lead.auditStatus === 'Audited' ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Audited
                            </span>
                            {lead.auditDetails?.responseTimeMs && (
                              <div className="text-[10px] text-slate-500 font-mono">
                                Latency: {lead.auditDetails.responseTimeMs}ms
                              </div>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => onSelectLeadForAudit(lead)}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300 transition"
                            title="Click to perform live technical website audit"
                          >
                            <RefreshCw className="w-2.5 h-2.5" /> Audit Pending
                          </button>
                        )}
                      </td>

                      <td className="p-3.5 font-bold text-slate-900">
                        {lead.estimatedBudget ? (
                          <span className="text-emerald-700 font-extrabold text-xs">
                            {lead.estimatedBudget}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal italic text-[11px]">
                            Unverified
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 font-extrabold text-sm text-slate-900">
                        {lead.score}
                      </td>

                      <td className="p-3.5">{getTemperatureBadge(lead.temperature)}</td>

                      <td className="p-3.5">{getStatusBadge(lead.contactStatus)}</td>

                      <td className="p-3.5 text-right space-x-1">
                        <a
                          href={createWhatsAppDeepLink(
                            lead.phone || '03075204612',
                            generateLeadWhatsAppPitch(lead.contactPerson, lead.businessName, lead.score)
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 hover:bg-emerald-50 rounded text-emerald-600 transition inline-block"
                          title="Message on WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        </a>

                        <button
                          onClick={() => handleEnrich(lead)}
                          disabled={enrichingId === lead.id}
                          className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition"
                          title="Enrich Profile"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${enrichingId === lead.id ? 'animate-spin' : ''}`} />
                        </button>

                        <button
                          onClick={() => onSelectLeadForEmail(lead)}
                          className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition"
                          title="Draft Email"
                        >
                          <Send className="w-3.5 h-3.5 text-indigo-600" />
                        </button>

                        {/* Universal Action Dropdown Menu */}
                        <LeadActionMenu
                          lead={lead}
                          onViewDetails={() => onEditLead(lead)}
                          onAudit={() => onSelectLeadForAudit(lead)}
                          onGenerateOutreach={() => onSelectLeadForEmail(lead)}
                          onArchive={onArchiveLead}
                          onSuppress={onSuppressLead}
                          onTrash={onTrashLead}
                          onRestore={onRestoreLead}
                          onPermanentDelete={(l) => {
                            setConfirmModalState({
                              isOpen: true,
                              title: `Permanently Delete ${l.businessName}?`,
                              message: `Are you sure you want to permanently delete ${l.businessName}? Lead information, activity history, and notes will be lost permanently.`,
                              action: () => onPermanentDeleteLead?.(l),
                              type: 'danger',
                            });
                          }}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmModalState.isOpen}
        onClose={() => setConfirmModalState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModalState.action}
        title={confirmModalState.title}
        message={confirmModalState.message}
        type={confirmModalState.type}
        itemCount={confirmModalState.itemCount}
        confirmText="Proceed"
      />
    </div>
  );
};

