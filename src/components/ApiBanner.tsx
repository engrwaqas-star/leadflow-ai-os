import React, { useState, useEffect } from 'react';
import { Info, Sparkles, Key, Wifi, WifiOff, HardDrive } from 'lucide-react';

interface ApiBannerProps {
  onConfigureKeys: () => void;
  hasKey?: boolean;
}

export const ApiBanner: React.FC<ApiBannerProps> = ({ onConfigureKeys, hasKey = true }) => {
  const [isOnline, setIsOnline] = useState<boolean>(() => typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className={`border rounded-xl p-3.5 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm transition ${
      isOnline 
        ? 'bg-indigo-50 border-indigo-200 text-indigo-900' 
        : 'bg-amber-50 border-amber-300 text-amber-950'
    }`}>
      <div className="flex items-center gap-2.5 text-sm">
        <div className={`p-1.5 rounded-lg ${isOnline ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-700'}`}>
          {isOnline ? <Sparkles className="w-4 h-4" /> : <WifiOff className="w-4 h-4 animate-pulse" />}
        </div>
        <div>
          <span className="font-semibold">
            {isOnline ? 'Gemini 3.6 Flash & Live API Active:' : 'Offline Mode Active (Local Database Persistence):'}
          </span>{' '}
          {isOnline 
            ? 'Automated website audits, lead qualification scoring, and cold outreach email generation are live.'
            : 'Working offline without internet! All lead edits, outreach logs, and team activities are saved locally in browser storage.'}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-lg border flex items-center gap-1 ${
          isOnline 
            ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
            : 'bg-amber-200 text-amber-900 border-amber-400'
        }`}>
          {isOnline ? <Wifi className="w-3 h-3 text-emerald-600" /> : <HardDrive className="w-3 h-3 text-amber-700" />}
          {isOnline ? 'Online • Local Cache Sync' : 'Offline Mode Ready'}
        </span>

        <button
          onClick={onConfigureKeys}
          className="text-xs font-semibold px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition flex items-center gap-1.5 shadow-sm"
        >
          <Key className="w-3.5 h-3.5" />
          Configure Keys
        </button>
      </div>
    </div>
  );
};

