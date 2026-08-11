import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Send,
  Copy,
  Check,
  Loader2,
  Calendar,
  Clock,
  Lightbulb,
  MessageSquare,
  ExternalLink,
  ChevronRight,
  ListPlus,
  Zap,
} from 'lucide-react';
import { Lead, UserProfile, EmailTemplate } from '../types';

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  profile: UserProfile;
  onLogOutreach: (leadId: string, subject: string, body: string) => void;
  onScheduleOutreach: (
    leadId: string,
    subject: string,
    body: string,
    scheduledAt: string
  ) => void;
  initialTemplate?: EmailTemplate | null;
}

interface OpeningItem {
  style: string;
  text: string;
}

interface TalkingPointItem {
  title: string;
  point: string;
  benefit: string;
}

export const EmailModal: React.FC<EmailModalProps> = ({
  isOpen,
  onClose,
  lead,
  profile,
  onLogOutreach,
  onScheduleOutreach,
  initialTemplate,
}) => {
  const [strategy, setStrategy] = useState('Problem-Agitate-Solve');
  const [tone, setTone] = useState('Professional & Conversational');
  const [userInstructions, setUserInstructions] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // AI Helpers state
  const [activeTab, setActiveTab] = useState<'editor' | 'openings' | 'talkingPoints'>('editor');
  const [openings, setOpenings] = useState<OpeningItem[]>([]);
  const [loadingOpenings, setLoadingOpenings] = useState(false);
  const [talkingPoints, setTalkingPoints] = useState<TalkingPointItem[]>([]);
  const [selectedPoints, setSelectedPoints] = useState<string[]>([]);
  const [loadingPoints, setLoadingPoints] = useState(false);
  const [selectedOpening, setSelectedOpening] = useState<string>('');

  // Scheduling state
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduledDateTime, setScheduledDateTime] = useState('');

  // GoFullPage Screenshot Attachments State
  const [uploadedScreenshots, setUploadedScreenshots] = useState<{ id: string; name: string; url: string }[]>([]);

  const handleModalFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files: File[] = Array.from(e.target.files);
    files.forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const newImg = {
            id: Math.random().toString(36).substring(2, 9),
            name: file.name,
            url: event.target.result as string,
          };
          setUploadedScreenshots((prev) => [...prev, newImg]);
          setBody((prev) => `${prev}\n\n[Attached GoFullPage Website Audit Screenshot: ${file.name}]`);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeModalScreenshot = (id: string) => {
    setUploadedScreenshots((prev) => prev.filter((img) => img.id !== id));
  };

  // Initialize default schedule time to tomorrow at 9:00 AM
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    const isoStr = tomorrow.toISOString().slice(0, 16);
    setScheduledDateTime(isoStr);
  }, [isOpen]);

  const [autoAttachSnapshot, setAutoAttachSnapshot] = useState(true);

  useEffect(() => {
    if (lead && isOpen) {
      if (lead.auditScreenshotUrl && autoAttachSnapshot) {
        setUploadedScreenshots([
          {
            id: `audit-${lead.id}`,
            name: lead.auditScreenshotName || `${lead.businessName}_Website_Audit.png`,
            url: lead.auditScreenshotUrl,
          },
        ]);
      } else if (!autoAttachSnapshot) {
        setUploadedScreenshots((prev) => prev.filter((img) => !img.id.startsWith('audit-')));
      }

      if (initialTemplate) {
        const filledSub = initialTemplate.subjectTemplate
          .replace(/\{\{businessName\}\}/g, lead.businessName)
          .replace(/\{\{website\}\}/g, lead.website);
        const filledBody = initialTemplate.bodyTemplate
          .replace(/\{\{businessName\}\}/g, lead.businessName)
          .replace(/\{\{contactPerson\}\}/g, lead.contactPerson || 'Business Owner')
          .replace(/\{\{country\}\}/g, lead.country)
          .replace(/\{\{industry\}\}/g, lead.industry)
          .replace(/\{\{auditIssue\}\}/g, lead.auditIssue || 'mobile responsiveness issues')
          .replace(/\{\{suggestedService\}\}/g, lead.suggestedService)
          .replace(/\{\{website\}\}/g, lead.website)
          .replace(/\{\{city\}\}/g, lead.city || 'your city')
          .replace(/\{\{senderName\}\}/g, profile.name)
          .replace(/\{\{senderTitle\}\}/g, profile.title);

        setSubject(filledSub);
        setBody(filledBody);
      } else {
        generateAiEmail(strategy, tone, '', []);
      }
    }
  }, [lead, initialTemplate, isOpen]);

  if (!isOpen || !lead) return null;

  // Generate full email with AI
  async function generateAiEmail(
    selectedStrategy: string,
    selectedTone: string,
    openingText: string,
    points: string[],
    customPromptInstructions?: string
  ) {
    setGenerating(true);
    try {
      const res = await fetch('/api/ai/generate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead,
          strategy: selectedStrategy,
          tone: selectedTone,
          customOpening: openingText || selectedOpening,
          selectedTalkingPoints: points.length > 0 ? points : selectedPoints,
          userInstructions: customPromptInstructions !== undefined ? customPromptInstructions : userInstructions,
          senderName: profile.name,
          senderTitle: profile.title,
        }),
      });
      const data = await res.json();
      if (data.success && data.email) {
        setSubject(data.email.subject || '');
        setBody(data.email.body || '');
      } else {
        throw new Error(data.error || 'Failed');
      }
    } catch (err) {
      console.warn('Fallback local email draft:', err);
      setSubject(`Quick observation regarding ${lead.businessName}'s mobile booking`);
      setBody(
        `Hi ${lead.contactPerson || 'there'},\n\nI was reviewing local ${lead.industry} businesses in ${lead.city || lead.country} and noticed ${lead.businessName} has fantastic service reviews.\n\nHowever, when visiting ${lead.website} on mobile, ${lead.auditIssue || 'page elements overlap and the contact form breaks'}.\n\nI put together a quick solution for ${lead.businessName} featuring ${lead.suggestedService} to boost client inquiries.\n\nMind if I send over a 2-minute video walkthrough?\n\nBest regards,\n${profile.name}\n${profile.title}`
      );
    } finally {
      setGenerating(false);
    }
  }

  // Fetch Personalized Openings
  async function fetchPersonalizedOpenings() {
    setLoadingOpenings(true);
    try {
      const res = await fetch('/api/ai/personalized-opening', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead, senderName: profile.name }),
      });
      const data = await res.json();
      if (data.success && data.openings) {
        setOpenings(data.openings);
      }
    } catch (err) {
      console.error('Error fetching openings:', err);
    } finally {
      setLoadingOpenings(false);
    }
  }

  // Fetch Talking Points
  async function fetchTalkingPoints() {
    setLoadingPoints(true);
    try {
      const res = await fetch('/api/ai/talking-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead }),
      });
      const data = await res.json();
      if (data.success && data.talkingPoints) {
        setTalkingPoints(data.talkingPoints);
      }
    } catch (err) {
      console.error('Error fetching talking points:', err);
    } finally {
      setLoadingPoints(false);
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendNowAndLog = () => {
    onLogOutreach(lead.id, subject, body);
    onClose();
  };

  const handleScheduleSubmit = () => {
    if (!scheduledDateTime) return;
    onScheduleOutreach(lead.id, subject, body, scheduledDateTime);
    onClose();
  };

  const handleMailtoDispatch = () => {
    const mailtoUrl = `mailto:${lead.email}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, '_blank');
    onLogOutreach(lead.id, subject, body);
    onClose();
  };

  // Preset quick schedule setters
  const setQuickSchedule = (daysToAdd: number, hour: number) => {
    const target = new Date();
    target.setDate(target.getDate() + daysToAdd);
    target.setHours(hour, 0, 0, 0);
    setScheduledDateTime(target.toISOString().slice(0, 16));
  };

  const toggleTalkingPointSelection = (pointStr: string) => {
    if (selectedPoints.includes(pointStr)) {
      setSelectedPoints(selectedPoints.filter((p) => p !== pointStr));
    } else {
      setSelectedPoints([...selectedPoints, pointStr]);
    }
  };

  const insertOpeningIntoBody = (openingText: string) => {
    setSelectedOpening(openingText);
    const bodyLines = body.split('\n\n');
    if (bodyLines.length > 1) {
      // Replace second block or top block
      bodyLines[1] = openingText;
      setBody(bodyLines.join('\n\n'));
    } else {
      setBody(`Hi ${lead.contactPerson || 'there'},\n\n${openingText}\n\n${body}`);
    }
    setActiveTab('editor');
  };

  const appendTalkingPointsToBody = () => {
    if (selectedPoints.length === 0) return;
    const pointsBlock = selectedPoints.map((p) => `• ${p}`).join('\n');
    setBody((prev) => `${prev}\n\nKey areas to address:\n${pointsBlock}`);
    setActiveTab('editor');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 mb-4 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h2 className="text-xl font-bold text-slate-900">
                AI Outreach & Personalization Studio
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Recipient: <span className="font-bold text-slate-800">{lead.businessName}</span> ({lead.email}) • <span className="text-indigo-600 font-semibold">{lead.industry}</span>
            </p>
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setIsScheduling(false)}
              className={`px-3 py-1.5 rounded-lg transition ${
                !isScheduling
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Send / Log Now
            </button>
            <button
              onClick={() => setIsScheduling(true)}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                isScheduling
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" /> Schedule Outreach
            </button>
          </div>
        </div>

        {/* REPLIED LEAD SAFEGUARD WARNING */}
        {lead.contactStatus === 'Replied' && (
          <div className="mb-4 bg-amber-50 border border-amber-300 p-3 rounded-xl flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center gap-2 font-bold">
              <Zap className="w-4 h-4 text-amber-600" />
              <span>Duplicate Prevention Warning: This client ({lead.businessName}) has already sent a reply!</span>
            </div>
            <span className="text-[10px] bg-amber-200 text-amber-950 px-2 py-0.5 rounded font-extrabold uppercase">
              Replied Status
            </span>
          </div>
        )}

        {/* AI Helper Mode Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('editor')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
              activeTab === 'editor'
                ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" /> Email Content Editor
          </button>
          <button
            onClick={() => {
              setActiveTab('openings');
              if (openings.length === 0) fetchPersonalizedOpenings();
            }}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
              activeTab === 'openings'
                ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Personalized Openings
          </button>
          <button
            onClick={() => {
              setActiveTab('talkingPoints');
              if (talkingPoints.length === 0) fetchTalkingPoints();
            }}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
              activeTab === 'talkingPoints'
                ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ListPlus className="w-3.5 h-3.5 text-emerald-600" /> Industry Talking Points
          </button>
        </div>

        {/* TAB 1: EMAIL EDITOR */}
        {activeTab === 'editor' && (
          <div>
            {/* Strategy & Tone Controls */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 mb-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Outreach Strategy
                  </label>
                  <select
                    value={strategy}
                    onChange={(e) => {
                      setStrategy(e.target.value);
                      generateAiEmail(e.target.value, tone, selectedOpening, selectedPoints);
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Problem-Agitate-Solve">Problem - Agitate - Solve (PAS)</option>
                    <option value="Direct Website Audit">Direct Website Audit & Hook</option>
                    <option value="Value-Add Pitch">Value-Add Walkthrough Pitch</option>
                    <option value="Gentle Follow-Up">Gentle Follow-Up & Reminder</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Tone & Style
                  </label>
                  <select
                    value={tone}
                    onChange={(e) => {
                      setTone(e.target.value);
                      generateAiEmail(strategy, e.target.value, selectedOpening, selectedPoints);
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Professional & Conversational">Professional & Conversational</option>
                    <option value="Direct & High-Impact">Direct & High-Impact</option>
                    <option value="Warm & Friendly Expert">Warm & Friendly Expert</option>
                    <option value="Concise & Low Friction">Concise & Low Friction</option>
                  </select>
                </div>
              </div>

              {/* Custom AI Instructions Prompt Box */}
              <div className="pt-2 border-t border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-extrabold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Custom AI Draft Instructions
                  </label>
                  <span className="text-[10px] text-slate-500 font-semibold">Combine user instructions + lead context</span>
                </div>

                <div className="relative">
                  <textarea
                    rows={2}
                    value={userInstructions}
                    onChange={(e) => setUserInstructions(e.target.value)}
                    placeholder="e.g. Tell the AI: 'Mention I offer a 15% discount for local businesses, emphasize my 3-day turnaround, and ask if they prefer a WhatsApp demo.'"
                    className="w-full bg-white border border-indigo-200/90 rounded-lg p-2.5 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => generateAiEmail(strategy, tone, selectedOpening, selectedPoints, userInstructions)}
                    disabled={generating}
                    className="mt-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition flex items-center gap-1.5 shadow-xs float-right"
                  >
                    {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 text-amber-300" />}
                    Regenerate Draft with AI Instructions
                  </button>
                  <div className="clear-both"></div>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Quick Prompts:</span>
                  {[
                    "Offer 20% local discount",
                    "Emphasize 3-day React upgrade speed",
                    "Include WhatsApp video walkthrough offer",
                    "Keep under 100 words"
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        const newInst = userInstructions ? `${userInstructions}. ${preset}` : preset;
                        setUserInstructions(newInst);
                        generateAiEmail(strategy, tone, selectedOpening, selectedPoints, newInst);
                      }}
                      className="px-2 py-0.5 bg-white border border-slate-200 hover:border-indigo-400 text-slate-700 text-[10px] font-bold rounded-md transition"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Active AI Customizations Banner */}
            {(selectedOpening || selectedPoints.length > 0) && (
              <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3 mb-4 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-indigo-900 font-bold">
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-indigo-600" /> Active AI Personalization Layer
                  </span>
                  <button
                    onClick={() => {
                      setSelectedOpening('');
                      setSelectedPoints([]);
                      generateAiEmail(strategy, tone, '', []);
                    }}
                    className="text-[11px] text-indigo-600 hover:underline font-normal"
                  >
                    Clear Personalizations
                  </button>
                </div>
                {selectedOpening && (
                  <p className="text-slate-700 line-clamp-1">
                    <span className="font-semibold text-slate-900">Custom Opening:</span> "{selectedOpening}"
                  </p>
                )}
                {selectedPoints.length > 0 && (
                  <p className="text-slate-700">
                    <span className="font-semibold text-slate-900">Talking Points ({selectedPoints.length}):</span>{' '}
                    {selectedPoints.join(' • ')}
                  </p>
                )}
              </div>
            )}

            {/* Email Subject & Body Inputs */}
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">Subject Line</label>
                  <button
                    onClick={() => generateAiEmail(strategy, tone, selectedOpening, selectedPoints)}
                    disabled={generating}
                    className="text-indigo-600 hover:text-indigo-800 text-[11px] font-bold flex items-center gap-1"
                  >
                    {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    Re-generate
                  </button>
                </div>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">Email Body</label>
                  <label className="cursor-pointer text-indigo-600 hover:text-indigo-800 text-[11px] font-bold flex items-center gap-1">
                    + Attach GoFullPage Screenshot
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleModalFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={8}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-slate-800 font-sans leading-relaxed focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />

                {/* Auto-attach Website Audit Snapshot Checkbox */}
                {lead.auditScreenshotUrl && (
                  <div className="mt-2.5 p-3 bg-indigo-50/80 border border-indigo-200 rounded-xl flex items-center justify-between">
                    <label className="cursor-pointer flex items-center gap-2 text-xs font-bold text-indigo-950">
                      <input
                        type="checkbox"
                        checked={autoAttachSnapshot}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setAutoAttachSnapshot(checked);
                          if (checked) {
                            setUploadedScreenshots((prev) => [
                              ...prev.filter((img) => !img.id.startsWith('audit-')),
                              {
                                id: `audit-${lead.id}`,
                                name: lead.auditScreenshotName || `${lead.businessName}_Website_Audit.png`,
                                url: lead.auditScreenshotUrl!,
                              },
                            ]);
                          } else {
                            setUploadedScreenshots((prev) => prev.filter((img) => !img.id.startsWith('audit-')));
                          }
                        }}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                      />
                      <span>📸 Automatically attach Website Audit Snapshot to outreach email</span>
                    </label>
                    <span className="text-[10px] bg-indigo-200 text-indigo-800 font-bold px-2 py-0.5 rounded">
                      PNG Image Ready
                    </span>
                  </div>
                )}

                {uploadedScreenshots.length > 0 && (
                  <div className="mt-2.5 p-2 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap gap-2">
                    {uploadedScreenshots.map((img) => (
                      <div
                        key={img.id}
                        className="relative border border-slate-200 rounded bg-white p-1 flex items-center gap-2 max-w-[220px]"
                      >
                        <img src={img.url} alt={img.name} className="w-8 h-8 object-cover rounded border" />
                        <span className="text-[10px] font-semibold text-slate-700 truncate flex-1">
                          {img.name}
                        </span>
                        <button
                          onClick={() => removeModalScreenshot(img.id)}
                          className="text-slate-400 hover:text-red-600 text-xs font-bold p-1"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: AI PERSONALIZED OPENINGS */}
        {activeTab === 'openings' && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between bg-amber-50 border border-amber-200 p-3 rounded-xl">
              <div>
                <h3 className="font-bold text-amber-900 text-sm">
                  Personalized AI Openings & Icebreakers
                </h3>
                <p className="text-amber-700 text-xs mt-0.5">
                  AI tailored specifically to <span className="font-semibold">{lead.businessName}</span>'s industry ({lead.industry}) and website data.
                </p>
              </div>
              <button
                onClick={fetchPersonalizedOpenings}
                disabled={loadingOpenings}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition inline-flex items-center gap-1.5"
              >
                {loadingOpenings ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Refresh AI Openings
              </button>
            </div>

            {loadingOpenings ? (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
                <p>Analyzing {lead.website} and generating tailored openings...</p>
              </div>
            ) : openings.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500">
                No openings generated yet. Click "Refresh AI Openings" above!
              </div>
            ) : (
              <div className="space-y-3">
                {openings.map((op, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-slate-50 border border-slate-200 hover:border-indigo-300 rounded-xl transition space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold text-[10px] rounded uppercase tracking-wider">
                        {op.style}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedOpening(op.text);
                            generateAiEmail(strategy, tone, op.text, selectedPoints);
                            setActiveTab('editor');
                          }}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] rounded transition inline-flex items-center gap-1"
                        >
                          Use in Full Email <ChevronRight className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => insertOpeningIntoBody(op.text)}
                          className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-[11px] rounded transition"
                        >
                          Insert Into Text
                        </button>
                      </div>
                    </div>
                    <p className="text-slate-800 font-medium leading-relaxed italic">
                      "{op.text}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: TALKING POINTS */}
        {activeTab === 'talkingPoints' && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
              <div>
                <h3 className="font-bold text-emerald-900 text-sm">
                  Strategic Pitch Talking Points
                </h3>
                <p className="text-emerald-700 text-xs mt-0.5">
                  Select talking points based on <span className="font-semibold">{lead.businessName}</span>'s website audit ({lead.auditIssue || lead.websiteStatus}).
                </p>
              </div>
              <button
                onClick={fetchTalkingPoints}
                disabled={loadingPoints}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition inline-flex items-center gap-1.5"
              >
                {loadingPoints ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Generate Points
              </button>
            </div>

            {loadingPoints ? (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600" />
                <p>Generating high-impact talking points for {lead.industry}...</p>
              </div>
            ) : talkingPoints.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500">
                Click "Generate Points" to load AI suggestions tailored to {lead.businessName}.
              </div>
            ) : (
              <div className="space-y-3">
                {talkingPoints.map((tp, idx) => {
                  const isSelected = selectedPoints.includes(tp.point);
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleTalkingPointSelection(tp.point)}
                      className={`p-4 rounded-xl border cursor-pointer transition space-y-1.5 ${
                        isSelected
                          ? 'bg-emerald-50/80 border-emerald-400 ring-1 ring-emerald-400'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="rounded text-emerald-600 focus:ring-emerald-500"
                          />
                          {tp.title}
                        </span>
                        <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold">
                          {tp.benefit}
                        </span>
                      </div>
                      <p className="text-slate-700 text-xs pl-6">{tp.point}</p>
                    </div>
                  );
                })}

                {selectedPoints.length > 0 && (
                  <div className="pt-2 flex gap-2">
                    <button
                      onClick={() => {
                        generateAiEmail(strategy, tone, selectedOpening, selectedPoints);
                        setActiveTab('editor');
                      }}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition inline-flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Re-build Email with Selected Points ({selectedPoints.length})
                    </button>
                    <button
                      onClick={appendTalkingPointsToBody}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-lg transition"
                    >
                      Append Bullet Points
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* SCHEDULING INTERFACE WHEN SCHEDULE MODE IS TOGGLED */}
        {isScheduling && (
          <div className="mt-4 p-4 bg-indigo-50/90 border border-indigo-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between text-indigo-900 font-bold text-xs">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-600" /> Schedule Outreach Date & Time
              </span>
              <span className="text-[11px] text-indigo-700 font-medium">
                Auto-added to 'Scheduled Emails' queue
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <input
                type="datetime-local"
                value={scheduledDateTime}
                onChange={(e) => setScheduledDateTime(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-3 py-2 font-bold text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none flex-1"
              />

              <div className="flex gap-1.5 text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setQuickSchedule(1, 9)}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded text-slate-700 transition"
                >
                  Tomorrow 9 AM
                </button>
                <button
                  type="button"
                  onClick={() => setQuickSchedule(2, 10)}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded text-slate-700 transition"
                >
                  In 2 Days
                </button>
                <button
                  type="button"
                  onClick={() => setQuickSchedule(3, 9)}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded text-slate-700 transition"
                >
                  In 3 Days
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Actions Footer */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pt-4 border-t border-slate-200 mt-5 gap-3">
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition inline-flex items-center gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" /> Copied Text
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" /> Copy Email
                </>
              )}
            </button>

            <button
              onClick={handleMailtoDispatch}
              title="Open directly in your Gmail / local mail client so the client replies directly to your inbox!"
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-lg transition inline-flex items-center gap-1.5 shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Send via My Gmail ({profile.email})
            </button>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition"
            >
              Cancel
            </button>

            {isScheduling ? (
              <button
                onClick={handleScheduleSubmit}
                disabled={!scheduledDateTime}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-sm transition inline-flex items-center gap-1.5"
              >
                <Calendar className="w-4 h-4" /> Save Schedule ({scheduledDateTime ? new Date(scheduledDateTime).toLocaleDateString() : ''})
              </button>
            ) : (
              <button
                onClick={handleSendNowAndLog}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-sm transition inline-flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" /> Log & Mark Sent
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
