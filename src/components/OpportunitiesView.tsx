import React from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  Smartphone, 
  MousePointerClick, 
  Gauge, 
  Send, 
  ExternalLink 
} from 'lucide-react';
import { Lead } from '../types';

interface OpportunitiesViewProps {
  leads: Lead[];
  onSelectLeadForAudit: (lead: Lead) => void;
  onSelectLeadForEmail: (lead: Lead) => void;
}

export const OpportunitiesView: React.FC<OpportunitiesViewProps> = ({
  leads,
  onSelectLeadForAudit,
  onSelectLeadForEmail,
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Website Opportunities Audit
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Observable design, mobile responsiveness, performance, call-to-action, and conversion flaws found on client websites.
        </p>
      </div>

      {/* Opportunities Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-base">Client Website Audit Overview</h3>
          <span className="text-xs text-slate-500">{leads.length} Monitored Websites</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3.5">Business & Website</th>
                <th className="p-3.5">Mobile Viewport</th>
                <th className="p-3.5">Clear CTA</th>
                <th className="p-3.5">Speed Rating</th>
                <th className="p-3.5">Audit Status</th>
                <th className="p-3.5">Suggested Service</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3.5 font-semibold text-slate-900">
                    <div>{lead.businessName}</div>
                    <div className="text-[11px] text-indigo-600 font-normal">
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
                    </div>
                  </td>

                  <td className="p-3.5">
                    {lead.mobileViewport ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                        <CheckCircle2 className="w-4 h-4" /> Responsive
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-600 font-bold">
                        <XCircle className="w-4 h-4" /> Non-Responsive
                      </span>
                    )}
                  </td>

                  <td className="p-3.5">
                    {lead.clearCTA ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                        <CheckCircle2 className="w-4 h-4" /> Clear CTA
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-600 font-bold">
                        <XCircle className="w-4 h-4" /> Missing CTA
                      </span>
                    )}
                  </td>

                  <td className="p-3.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                        lead.speedRating === 'Fast'
                          ? 'bg-emerald-100 text-emerald-700'
                          : lead.speedRating === 'Average'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      <Gauge className="w-3 h-3" /> {lead.speedRating || 'Slow'}
                    </span>
                  </td>

                  <td className="p-3.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        lead.auditStatus === 'Critical Issues'
                          ? 'bg-rose-100 text-rose-700 border border-rose-300'
                          : lead.auditStatus === 'Audited'
                          ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {lead.auditStatus || 'Audited'}
                    </span>
                  </td>

                  <td className="p-3.5 text-slate-800 font-medium">{lead.suggestedService}</td>

                  <td className="p-3.5 text-right space-x-1.5">
                    <button
                      onClick={() => onSelectLeadForAudit(lead)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-[11px] transition inline-flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3 text-indigo-600" /> Deep Audit
                    </button>
                    <button
                      onClick={() => onSelectLeadForEmail(lead)}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded text-[11px] transition inline-flex items-center gap-1 shadow-sm"
                    >
                      <Send className="w-3 h-3" /> Pitch Solution
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
