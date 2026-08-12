import React, { useState, useEffect } from 'react';
import { Terminal, Trash2, X, RefreshCw, CheckCircle2, AlertTriangle, ShieldAlert, Cpu } from 'lucide-react';
import { ApiLogEntry, getApiLogs, subscribeApiLogs, clearApiLogs } from '../utils/apiLogger';

interface DebugPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<ApiLogEntry[]>([]);

  useEffect(() => {
    setLogs(getApiLogs());
    const unsubscribe = subscribeApiLogs((updated) => setLogs([...updated]));
    return unsubscribe;
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-[540px] max-w-[92vw] bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 shadow-2xl z-50 overflow-hidden flex flex-col max-h-[500px]">
      {/* Header */}
      <div className="p-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="font-extrabold text-xs text-white uppercase tracking-wider">
            API & Deployment Debug Diagnostics
          </span>
          <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px] font-mono">
            {logs.length} calls
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={clearApiLogs}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
            title="Clear Logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Logs Container */}
      <div className="p-3 overflow-y-auto space-y-2 font-mono text-[11px] flex-1">
        {logs.length === 0 ? (
          <div className="py-8 text-center text-slate-500 font-sans text-xs">
            No API requests recorded yet. Perform search, outreach, or audit actions to view logs.
          </div>
        ) : (
          logs.map((log) => {
            const isSuccess = log.status >= 200 && log.status < 300 && !log.errorCode;
            return (
              <div
                key={log.id}
                className={`p-2.5 rounded-xl border ${
                  isSuccess
                    ? 'bg-slate-900/90 border-slate-800 text-slate-200'
                    : 'bg-rose-950/40 border-rose-900/80 text-rose-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="text-slate-400">[{log.timestamp}]</span>
                    <span className="px-1.5 py-0.5 bg-slate-800 text-indigo-300 rounded text-[10px]">
                      {log.method}
                    </span>
                    <span className="truncate max-w-[220px] text-white font-semibold">
                      {log.endpoint}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <span
                      className={`px-1.5 py-0.5 rounded font-extrabold text-[10px] ${
                        isSuccess
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-rose-900 text-rose-300 border border-rose-700'
                      }`}
                    >
                      HTTP {log.status || 'FAIL'}
                    </span>
                    <span className="text-slate-400 text-[10px]">{log.durationMs}ms</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-slate-400 font-sans pt-1 border-t border-slate-800/80">
                  <div>
                    <span className="text-slate-500 font-mono">Provider:</span>{' '}
                    <span className="text-slate-200 font-medium">{log.provider}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-mono">Cache:</span>{' '}
                    <span className={log.cacheHit ? 'text-amber-400' : 'text-slate-300'}>
                      {log.cacheHit ? 'HIT' : 'MISS'}
                    </span>
                  </div>

                  {log.rawCount !== undefined && (
                    <div>
                      <span className="text-slate-500 font-mono">Raw Results:</span>{' '}
                      <span className="text-emerald-400 font-bold">{log.rawCount}</span>
                    </div>
                  )}

                  {log.errorCode && (
                    <div className="col-span-2 text-rose-400 font-bold flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3 text-rose-500" /> Error Code: {log.errorCode}
                    </div>
                  )}

                  {log.errorMessage && (
                    <div className="col-span-2 text-rose-300/90 text-[10px] leading-tight bg-rose-950/60 p-1.5 rounded border border-rose-900/50">
                      {log.errorMessage}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-2.5 bg-slate-900 border-t border-slate-800 text-[10px] text-slate-400 font-sans flex items-center justify-between">
        <span className="flex items-center gap-1">
          <Cpu className="w-3 h-3 text-indigo-400" /> Route target: /.netlify/functions/api
        </span>
        <button
          onClick={clearApiLogs}
          className="text-indigo-400 hover:text-indigo-300 font-semibold"
        >
          Reset Logs
        </button>
      </div>
    </div>
  );
};
