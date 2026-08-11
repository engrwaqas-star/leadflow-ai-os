import React, { useState, useEffect } from 'react';
import {
  Linkedin,
  X,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
  Users,
  Building2,
  Code2,
  MessageSquare,
  Send,
  Loader2,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { Lead, UserProfile } from '../types';

interface LinkedInModalProps {
  lead: Lead | null;
  userProfile: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onLogOutreach: (leadId: string, channel: 'LinkedIn', note: string) => void;
}

export const LinkedInModal: React.FC<LinkedInModalProps> = ({
  lead,
  userProfile,
  isOpen,
  onClose,
  onLogOutreach,
}) => {
  const [activeTab, setActiveTab] = useState<'connection' | 'inmail'>('connection');
  const [loading, setLoading] = useState<boolean>(false);
  const [userInstructions, setUserInstructions] = useState<string>('');
  const [connectionNote, setConnectionNote] = useState<string>('');
  const [inMailSubject, setInMailSubject] = useState<string>('');
  const [inMailBody, setInMailBody] = useState<string>('');
  const [copiedNote, setCopiedNote] = useState<boolean>(false);
  const [copiedInMail, setCopiedInMail] = useState<boolean>(false);
  const [logged, setLogged] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && lead) {
      generateLinkedInPitch();
      setLogged(false);
    }
  }, [isOpen, lead]);

  if (!isOpen || !lead) return null;

  const generateLinkedInPitch = async (customInst?: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/linkedin-pitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          lead, 
          userProfile,
          userInstructions: customInst !== undefined ? customInst : userInstructions
        }),
      });
      const data = await res.json();
      if (data.success && data.pitch) {
        setConnectionNote(data.pitch.connectionNote || '');
        setInMailSubject(data.pitch.inMailSubject || '');
        setInMailBody(data.pitch.inMailBody || '');
      } else {
        fallbackPitch();
      }
    } catch {
      fallbackPitch();
    } finally {
      setLoading(false);
    }
  };

  const fallbackPitch = () => {
    const firstName = lead.contactPerson.split(' ')[0] || 'there';
    setConnectionNote(
      `Hi ${firstName}, I came across ${lead.businessName} and noticed a quick optimization opportunity on your mobile site. Would love to connect and share a 60-second tip!`
    );
    setInMailSubject(`Mobile site optimization tip for ${lead.businessName}`);
    setInMailBody(
      `Hi ${firstName},\n\nI was reviewing ${lead.businessName}'s digital presence and noticed ${lead.pitchHook || lead.auditIssue}.\n\nI specialize in custom Next.js/React site speed & mobile conversion enhancements. Would you be open to a 5-minute video walkthrough showing how we can fix this?\n\nBest regards,\n${userProfile.name}`
    );
  };

  const handleCopyNote = () => {
    navigator.clipboard.writeText(connectionNote);
    setCopiedNote(true);
    setTimeout(() => setCopiedNote(false), 2000);
  };

  const handleCopyInMail = () => {
    const fullInMail = `Subject: ${inMailSubject}\n\n${inMailBody}`;
    navigator.clipboard.writeText(fullInMail);
    setCopiedInMail(true);
    setTimeout(() => setCopiedInMail(false), 2000);
  };

  const handleLogAndOpen = () => {
    onLogOutreach(lead.id, 'LinkedIn', connectionNote);
    setLogged(true);

    const searchQuery = encodeURIComponent(`${lead.contactPerson} ${lead.businessName}`);
    const linkedinSearchUrl = lead.enrichment?.linkedinUrl || `https://www.linkedin.com/search/results/all/?keywords=${searchQuery}`;
    window.open(linkedinSearchUrl, '_blank', 'noopener,noreferrer');
  };

  const charCount = connectionNote.length;
  const isOverLimit = charCount > 300;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 p-5 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center">
              <Linkedin className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                LinkedIn Outreach Assistant
                <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30">
                  AI Generator
                </span>
              </h2>
              <p className="text-xs text-blue-100">
                Targeting: <span className="font-semibold text-white">{lead.contactPerson}</span> ({lead.businessName})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Company Quick Intelligence Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 font-medium">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              <span>{lead.businessName}</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>{lead.enrichment?.employeeCount || '10-50 employees'}</span>
            </div>
            {lead.enrichment?.techStack && (
              <div className="hidden sm:flex items-center gap-1.5 font-medium">
                <Code2 className="w-3.5 h-3.5 text-blue-600" />
                <span className="truncate max-w-[200px]">
                  {lead.enrichment.techStack.join(', ')}
                </span>
              </div>
            )}
          </div>
          <a
            href={lead.enrichment?.linkedinUrl || `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(lead.businessName)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800 hover:underline"
          >
            LinkedIn Profile <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Tabs */}
          <div className="flex border-b border-slate-200 gap-6 text-sm font-semibold">
            <button
              onClick={() => setActiveTab('connection')}
              className={`pb-2.5 flex items-center gap-2 border-b-2 transition ${
                activeTab === 'connection'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Connection Note (&lt;300 Chars)
            </button>
            <button
              onClick={() => setActiveTab('inmail')}
              className={`pb-2.5 flex items-center gap-2 border-b-2 transition ${
                activeTab === 'inmail'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Send className="w-4 h-4" />
              InMail / Direct Message Pitch
            </button>
          </div>

          {/* Custom AI Instruction Bar */}
          <div className="bg-sky-50/70 p-3.5 rounded-xl border border-sky-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-extrabold text-sky-950 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-sky-600" /> Custom AI Draft Instructions
              </label>
              <span className="text-[10px] text-sky-700 font-semibold">AI + Your Custom Angle</span>
            </div>

            <div className="space-y-2">
              <textarea
                rows={2}
                value={userInstructions}
                onChange={(e) => setUserInstructions(e.target.value)}
                placeholder="e.g. 'Tell them I specialize in Next.js site speed, ask if they want a 60-second video audit over WhatsApp, and keep it casual.'"
                className="w-full bg-white border border-sky-300 rounded-lg p-2.5 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
              <div className="flex justify-between items-center">
                <div className="flex flex-wrap gap-1">
                  {['Mention 60-sec video audit', 'Focus on mobile speed', 'Ask for quick chat'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        const newInst = userInstructions ? `${userInstructions}. ${preset}` : preset;
                        setUserInstructions(newInst);
                        generateLinkedInPitch(newInst);
                      }}
                      className="px-2 py-0.5 bg-white border border-sky-200 hover:border-sky-400 text-sky-800 text-[10px] font-bold rounded-md transition"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => generateLinkedInPitch(userInstructions)}
                  disabled={loading}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-lg transition inline-flex items-center gap-1.5 shrink-0 shadow-xs"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  Generate Custom Draft
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3 text-slate-500">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-sm font-medium">Crafting high-converting LinkedIn pitch with Gemini AI...</p>
            </div>
          ) : activeTab === 'connection' ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Personalized Connection Request Note
                </label>
                <span
                  className={`text-xs font-semibold ${
                    isOverLimit ? 'text-rose-600' : 'text-slate-500'
                  }`}
                >
                  {charCount}/300 chars {isOverLimit && '(Over LinkedIn limit!)'}
                </span>
              </div>
              <textarea
                rows={4}
                value={connectionNote}
                onChange={(e) => setConnectionNote(e.target.value)}
                className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <div className="flex justify-between items-center pt-1">
                <button
                  onClick={generateLinkedInPitch}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Regenerate Pitch
                </button>
                <button
                  onClick={handleCopyNote}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-lg transition"
                >
                  {copiedNote ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedNote ? 'Copied to Clipboard!' : 'Copy Note'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  InMail Subject
                </label>
                <input
                  type="text"
                  value={inMailSubject}
                  onChange={(e) => setInMailSubject(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  InMail Body Content
                </label>
                <textarea
                  rows={6}
                  value={inMailBody}
                  onChange={(e) => setInMailBody(e.target.value)}
                  className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-between items-center pt-1">
                <button
                  onClick={generateLinkedInPitch}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Regenerate InMail
                </button>
                <button
                  onClick={handleCopyInMail}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-lg transition"
                >
                  {copiedInMail ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedInMail ? 'Copied Full InMail!' : 'Copy InMail'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Outreach will update lead status to <span className="font-bold text-slate-700">Contacted</span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="w-1/2 sm:w-auto px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition"
            >
              Close
            </button>
            <button
              onClick={handleLogAndOpen}
              className="w-1/2 sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
            >
              {logged ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" /> Logged & Opening LinkedIn!
                </>
              ) : (
                <>
                  <Linkedin className="w-4 h-4" /> Open Profile & Mark Contacted
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
