import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Zap,
  CheckCircle2,
  Copy,
  Check,
  Download,
  Send,
  Loader2,
  FileText,
  Clock,
  Layers,
  ArrowRight,
  TrendingUp,
  Cpu,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { Lead, UserProfile, TailoredProposal, ClientProblemArchetype } from '../types';

interface ProposalModalProps {
  lead: Lead;
  profile: UserProfile;
  onClose: () => void;
  onSendWithEmail?: (subject: string, body: string) => void;
}

export const ProposalModal: React.FC<ProposalModalProps> = ({
  lead,
  profile,
  onClose,
  onSendWithEmail,
}) => {
  const [proposal, setProposal] = useState<TailoredProposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTier, setActiveTier] = useState<'tier1' | 'tier2' | 'tier3'>('tier2');
  const [userGuidance, setUserGuidance] = useState('');
  const [isEditingMarkdown, setIsEditingMarkdown] = useState(false);
  const [editableMarkdown, setEditableMarkdown] = useState('');

  const fetchProposal = async (customGuidance?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/generate-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead,
          userProfile: profile,
          customInstructions: customGuidance || userGuidance,
        }),
      });
      const data = await res.json();
      if (data.success && data.proposal) {
        setProposal(data.proposal);
        setEditableMarkdown(data.proposal.fullProposalMarkdown);
        if (data.proposal.recommendedTier) {
          setActiveTier(data.proposal.recommendedTier);
        }
      } else {
        setError(data.error || 'Failed to generate tailored proposal');
      }
    } catch (err: any) {
      setError(err.message || 'Network error generating proposal');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposal();
  }, [lead.id]);

  const handleCopyProposal = () => {
    const textToCopy = isEditingMarkdown ? editableMarkdown : proposal?.fullProposalMarkdown || '';
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadMarkdown = () => {
    const text = isEditingMarkdown ? editableMarkdown : proposal?.fullProposalMarkdown || '';
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${lead.businessName.replace(/\s+/g, '_')}_Frontend_Proposal.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleTransferToEmail = () => {
    if (!proposal || !onSendWithEmail) return;
    const selectedTierData =
      activeTier === 'tier1'
        ? proposal.tier1_QuickFix
        : activeTier === 'tier3'
        ? proposal.tier3_FullBuild
        : proposal.tier2_Modernize;

    const emailSubject = `Frontend Modernization Proposal & Scope for ${lead.businessName}`;
    const emailBody = `Hi ${lead.contactPerson && lead.contactPerson !== 'Not found' ? lead.contactPerson : 'there'},

Following up regarding the ${proposal.archetypeTitle} on ${lead.website || lead.businessName}.

I've put together a tailored Scope of Work & Solution Breakdown to fix the core issues:
• Problem Diagnosed: ${proposal.diagnosisSummary}
• Technical Stack: ${proposal.techStackRecommended.join(', ')}

Recommended Package: ${selectedTierData.name} (${selectedTierData.price} • ${selectedTierData.timeline} Turnaround)
Deliverables:
${selectedTierData.deliverables.map((d) => `• ${d}`).join('\n')}

Expected Result: ${proposal.roiEstimate}

${proposal.callToAction}

Best regards,
${profile.name}
${profile.title}`;

    onSendWithEmail(emailSubject, emailBody);
  };

  const getArchetypeColor = (archetype?: ClientProblemArchetype) => {
    switch (archetype) {
      case 'SPEED_PERFORMANCE':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'MOBILE_RESPONSIVENESS':
        return 'bg-rose-100 text-rose-900 border-rose-300';
      case 'LEGACY_CMS_REBUILD':
        return 'bg-indigo-100 text-indigo-900 border-indigo-300';
      case 'STARTUP_MVP_VELOCITY':
        return 'bg-purple-100 text-purple-900 border-purple-300';
      case 'ECOMMERCE_CONVERSION':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'AGENCY_SUBCONTRACT':
        return 'bg-cyan-100 text-cyan-900 border-cyan-300';
      default:
        return 'bg-slate-100 text-slate-900 border-slate-300';
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 mb-5 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h2 className="text-xl font-black text-slate-900">
                Problem-Trained Client Proposal Studio
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Custom SOW &amp; Technical Solution for <span className="font-bold text-slate-800">{lead.businessName}</span> ({lead.website || 'No website'})
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyProposal}
              disabled={loading || !proposal}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition flex items-center gap-1.5 border border-slate-300"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
              {copied ? 'Copied to Clipboard!' : 'Copy Proposal SOW'}
            </button>
            <button
              onClick={handleDownloadMarkdown}
              disabled={loading || !proposal}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition flex items-center gap-1.5 border border-slate-300"
              title="Download .md file"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              .md
            </button>
            {onSendWithEmail && (
              <button
                onClick={handleTransferToEmail}
                disabled={loading || !proposal}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                Transfer to Email Studio
              </button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-20 text-center space-y-3">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">
              Analyzing Diagnosed Problem &amp; Generating Bespoke Proposal...
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Extracting specific weaknesses from {lead.businessName}'s audit data, structuring 3 pricing tiers, and formulating technical solutions.
            </p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="p-5 bg-rose-50 border border-rose-200 rounded-xl space-y-3 text-xs text-rose-900">
            <div className="flex items-center gap-2 font-bold text-sm">
              <AlertCircle className="w-5 h-5 text-rose-600" />
              Failed to Generate Proposal
            </div>
            <p>{error}</p>
            <button
              onClick={() => fetchProposal()}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition inline-flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry Proposal Generation
            </button>
          </div>
        )}

        {/* Content */}
        {proposal && !loading && (
          <div className="space-y-6">
            {/* Top Problem Archetype Banner */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Diagnosed Archetype:</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${getArchetypeColor(proposal.problemArchetype)}`}>
                    {proposal.archetypeTitle}
                  </span>
                </div>
                <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  Estimated Client ROI: <span className="font-bold">{proposal.roiEstimate}</span>
                </div>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                <span className="font-bold text-slate-900">Problem Diagnosis:</span> {proposal.diagnosisSummary}
              </p>

              {/* Observed Issues list */}
              {proposal.specificObservedIssues?.length > 0 && (
                <div className="bg-white p-3 rounded-lg border border-slate-200/80">
                  <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1.5">
                    Specific Audited Weaknesses:
                  </span>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                    {proposal.specificObservedIssues.map((issue, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-rose-500 font-bold">•</span>
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* 3-Tier Investment Pricing Matrix */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  3-Tier Scope &amp; Pricing Packages
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  Select recommended tier for outreach
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Tier 1 */}
                <div
                  onClick={() => setActiveTier('tier1')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition relative flex flex-col justify-between ${
                    activeTier === 'tier1'
                      ? 'border-indigo-600 bg-indigo-50/40 shadow-md'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold uppercase text-slate-500">Tier 1 • Quick Fix</span>
                      <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded">
                        {proposal.tier1_QuickFix.timeline}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-slate-900 text-sm">{proposal.tier1_QuickFix.name}</h4>
                    <div className="text-xl font-black text-indigo-600">{proposal.tier1_QuickFix.price}</div>
                    <p className="text-[11px] text-slate-500 italic">{proposal.tier1_QuickFix.recommendedFor}</p>
                    <div className="border-t border-slate-200/80 pt-2 space-y-1.5 text-xs text-slate-700">
                      {proposal.tier1_QuickFix.deliverables.map((item, i) => (
                        <div key={i} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="text-[11px]">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-3 pt-2 text-right">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${activeTier === 'tier1' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>
                      {activeTier === 'tier1' ? 'Selected Package' : 'Click to Select'}
                    </span>
                  </div>
                </div>

                {/* Tier 2 */}
                <div
                  onClick={() => setActiveTier('tier2')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition relative flex flex-col justify-between ${
                    activeTier === 'tier2'
                      ? 'border-indigo-600 bg-indigo-50/40 shadow-md'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="absolute -top-2.5 right-3 bg-amber-500 text-white font-extrabold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                    Recommended
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold uppercase text-indigo-600">Tier 2 • Modernize</span>
                      <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded">
                        {proposal.tier2_Modernize.timeline}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-slate-900 text-sm">{proposal.tier2_Modernize.name}</h4>
                    <div className="text-xl font-black text-indigo-600">{proposal.tier2_Modernize.price}</div>
                    <p className="text-[11px] text-slate-500 italic">{proposal.tier2_Modernize.recommendedFor}</p>
                    <div className="border-t border-slate-200/80 pt-2 space-y-1.5 text-xs text-slate-700">
                      {proposal.tier2_Modernize.deliverables.map((item, i) => (
                        <div key={i} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                          <span className="text-[11px] font-medium">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-3 pt-2 text-right">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${activeTier === 'tier2' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>
                      {activeTier === 'tier2' ? 'Selected Package' : 'Click to Select'}
                    </span>
                  </div>
                </div>

                {/* Tier 3 */}
                <div
                  onClick={() => setActiveTier('tier3')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition relative flex flex-col justify-between ${
                    activeTier === 'tier3'
                      ? 'border-indigo-600 bg-indigo-50/40 shadow-md'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold uppercase text-slate-500">Tier 3 • Full Build</span>
                      <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded">
                        {proposal.tier3_FullBuild.timeline}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-slate-900 text-sm">{proposal.tier3_FullBuild.name}</h4>
                    <div className="text-xl font-black text-indigo-600">{proposal.tier3_FullBuild.price}</div>
                    <p className="text-[11px] text-slate-500 italic">{proposal.tier3_FullBuild.recommendedFor}</p>
                    <div className="border-t border-slate-200/80 pt-2 space-y-1.5 text-xs text-slate-700">
                      {proposal.tier3_FullBuild.deliverables.map((item, i) => (
                        <div key={i} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                          <span className="text-[11px]">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-3 pt-2 text-right">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${activeTier === 'tier3' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>
                      {activeTier === 'tier3' ? 'Selected Package' : 'Click to Select'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Technical Stack & Approach */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-indigo-600" />
                  Proposed Technical Stack &amp; Architecture
                </span>
                <div className="flex flex-wrap gap-1">
                  {proposal.techStackRecommended?.map((t, idx) => (
                    <span key={idx} className="bg-white border border-slate-300 text-slate-800 font-bold px-2 py-0.5 rounded text-[10px]">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-slate-600 leading-relaxed">
                {proposal.technicalApproach}
              </p>
            </div>

            {/* Full Markdown Proposal Document View/Editor */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="bg-slate-100 p-3 flex items-center justify-between border-b border-slate-200">
                <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-600" /> Full Scope of Work (SOW) Markdown Document
                </span>
                <button
                  onClick={() => setIsEditingMarkdown(!isEditingMarkdown)}
                  className="text-indigo-600 hover:text-indigo-800 font-bold text-xs"
                >
                  {isEditingMarkdown ? 'Preview Markdown' : 'Edit Document Text'}
                </button>
              </div>

              {isEditingMarkdown ? (
                <textarea
                  rows={12}
                  value={editableMarkdown}
                  onChange={(e) => setEditableMarkdown(e.target.value)}
                  className="w-full p-4 text-xs font-mono bg-white focus:outline-none leading-relaxed"
                />
              ) : (
                <div className="p-4 bg-white text-xs text-slate-800 font-sans leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {editableMarkdown}
                </div>
              )}
            </div>

            {/* Custom Instruction Regenerator */}
            <div className="p-3.5 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-indigo-950 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Refine Proposal with Custom Client Guidance
                </label>
                <span className="text-[10px] text-slate-500">e.g., "Add 1-year maintenance", "Include SEO migration"</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={userGuidance}
                  onChange={(e) => setUserGuidance(e.target.value)}
                  placeholder="e.g. Include 30-day post-launch bug warranty, emphasize Tailwind mobile optimization..."
                  className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <button
                  onClick={() => fetchProposal(userGuidance)}
                  disabled={loading}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition inline-flex items-center gap-1 shrink-0"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  Regenerate SOW
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
