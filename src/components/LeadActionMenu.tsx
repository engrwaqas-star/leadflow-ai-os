import React, { useState, useRef, useEffect } from 'react';
import { 
  MoreVertical, 
  Eye, 
  Edit3, 
  Search, 
  Send, 
  Columns, 
  CheckSquare, 
  Archive, 
  EyeOff, 
  Trash2, 
  Star,
  X,
  History
} from 'lucide-react';
import { Lead, CleanupReason } from '../types';

interface LeadActionMenuProps {
  lead: Lead;
  onViewDetails?: (lead: Lead) => void;
  onEdit?: (lead: Lead) => void;
  onAudit?: (lead: Lead) => void;
  onGenerateOutreach?: (lead: Lead) => void;
  onAddToPipeline?: (lead: Lead) => void;
  onToggleShortlist?: (lead: Lead) => void;
  onArchive?: (lead: Lead, reason?: CleanupReason) => void;
  onSuppress?: (lead: Lead, reason?: CleanupReason) => void;
  onTrash?: (lead: Lead, reason?: CleanupReason) => void;
  onPermanentDelete?: (lead: Lead) => void;
  onRestore?: (lead: Lead) => void;
}

export const LeadActionMenu: React.FC<LeadActionMenuProps> = ({
  lead,
  onViewDetails,
  onEdit,
  onAudit,
  onGenerateOutreach,
  onAddToPipeline,
  onToggleShortlist,
  onArchive,
  onSuppress,
  onTrash,
  onPermanentDelete,
  onRestore,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        title="Actions"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-52 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl z-30 py-1.5 text-xs text-slate-200 divide-y divide-slate-800/80 animate-fadeIn">
          {/* Primary View & Edit */}
          <div className="py-1">
            {onViewDetails && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  onViewDetails(lead);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2 font-medium text-slate-200 transition"
              >
                <Eye className="w-3.5 h-3.5 text-indigo-400" /> View & Edit Details
              </button>
            )}

            {onAudit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  onAudit(lead);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2 font-medium text-slate-200 transition"
              >
                <Search className="w-3.5 h-3.5 text-amber-400" /> Run AI Audit
              </button>
            )}

            {onGenerateOutreach && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  onGenerateOutreach(lead);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2 font-medium text-slate-200 transition"
              >
                <Send className="w-3.5 h-3.5 text-emerald-400" /> Generate Outreach Email
              </button>
            )}

            {onAddToPipeline && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  onAddToPipeline(lead);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2 font-medium text-slate-200 transition"
              >
                <Columns className="w-3.5 h-3.5 text-blue-400" /> Add to CRM Pipeline
              </button>
            )}
          </div>

          {/* Restoration if trashed/archived */}
          {(lead.trashed || lead.archived || lead.suppressed) && onRestore && (
            <div className="py-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  onRestore(lead);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-emerald-950/40 text-emerald-300 font-bold flex items-center gap-2 transition"
              >
                <History className="w-3.5 h-3.5 text-emerald-400" /> Restore to Active
              </button>
            </div>
          )}

          {/* Data Cleanup Actions */}
          <div className="py-1">
            {!lead.archived && onArchive && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  onArchive(lead, 'Outdated');
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-800 text-amber-300 flex items-center gap-2 font-medium transition"
              >
                <Archive className="w-3.5 h-3.5 text-amber-400" /> Archive Lead
              </button>
            )}

            {!lead.suppressed && onSuppress && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  onSuppress(lead, 'Irrelevant');
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-800 text-purple-300 flex items-center gap-2 font-medium transition"
              >
                <EyeOff className="w-3.5 h-3.5 text-purple-400" /> Suppress (Do Not Show)
              </button>
            )}

            {!lead.trashed && onTrash && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  onTrash(lead, 'Irrelevant');
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-rose-950/40 text-rose-300 flex items-center gap-2 font-medium transition"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" /> Move to Trash
              </button>
            )}

            {onPermanentDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  onPermanentDelete(lead);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-rose-900/60 text-rose-200 font-extrabold flex items-center gap-2 transition"
              >
                <X className="w-3.5 h-3.5 text-rose-400" /> Delete Permanently
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
