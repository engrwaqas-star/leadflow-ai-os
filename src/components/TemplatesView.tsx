import React, { useState } from 'react';
import { FileText, Copy, Check, Sparkles, Plus, Send } from 'lucide-react';
import { EMAIL_TEMPLATES } from '../data/emailTemplates';
import { EmailTemplate, Lead } from '../types';

interface TemplatesViewProps {
  leads: Lead[];
  onSelectTemplateForEmail: (template: EmailTemplate, lead?: Lead) => void;
}

export const TemplatesView: React.FC<TemplatesViewProps> = ({
  leads,
  onSelectTemplateForEmail,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string>(leads[0]?.id || '');

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const selectedLead = leads.find((l) => l.id === selectedLeadId) || leads[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          High-Converting Email Templates
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Proven outreach frameworks tailored for freelance web developers, designers, and marketers.
        </p>
      </div>

      {/* Select Lead for Live Preview */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-indigo-600" /> Live Preview with Lead Data:
        </div>
        <select
          value={selectedLeadId}
          onChange={(e) => setSelectedLeadId(e.target.value)}
          className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none min-w-[240px]"
        >
          {leads.map((l) => (
            <option key={l.id} value={l.id}>
              {l.businessName} ({l.industry})
            </option>
          ))}
        </select>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {EMAIL_TEMPLATES.map((tpl) => {
          const filledBody = tpl.bodyTemplate
            .replace(/\{\{businessName\}\}/g, selectedLead?.businessName || 'Business Name')
            .replace(/\{\{contactPerson\}\}/g, selectedLead?.contactPerson || 'Business Owner')
            .replace(/\{\{country\}\}/g, selectedLead?.country || 'USA')
            .replace(/\{\{industry\}\}/g, selectedLead?.industry || 'Web Services')
            .replace(/\{\{auditIssue\}\}/g, selectedLead?.auditIssue || 'website responsiveness gaps')
            .replace(/\{\{suggestedService\}\}/g, selectedLead?.suggestedService || 'Website Redesign')
            .replace(/\{\{website\}\}/g, selectedLead?.website || 'your website')
            .replace(/\{\{city\}\}/g, selectedLead?.city || 'your area')
            .replace(/\{\{senderName\}\}/g, 'Waqas Ashiq')
            .replace(/\{\{senderTitle\}\}/g, 'Full Stack Web & Software Engineer');

          const filledSubject = tpl.subjectTemplate
            .replace(/\{\{businessName\}\}/g, selectedLead?.businessName || 'Business Name')
            .replace(/\{\{website\}\}/g, selectedLead?.website || 'your website');

          return (
            <div
              key={tpl.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-600 uppercase bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                    {tpl.category}
                  </span>
                  <button
                    onClick={() => handleCopy(`${filledSubject}\n\n${filledBody}`, tpl.id)}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded transition"
                  >
                    {copiedId === tpl.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy Email
                      </>
                    )}
                  </button>
                </div>

                <h3 className="font-bold text-slate-900 text-base mt-2.5">{tpl.title}</h3>
                <p className="text-xs text-slate-500 mt-1">{tpl.description}</p>

                <div className="mt-4 bg-slate-50 p-3.5 rounded-lg border border-slate-200 font-mono text-xs text-slate-800 space-y-2 whitespace-pre-wrap">
                  <div className="font-bold text-slate-900 border-b border-slate-200 pb-1.5">
                    Subject: {filledSubject}
                  </div>
                  <div>{filledBody}</div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => onSelectTemplateForEmail(tpl, selectedLead)}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm transition"
                >
                  <Send className="w-3.5 h-3.5" /> Use Template with AI Polish
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
