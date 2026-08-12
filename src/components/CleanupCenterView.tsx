import React, { useState, useMemo } from 'react';
import { 
  Trash2, 
  Archive, 
  EyeOff, 
  Copy, 
  RotateCcw, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Layers, 
  Settings, 
  Search, 
  Database, 
  Users, 
  FileText,
  X,
  ArrowRight,
  Filter,
  RefreshCw,
  Info
} from 'lucide-react';
import { 
  Lead, 
  TrashItem, 
  SuppressedDomainRecord, 
  AutoCleanupSettings, 
  DuplicateGroup, 
  CleanupReason 
} from '../types';
import { ConfirmModal } from './ConfirmModal';

interface CleanupCenterViewProps {
  leads: Lead[];
  trashItems: TrashItem[];
  suppressedRecords: SuppressedDomainRecord[];
  autoCleanupSettings: AutoCleanupSettings;
  onUpdateLeads: (leads: Lead[]) => void;
  onRestoreTrashItem: (id: string) => void;
  onPermanentlyDeleteTrashItem: (id: string) => void;
  onEmptyTrash: () => void;
  onUnsuppressRecord: (id: string) => void;
  onDeleteAllDemoData: () => void;
  onUpdateAutoCleanupSettings: (settings: AutoCleanupSettings) => void;
  onShowToast: (message: string, undoAction?: () => void) => void;
}

export const CleanupCenterView: React.FC<CleanupCenterViewProps> = ({
  leads,
  trashItems,
  suppressedRecords,
  autoCleanupSettings,
  onUpdateLeads,
  onRestoreTrashItem,
  onPermanentlyDeleteTrashItem,
  onEmptyTrash,
  onUnsuppressRecord,
  onDeleteAllDemoData,
  onUpdateAutoCleanupSettings,
  onShowToast,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'duplicates' | 'trash' | 'suppressed' | 'demo' | 'auto_rules'>('overview');
  
  // Modal states
  const [confirmModalState, setConfirmModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => void;
    type?: 'danger' | 'warning' | 'archive' | 'suppress';
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: () => {},
  });

  const [selectedMergeGroup, setSelectedMergeGroup] = useState<DuplicateGroup | null>(null);

  // Filtered Lists
  const activeLeads = useMemo(() => leads.filter(l => !l.archived && !l.suppressed && !l.trashed), [leads]);
  const archivedLeads = useMemo(() => leads.filter(l => l.archived && !l.trashed), [leads]);
  const suppressedLeads = useMemo(() => leads.filter(l => l.suppressed && !l.trashed), [leads]);
  const demoLeads = useMemo(() => leads.filter(l => l.isDemo || l.id.startsWith('lead-')), [leads]);

  // Duplicate Detection Algorithm
  const duplicateGroups = useMemo<DuplicateGroup[]>(() => {
    const groups: DuplicateGroup[] = [];
    const domainMap = new Map<string, Lead[]>();
    const nameMap = new Map<string, Lead[]>();

    leads.filter(l => !l.trashed).forEach(lead => {
      // Clean domain
      const cleanDomain = lead.website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].toLowerCase().trim();
      if (cleanDomain && cleanDomain.length > 3) {
        if (!domainMap.has(cleanDomain)) domainMap.set(cleanDomain, []);
        domainMap.get(cleanDomain)!.push(lead);
      }

      // Clean name
      const cleanName = lead.businessName.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanName && cleanName.length > 3) {
        if (!nameMap.has(cleanName)) nameMap.set(cleanName, []);
        nameMap.get(cleanName)!.push(lead);
      }
    });

    let gIdx = 1;
    domainMap.forEach((matchedLeads, domain) => {
      if (matchedLeads.length > 1) {
        groups.push({
          id: `dup-domain-${gIdx++}`,
          matchType: 'domain',
          matchValue: domain,
          leads: matchedLeads,
        });
      }
    });

    nameMap.forEach((matchedLeads, name) => {
      if (matchedLeads.length > 1) {
        // avoid double counting if already added by domain
        const leadIds = matchedLeads.map(l => l.id).sort().join(',');
        const exists = groups.some(g => g.leads.map(l => l.id).sort().join(',') === leadIds);
        if (!exists) {
          groups.push({
            id: `dup-name-${gIdx++}`,
            matchType: 'businessName',
            matchValue: matchedLeads[0].businessName,
            leads: matchedLeads,
          });
        }
      }
    });

    return groups;
  }, [leads]);

  // Health Score Calculation
  const healthScore = useMemo(() => {
    let score = 100;
    if (duplicateGroups.length > 0) score -= Math.min(25, duplicateGroups.length * 5);
    if (trashItems.length > 10) score -= 10;
    if (demoLeads.length > 0 && activeLeads.length > 20) score -= 10;
    
    const missingContactCount = activeLeads.filter(l => !l.email && !l.phone).length;
    if (missingContactCount > 0) score -= Math.min(20, missingContactCount * 3);

    return Math.max(10, Math.min(100, score));
  }, [duplicateGroups, trashItems, demoLeads, activeLeads]);

  // Merge Handler
  const handleExecuteMerge = (primaryLeadId: string, secondaryLeadId: string) => {
    const primary = leads.find(l => l.id === primaryLeadId);
    const secondary = leads.find(l => l.id === secondaryLeadId);
    if (!primary || !secondary) return;

    // Combine merged fields without losing data
    const mergedLead: Lead = {
      ...primary,
      contactPerson: primary.contactPerson || secondary.contactPerson,
      email: primary.email || secondary.email,
      phone: primary.phone || secondary.phone,
      address: primary.address || secondary.address,
      notes: [primary.notes, secondary.notes, `[Merged Record from ${secondary.businessName} on ${new Date().toLocaleDateString()}]`]
        .filter(Boolean)
        .join('\n---\n'),
      auditIssue: primary.auditIssue || secondary.auditIssue,
      pitchHook: primary.pitchHook || secondary.pitchHook,
      suggestedService: primary.suggestedService || secondary.suggestedService,
      score: Math.max(primary.score, secondary.score),
    };

    const previousLeads = [...leads];
    const updated = leads
      .map(l => l.id === primaryLeadId ? mergedLead : l)
      .filter(l => l.id !== secondaryLeadId);

    onUpdateLeads(updated);
    setSelectedMergeGroup(null);

    onShowToast(`Merged duplicate records into ${primary.businessName}`, () => {
      onUpdateLeads(previousLeads);
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-xl">
              <Trash2 className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black text-white tracking-tight">Data Cleanup & Hygiene Center</h1>
          </div>
          <p className="text-xs text-slate-400">
            Maintain pristine database quality. Archive, suppress, clean duplicates, and purge trash safely.
          </p>
        </div>

        {/* Data Health Score Badge */}
        <div className="flex items-center gap-4 bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
          <div className="text-right space-y-0.5">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Database Health</div>
            <div className={`text-2xl font-black ${healthScore >= 80 ? 'text-emerald-400' : healthScore >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>
              {healthScore}/100
            </div>
          </div>
          <div className="w-12 h-12 rounded-full border-4 border-slate-800 flex items-center justify-center relative">
            <Sparkles className={`w-5 h-5 ${healthScore >= 80 ? 'text-emerald-400' : 'text-amber-400'}`} />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Active Records</span>
          <div className="text-xl font-black text-emerald-400">{activeLeads.length}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Archived</span>
          <div className="text-xl font-black text-amber-400">{archivedLeads.length}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Suppressed</span>
          <div className="text-xl font-black text-purple-400">{suppressedLeads.length + suppressedRecords.length}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Demo / Test</span>
          <div className="text-xl font-black text-blue-400">{demoLeads.length}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Duplicates</span>
          <div className="text-xl font-black text-rose-400">{duplicateGroups.length}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Trash Bin</span>
          <div className="text-xl font-black text-slate-400">{trashItems.length}</div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeSubTab === 'overview' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" /> Hygiene Overview
        </button>
        <button
          onClick={() => setActiveSubTab('duplicates')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 relative ${
            activeSubTab === 'duplicates' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Copy className="w-3.5 h-3.5" /> Duplicate Manager
          {duplicateGroups.length > 0 && (
            <span className="px-1.5 py-0.2 bg-rose-500 text-white text-[9px] font-black rounded-full">
              {duplicateGroups.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveSubTab('trash')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeSubTab === 'trash' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Trash2 className="w-3.5 h-3.5" /> Trash & Recycle Bin ({trashItems.length})
        </button>
        <button
          onClick={() => setActiveSubTab('suppressed')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeSubTab === 'suppressed' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <EyeOff className="w-3.5 h-3.5" /> Suppressed Blacklist ({suppressedLeads.length + suppressedRecords.length})
        </button>
        <button
          onClick={() => setActiveSubTab('demo')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeSubTab === 'demo' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Database className="w-3.5 h-3.5" /> Demo Data Purge
        </button>
        <button
          onClick={() => setActiveSubTab('auto_rules')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeSubTab === 'auto_rules' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Settings className="w-3.5 h-3.5" /> Auto-Cleanup Rules
        </button>
      </div>

      {/* Sub-Tab 1: Overview & Quick Actions */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Action Cards */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
              <div className="flex items-center gap-2">
                <Copy className="w-4 h-4 text-rose-400" />
                <h3 className="font-extrabold text-sm text-white">Duplicate Resolution</h3>
              </div>
              <p className="text-xs text-slate-300">
                {duplicateGroups.length > 0 
                  ? `Found ${duplicateGroups.length} candidate groups with matching websites or company names.`
                  : 'No duplicate records detected. Your database is clean!'}
              </p>
              {duplicateGroups.length > 0 && (
                <button
                  onClick={() => setActiveSubTab('duplicates')}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                >
                  Review Duplicates <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-amber-400" />
                <h3 className="font-extrabold text-sm text-white">Empty Trash Bin</h3>
              </div>
              <p className="text-xs text-slate-300">
                {trashItems.length > 0
                  ? `${trashItems.length} items currently stored in soft-deleted Trash.`
                  : 'Trash bin is empty.'}
              </p>
              {trashItems.length > 0 && (
                <button
                  onClick={() => {
                    setConfirmModalState({
                      isOpen: true,
                      title: 'Empty Trash Bin Permanently?',
                      message: `Permanently delete all ${trashItems.length} items from the trash bin? This action cannot be undone.`,
                      action: onEmptyTrash,
                      type: 'danger',
                    });
                  }}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                >
                  Empty Trash ({trashItems.length})
                </button>
              )}
            </div>
          </div>

          {/* Data Health Diagnostics List */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Health Diagnostics Checklist
            </h3>

            <div className="divide-y divide-slate-800 text-xs">
              <div className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-200">Duplicate Check</div>
                  <div className="text-slate-400 text-[11px]">{duplicateGroups.length} duplicate groups detected</div>
                </div>
                <button 
                  onClick={() => setActiveSubTab('duplicates')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg"
                >
                  Inspect
                </button>
              </div>

              <div className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-200">Demo Data Isolation</div>
                  <div className="text-slate-400 text-[11px]">{demoLeads.length} sample/demo records loaded</div>
                </div>
                <button 
                  onClick={() => setActiveSubTab('demo')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg"
                >
                  Manage Demo Data
                </button>
              </div>

              <div className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-200">Suppression Blacklist</div>
                  <div className="text-slate-400 text-[11px]">{suppressedLeads.length + suppressedRecords.length} domains excluded from search</div>
                </div>
                <button 
                  onClick={() => setActiveSubTab('suppressed')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg"
                >
                  View Suppressed
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Duplicates Manager */}
      {activeSubTab === 'duplicates' && (
        <div className="space-y-4 animate-fadeIn">
          {duplicateGroups.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 p-12 text-center rounded-2xl space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h3 className="font-extrabold text-base text-white">No Duplicate Records Found</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                LeadFlow automatically checks website domains and company names to prevent duplicate entry.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Found {duplicateGroups.length} candidate duplicate groups. Merge records without losing contact history or notes.
              </p>

              {duplicateGroups.map((group) => (
                <div key={group.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-black rounded uppercase">
                        Matched by {group.matchType}
                      </span>
                      <span className="font-extrabold text-sm text-white">{group.matchValue}</span>
                    </div>

                    <button
                      onClick={() => setSelectedMergeGroup(group)}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                    >
                      Compare & Merge <Layers className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {group.leads.map((lead, idx) => (
                      <div key={lead.id} className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-white">{lead.businessName}</span>
                          <span className="text-[10px] text-slate-400">ID: {lead.id}</span>
                        </div>
                        <div className="text-slate-300">Contact: {lead.contactPerson || 'N/A'} ({lead.email || 'No Email'})</div>
                        <div className="text-slate-400 truncate">Website: {lead.website}</div>
                        <div className="text-slate-400">Created: {lead.createdAt}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Merge Modal */}
      {selectedMergeGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl p-6 shadow-2xl space-y-5 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                <h3 className="font-extrabold text-base text-white">Side-by-Side Merge Records</h3>
              </div>
              <button
                onClick={() => setSelectedMergeGroup(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Select the primary record to keep. Notes, pitch hooks, and contact history from both records will automatically combine into the primary record.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedMergeGroup.leads.map((lead, idx) => (
                <div key={lead.id} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm text-white">Record #{idx + 1}</span>
                    <button
                      onClick={() => {
                        const secondary = selectedMergeGroup.leads.find(l => l.id !== lead.id);
                        if (secondary) handleExecuteMerge(lead.id, secondary.id);
                      }}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition"
                    >
                      Set Primary & Merge
                    </button>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div><span className="text-slate-400 font-bold">Business:</span> {lead.businessName}</div>
                    <div><span className="text-slate-400 font-bold">Contact:</span> {lead.contactPerson || 'N/A'}</div>
                    <div><span className="text-slate-400 font-bold">Email:</span> {lead.email || 'N/A'}</div>
                    <div><span className="text-slate-400 font-bold">Website:</span> {lead.website}</div>
                    <div><span className="text-slate-400 font-bold">Score:</span> {lead.score}/100</div>
                    <div className="truncate"><span className="text-slate-400 font-bold">Issue:</span> {lead.auditIssue}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 3: Trash & Recycle Bin */}
      {activeSubTab === 'trash' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Soft-deleted records are held here before permanent deletion. You can restore items anytime.
            </p>

            {trashItems.length > 0 && (
              <button
                onClick={() => {
                  setConfirmModalState({
                    isOpen: true,
                    title: 'Empty Trash Bin Permanently?',
                    message: `Permanently delete all ${trashItems.length} items from the trash bin? This action cannot be undone.`,
                    action: onEmptyTrash,
                    type: 'danger',
                  });
                }}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-md"
              >
                <Trash2 className="w-3.5 h-3.5" /> Empty Trash
              </button>
            )}
          </div>

          {trashItems.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 p-12 text-center rounded-2xl space-y-3">
              <Trash2 className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="font-extrabold text-base text-white">Trash Bin is Empty</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Items deleted from active views will appear here safely before permanent removal.
              </p>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800 text-xs">
              {trashItems.map((item) => (
                <div key={item.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-800/40 transition">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-300 font-bold text-[10px] rounded uppercase">
                        {item.originalType}
                      </span>
                      <span className="font-extrabold text-white text-sm">{item.title}</span>
                    </div>
                    <div className="text-slate-400">{item.description}</div>
                    <div className="text-[10px] text-slate-500">Deleted on: {item.deletedAt} • Reason: {item.reason || 'Manual deletion'}</div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onRestoreTrashItem(item.id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" /> Restore
                    </button>

                    <button
                      onClick={() => onPermanentlyDeleteTrashItem(item.id)}
                      className="px-3 py-1.5 bg-rose-950 hover:bg-rose-900 text-rose-300 font-bold rounded-lg transition flex items-center gap-1 border border-rose-800/50"
                    >
                      <X className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sub-Tab 4: Suppressed Blacklist */}
      {activeSubTab === 'suppressed' && (
        <div className="space-y-4 animate-fadeIn">
          <p className="text-xs text-slate-400">
            Suppressed businesses and domains are prevented from appearing in future search results, lead discovery, or Agent Kashi recommendations.
          </p>

          {suppressedLeads.length === 0 && suppressedRecords.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 p-12 text-center rounded-2xl space-y-3">
              <EyeOff className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="font-extrabold text-base text-white">No Suppressed Domains</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                When you suppress an irrelevant business, it is safely stored here to keep future search results relevant.
              </p>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800 text-xs">
              {suppressedLeads.map((lead) => (
                <div key={lead.id} className="p-4 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-white text-sm">{lead.businessName}</span>
                      <span className="text-slate-400">({lead.website})</span>
                    </div>
                    <div className="text-purple-300 font-medium">Reason: {lead.suppressReason || 'Irrelevant Business'}</div>
                  </div>

                  <button
                    onClick={() => {
                      const previous = [...leads];
                      const updated = leads.map(l => l.id === lead.id ? { ...l, suppressed: false, recordStatus: 'active' as const } : l);
                      onUpdateLeads(updated);
                      onShowToast(`Unsuppressed ${lead.businessName}`, () => onUpdateLeads(previous));
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg transition"
                  >
                    Unsuppress Lead
                  </button>
                </div>
              ))}

              {suppressedRecords.map((rec) => (
                <div key={rec.id} className="p-4 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="font-extrabold text-white text-sm">{rec.domainOrEmail}</div>
                    <div className="text-purple-300 font-medium">Reason: {rec.reason} • Added: {rec.suppressedAt}</div>
                  </div>

                  <button
                    onClick={() => onUnsuppressRecord(rec.id)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg transition"
                  >
                    Remove Blacklist
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sub-Tab 5: Demo Data Purge */}
      {activeSubTab === 'demo' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-400" />
              <h3 className="font-extrabold text-base text-white">Demo & Sample Data Isolation</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Your database currently contains {demoLeads.length} sample/demo records designed for testing. You can safely purge all demo records to work exclusively with real verified prospects.
            </p>

            <button
              onClick={() => {
                setConfirmModalState({
                  isOpen: true,
                  title: 'Delete All Demo Records?',
                  message: `Permanently purge all ${demoLeads.length} sample records from the workspace? Verified custom leads will remain unaffected.`,
                  action: onDeleteAllDemoData,
                  type: 'danger',
                });
              }}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl transition flex items-center gap-2 shadow-lg shadow-rose-600/20"
            >
              <Trash2 className="w-4 h-4" /> DELETE ALL DEMO DATA ({demoLeads.length} Records)
            </button>
          </div>
        </div>
      )}

      {/* Sub-Tab 6: Auto-Cleanup Rules */}
      {activeSubTab === 'auto_rules' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="font-extrabold text-base text-white">Automated Background Hygiene Rules</h3>
                <p className="text-xs text-slate-400">Rules are OFF by default. Business history and won clients are never auto-deleted.</p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoCleanupSettings.enabled}
                  onChange={(e) => onUpdateAutoCleanupSettings({ ...autoCleanupSettings, enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 bg-slate-950 border border-slate-800/80 rounded-xl">
                <div>
                  <div className="font-bold text-white">Remove Old Test Records</div>
                  <div className="text-slate-400 text-[11px]">Automatically move temporary test records to trash</div>
                </div>
                <select
                  disabled={!autoCleanupSettings.enabled}
                  value={autoCleanupSettings.autoRemoveTestDays}
                  onChange={(e) => onUpdateAutoCleanupSettings({ ...autoCleanupSettings, autoRemoveTestDays: Number(e.target.value) })}
                  className="bg-slate-900 border border-slate-800 text-slate-200 font-bold px-3 py-1.5 rounded-lg disabled:opacity-50"
                >
                  <option value={0}>Never (Off)</option>
                  <option value={7}>After 7 Days</option>
                  <option value={30}>After 30 Days</option>
                  <option value={90}>After 90 Days</option>
                </select>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 bg-slate-950 border border-slate-800/80 rounded-xl">
                <div>
                  <div className="font-bold text-white">Archive Inactive Leads</div>
                  <div className="text-slate-400 text-[11px]">Move untouched leads without response into archive view</div>
                </div>
                <select
                  disabled={!autoCleanupSettings.enabled}
                  value={autoCleanupSettings.autoArchiveInactiveDays}
                  onChange={(e) => onUpdateAutoCleanupSettings({ ...autoCleanupSettings, autoArchiveInactiveDays: Number(e.target.value) })}
                  className="bg-slate-900 border border-slate-800 text-slate-200 font-bold px-3 py-1.5 rounded-lg disabled:opacity-50"
                >
                  <option value={0}>Never (Off)</option>
                  <option value={30}>After 30 Days</option>
                  <option value={60}>After 60 Days</option>
                  <option value={90}>After 90 Days</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModalState.isOpen}
        onClose={() => setConfirmModalState(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModalState.action}
        title={confirmModalState.title}
        message={confirmModalState.message}
        type={confirmModalState.type}
        confirmText="Proceed"
      />
    </div>
  );
};
