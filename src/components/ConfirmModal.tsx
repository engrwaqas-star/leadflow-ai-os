import React, { useState } from 'react';
import { AlertTriangle, X, Trash2, ShieldAlert, Archive, EyeOff } from 'lucide-react';
import { CleanupReason } from '../types';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason?: CleanupReason) => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'archive' | 'suppress';
  requireReason?: boolean;
  itemCount?: number;
}

const CLEANUP_REASONS: CleanupReason[] = [
  'Irrelevant',
  'Duplicate',
  'Fake',
  'Outdated',
  'Wrong Location',
  'Wrong Industry',
  'No Response',
  'Not Interested',
  'Test Data',
  'Demo Data',
  'Bad Contact',
  'Bad Website',
  'Competitor',
  'Other',
];

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  requireReason = false,
  itemCount,
}) => {
  const [selectedReason, setSelectedReason] = useState<CleanupReason>('Irrelevant');

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <Trash2 className="w-6 h-6 text-rose-500" />;
      case 'archive':
        return <Archive className="w-6 h-6 text-amber-500" />;
      case 'suppress':
        return <EyeOff className="w-6 h-6 text-purple-500" />;
      default:
        return <AlertTriangle className="w-6 h-6 text-amber-500" />;
    }
  };

  const getButtonBg = () => {
    switch (type) {
      case 'danger':
        return 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30';
      case 'archive':
        return 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/30';
      case 'suppress':
        return 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/30';
      default:
        return 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5 text-slate-100">
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700/80 shrink-0">
              {getIcon()}
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-white leading-tight">{title}</h3>
              {itemCount && itemCount > 1 && (
                <span className="text-xs text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md mt-1 inline-block">
                  Targeting {itemCount} selected records
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed font-medium">
          {message}
        </p>

        {type === 'danger' && (
          <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-xs text-rose-300 font-semibold flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
            <span>Warning: Permanent deletion cannot be undone.</span>
          </div>
        )}

        {requireReason && (
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-bold text-slate-300 block">Select Reason:</label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value as CleanupReason)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {CLEANUP_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm(requireReason ? selectedReason : undefined);
              onClose();
            }}
            className={`px-4 py-2 font-bold text-xs rounded-xl transition shadow-md ${getButtonBg()}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
