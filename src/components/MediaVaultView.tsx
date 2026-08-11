import React, { useState } from 'react';
import { 
  Folder, 
  Video, 
  Image as ImageIcon, 
  Download, 
  Share2, 
  ExternalLink, 
  Search, 
  Check, 
  Trash2, 
  Play, 
  Sparkles, 
  Eye, 
  FileText,
  Clock,
  Building2,
  FolderOpen,
  ZoomIn,
  RefreshCw,
  Maximize2,
  X,
  CheckCircle2
} from 'lucide-react';
import { Lead } from '../types';

interface MediaVaultViewProps {
  leads: Lead[];
  onOpenAudit: (lead: Lead) => void;
  onOpenEmail: (lead: Lead) => void;
}

export const MediaVaultView: React.FC<MediaVaultViewProps> = ({
  leads,
  onOpenAudit,
  onOpenEmail,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(leads[0]?.id || null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [activeMediaPreview, setActiveMediaPreview] = useState<{ type: 'image' | 'video'; url: string; title: string; subtitle?: string } | null>(null);

  const filteredLeads = leads.filter(lead => 
    lead.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.industry.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedLead = leads.find(l => l.id === selectedFolderId) || leads[0];

  const handleCopyShareLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(id);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FolderOpen className="w-6 h-6 text-indigo-400" />
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold text-xs rounded-full">
                Audit Media Storage Vault
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Client Audit Media & Folder Vault
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Organized folder storage for 40-second AI video audit walkthroughs, GoFullPage website screenshots, and Before/After client proof deliverables.
            </p>
          </div>

          {selectedLead && (
            <button
              onClick={() => onOpenAudit(selectedLead)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-2 shrink-0"
            >
              <Video className="w-4 h-4 text-amber-300" /> Record 40s Video Walkthrough
            </button>
          )}
        </div>
      </div>

      {/* Main Folder Explorer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Client Folders Navigation List */}
        <div className="lg:col-span-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search folders by business..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
            {filteredLeads.map((lead) => {
              const isSelected = lead.id === selectedFolderId;
              const hasScreenshot = Boolean(lead.auditScreenshotUrl);
              const hasVideo = Boolean(lead.auditVideoUrl);

              return (
                <button
                  key={lead.id}
                  onClick={() => setSelectedFolderId(lead.id)}
                  className={`w-full p-3 rounded-xl border transition text-left flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-indigo-50/90 border-indigo-400 shadow-xs'
                      : 'bg-white border-slate-200/80 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <Folder className={`w-5 h-5 shrink-0 ${isSelected ? 'text-indigo-600 fill-indigo-100' : 'text-slate-400'}`} />
                    <div className="truncate">
                      <div className={`text-xs font-bold truncate ${isSelected ? 'text-indigo-950' : 'text-slate-900'}`}>
                        {lead.businessName}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {lead.industry} • {lead.city || lead.country}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {hasScreenshot && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500" title="Has Screenshot" />
                    )}
                    {hasVideo && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600" title="Has 40s Video" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Folder Content & Media Viewer */}
        <div className="lg:col-span-8 space-y-6">
          {selectedLead ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              {/* Folder Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-5 h-5 text-indigo-600" />
                    <h2 className="text-xl font-extrabold text-slate-900">{selectedLead.businessName} Media Folder</h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Client Contact: <strong className="text-slate-800">{selectedLead.contactPerson}</strong> ({selectedLead.email})
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpenAudit(selectedLead)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-lg transition flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Open Audit Engine
                  </button>
                  <button
                    onClick={() => onOpenEmail(selectedLead)}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition flex items-center gap-1.5 shadow-xs"
                  >
                    Send Email Pitch
                  </button>
                </div>
              </div>

              {/* Folder Files List */}
              <div className="space-y-4">
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-600">
                  Folder Contents ({selectedLead.auditScreenshotUrl ? 1 : 0} Screenshots, {selectedLead.auditVideoUrl ? 1 : 0} Video Walkthroughs)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* File Item 1: 40s Video Walkthrough */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 text-[10px] font-extrabold rounded-md flex items-center gap-1">
                        <Video className="w-3 h-3 text-indigo-600" /> 40s Video Walkthrough
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">40 seconds MP4</span>
                    </div>

                    <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span className="truncate">
                        {selectedLead.auditVideoName || `${selectedLead.businessName.replace(/\s+/g, '_')}_40s_Audit_Walkthrough.mp4`}
                      </span>
                    </div>

                    {selectedLead.auditVideoUrl ? (
                      <div className="space-y-2">
                        <div className="relative rounded-xl overflow-hidden bg-slate-900 aspect-video flex items-center justify-center border border-slate-300 group">
                          <img 
                            src={selectedLead.auditVideoUrl} 
                            alt="40s Video Walkthrough Preview" 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                            <button
                              onClick={() => setActiveMediaPreview({
                                type: 'video',
                                url: selectedLead.auditVideoUrl!,
                                title: `40s Audit Video - ${selectedLead.businessName}`,
                                subtitle: `Target Domain: ${selectedLead.website}`
                              })}
                              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-lg transition flex items-center gap-1 shadow-md"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" /> Inspect HD Video
                            </button>
                            <button
                              onClick={() => onOpenAudit(selectedLead)}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg border border-slate-700 transition flex items-center gap-1"
                            >
                              <RefreshCw className="w-3 h-3 text-amber-400" /> Re-record
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => handleCopyShareLink(selectedLead.auditVideoUrl!, `vid-${selectedLead.id}`)}
                            className="flex-1 py-1.5 bg-white border border-slate-300 hover:border-indigo-400 text-slate-800 font-bold text-xs rounded-lg transition flex items-center justify-center gap-1 shadow-2xs"
                          >
                            {copiedLink === `vid-${selectedLead.id}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-indigo-600" />}
                            {copiedLink === `vid-${selectedLead.id}` ? 'Link Copied!' : 'Copy Client Video Link'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="py-6 bg-white border border-dashed border-slate-300 rounded-xl text-center space-y-2 p-3">
                        <Video className="w-6 h-6 text-slate-400 mx-auto" />
                        <p className="text-xs text-slate-500 font-medium">No 40s video walkthrough recorded yet.</p>
                        <button
                          onClick={() => onOpenAudit(selectedLead)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition inline-flex items-center gap-1"
                        >
                          Record 40s Video Now
                        </button>
                      </div>
                    )}
                  </div>

                  {/* File Item 2: GoFullPage Website Screenshot */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-md flex items-center gap-1">
                        <ImageIcon className="w-3 h-3 text-emerald-600" /> Audit Screenshot PNG
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">1200 x 700 PNG</span>
                    </div>

                    <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="truncate">
                        {selectedLead.auditScreenshotName || `${selectedLead.businessName.replace(/\s+/g, '_')}_Audit.png`}
                      </span>
                    </div>

                    {selectedLead.auditScreenshotUrl ? (
                      <div className="space-y-2">
                        <div className="relative rounded-xl overflow-hidden bg-slate-900 aspect-video border border-slate-300 flex items-center justify-center group">
                          <img 
                            src={selectedLead.auditScreenshotUrl} 
                            alt="Website Audit Screenshot" 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              const cleanDomain = selectedLead.website.replace(/^https?:\/\//, '');
                              if (!target.src.includes('mshots')) {
                                target.src = `https://s0.wp.com/mshots/v1/https://${cleanDomain}?w=1200&h=800`;
                              }
                            }}
                          />
                          <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                            <button
                              onClick={() => setActiveMediaPreview({
                                type: 'image',
                                url: selectedLead.auditScreenshotUrl!,
                                title: `Full-Page HD Screenshot - ${selectedLead.businessName}`,
                                subtitle: `Target Domain: ${selectedLead.website}`
                              })}
                              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-lg transition flex items-center gap-1 shadow-md"
                            >
                              <ZoomIn className="w-3.5 h-3.5" /> Inspect Full HD
                            </button>
                            <button
                              onClick={() => onOpenAudit(selectedLead)}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg border border-slate-700 transition flex items-center gap-1"
                            >
                              <RefreshCw className="w-3 h-3 text-emerald-400" /> Recapture
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <a
                            href={selectedLead.auditScreenshotUrl}
                            download={`${selectedLead.businessName.replace(/\s+/g, '_')}_Audit.png`}
                            className="flex-1 py-1.5 bg-white border border-slate-300 hover:border-emerald-400 text-slate-800 font-bold text-xs rounded-lg transition flex items-center justify-center gap-1 shadow-2xs"
                          >
                            <Download className="w-3.5 h-3.5 text-emerald-600" /> Download PNG
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="py-6 bg-white border border-dashed border-slate-300 rounded-xl text-center space-y-2 p-3">
                        <ImageIcon className="w-6 h-6 text-slate-400 mx-auto" />
                        <p className="text-xs text-slate-500 font-medium">No screenshot captured yet.</p>
                        <button
                          onClick={() => onOpenAudit(selectedLead)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-lg transition inline-flex items-center gap-1"
                        >
                          Capture Screenshot
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Developer Inspection Remarks Section if set */}
              {selectedLead.developerNotes && (
                <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-1.5">
                  <div className="text-xs font-extrabold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-indigo-400" /> Full Stack Developer Technical Inspection Remarks
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed italic bg-slate-950 p-3 rounded-xl border border-slate-800">
                    "{selectedLead.developerNotes}"
                  </p>
                </div>
              )}

              {/* Client Visual Proof Deliverable Link Card */}
              <div className="p-4 bg-indigo-50/80 border border-indigo-200 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-indigo-900 tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Shareable Client Visual Audit Link
                  </span>
                  <p className="text-xs text-slate-700 font-semibold">
                    Send this link to <strong className="text-slate-900">{selectedLead.businessName}</strong> to let them view their website bottleneck audit and fixed solution proposal online.
                  </p>
                </div>

                <button
                  onClick={() => handleCopyShareLink(`${window.location.origin}?audit=${selectedLead.id}`, `audit-link-${selectedLead.id}`)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 shrink-0"
                >
                  {copiedLink === `audit-link-${selectedLead.id}` ? <Check className="w-4 h-4 text-emerald-300" /> : <Share2 className="w-4 h-4" />}
                  {copiedLink === `audit-link-${selectedLead.id}` ? 'Proof Link Copied!' : 'Copy Client Deliverable Link'}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
              Select a client folder from the list to view audit media files.
            </div>
          )}
        </div>
      </div>

      {/* Full-Screen Media Lightbox Modal */}
      {activeMediaPreview && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col shadow-2xl relative">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div>
                <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <Maximize2 className="w-3.5 h-3.5" /> High-Quality Media Inspection
                </div>
                <h3 className="text-base font-extrabold text-white mt-0.5">{activeMediaPreview.title}</h3>
                {activeMediaPreview.subtitle && (
                  <p className="text-xs text-slate-400">{activeMediaPreview.subtitle}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={activeMediaPreview.url}
                  download={`${selectedLead?.businessName || 'Media'}_Audit.${activeMediaPreview.type === 'video' ? 'mp4' : 'png'}`}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" /> Save File
                </a>
                <button
                  onClick={() => setActiveMediaPreview(null)}
                  className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 bg-slate-950 flex items-center justify-center min-h-[400px]">
              {activeMediaPreview.type === 'video' ? (
                <div className="w-full max-w-4xl space-y-3">
                  <div className="relative rounded-xl overflow-hidden border border-slate-800 shadow-2xl bg-black aspect-video flex items-center justify-center">
                    <img
                      src={activeMediaPreview.url}
                      alt="40s Video Inspection"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 gap-2">
                    <span className="flex items-center gap-2 font-bold text-emerald-400">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Quality Verified: 1080p Crisp Video Walkthrough
                    </span>
                    {selectedLead && (
                      <button
                        onClick={() => {
                          setActiveMediaPreview(null);
                          onOpenAudit(selectedLead);
                        }}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-lg transition flex items-center gap-1"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Re-record / Recapture in Audit Engine
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="w-full max-w-4xl space-y-3">
                  <div className="relative rounded-xl overflow-hidden border border-slate-800 shadow-2xl bg-black max-h-[70vh] flex items-center justify-center">
                    <img
                      src={activeMediaPreview.url}
                      alt="Screenshot Inspection"
                      className="w-full h-auto object-contain max-h-[70vh]"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 gap-2">
                    <span className="flex items-center gap-2 font-bold text-emerald-400">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Quality Verified: 1920x1080 High-Res Web Snapshot
                    </span>
                    {selectedLead && (
                      <button
                        onClick={() => {
                          setActiveMediaPreview(null);
                          onOpenAudit(selectedLead);
                        }}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition flex items-center gap-1"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Recapture HD PNG in Audit Engine
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
