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
  MessageSquare
} from 'lucide-react';
import { Lead, Temperature, ContactStatus } from '../types';
import { createWhatsAppDeepLink, generateLeadWhatsAppPitch } from '../utils/whatsapp';

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
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [tempFilter, setTempFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [countryFilter, setCountryFilter] = useState<string>('');
  const [industryFilter, setIndustryFilter] = useState<string>('');
  const [enrichingId, setEnrichingId] = useState<string | null>(null);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
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
  }, [leads, searchTerm, tempFilter, statusFilter, countryFilter, industryFilter]);

  const uniqueCountries = useMemo(() => {
    return Array.from(new Set(leads.map((l) => l.country))).filter(Boolean);
  }, [leads]);

  const uniqueIndustries = useMemo(() => {
    return Array.from(new Set(leads.map((l) => l.industry))).filter(Boolean);
  }, [leads]);

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

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
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
                <th className="p-3.5">Business & Intelligence</th>
                <th className="p-3.5">Contact Person</th>
                <th className="p-3.5">Credibility</th>
                <th className="p-3.5">Website</th>
                <th className="p-3.5">Score</th>
                <th className="p-3.5">Temp</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    No matching client leads found.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        {lead.businessName}
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
                        {lead.enrichment?.employeeCount && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                            {lead.enrichment.employeeCount}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-medium text-slate-900">{lead.contactPerson}</div>
                      <div className="text-[11px] text-slate-400">{lead.email}</div>
                    </td>
                    <td className="p-3.5">{renderCredibilityBadge(lead)}</td>
                    <td className="p-3.5 text-indigo-600 font-medium">
                      <a
                        href={
                          lead.website.startsWith('http')
                            ? lead.website
                            : `https://${lead.website}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 hover:underline"
                      >
                        {lead.website} <ExternalLink className="w-3 h-3 text-slate-400" />
                      </a>
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
                        title="Message on WhatsApp (wa.me Deep Link)"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      </a>
                      <button
                        onClick={() => handleEnrich(lead)}
                        disabled={enrichingId === lead.id}
                        className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition"
                        title="Enrich Profile (LinkedIn & Clearbit)"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${enrichingId === lead.id ? 'animate-spin' : ''}`} />
                      </button>
                      <button
                        onClick={() => onSelectLeadForLinkedIn(lead)}
                        className="p-1.5 hover:bg-blue-50 rounded text-blue-600 transition"
                        title="LinkedIn Outreach"
                      >
                        <Linkedin className="w-3.5 h-3.5 text-blue-600" />
                      </button>
                      <button
                        onClick={() => onSelectLeadForAudit(lead)}
                        className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition"
                        title="Website Audit"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      </button>
                      <button
                        onClick={() => onSelectLeadForEmail(lead)}
                        className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition"
                        title="Draft Email"
                      >
                        <Send className="w-3.5 h-3.5 text-indigo-600" />
                      </button>
                      <button
                        onClick={() => onEditLead(lead)}
                        className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition"
                        title="Edit Lead"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                      </button>
                      <button
                        onClick={() => onDeleteLead(lead.id)}
                        className="p-1.5 hover:bg-rose-50 rounded text-rose-600 transition"
                        title="Delete Lead"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

