import React from 'react';
import { RotateCcw, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { ToastNotice } from '../types';

interface ToastContainerProps {
  toasts: ToastNotice[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 space-y-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto bg-slate-900 border border-slate-700 text-slate-100 p-3.5 rounded-2xl shadow-2xl flex items-center justify-between gap-3 animate-slideUp border-l-4 border-l-indigo-500"
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs font-semibold truncate leading-tight">{toast.message}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {toast.undoAction && (
              <button
                onClick={() => {
                  toast.undoAction?.();
                  onDismiss(toast.id);
                }}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-black transition flex items-center gap-1 shadow-xs"
              >
                <RotateCcw className="w-3 h-3" /> Undo
              </button>
            )}
            <button
              onClick={() => onDismiss(toast.id)}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
