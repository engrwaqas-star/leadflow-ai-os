import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Zap, ShieldCheck } from 'lucide-react';

export const LiveClock: React.FC = () => {
  const [time, setTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = time.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const dateString = time.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const timeZoneStr = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local';

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs font-mono bg-slate-900 text-slate-100 px-3.5 py-1.5 rounded-xl border border-slate-700/80 shadow-inner">
      <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
        <Clock className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
        <span>{timeString}</span>
      </div>
      <span className="text-slate-600">|</span>
      <div className="flex items-center gap-1 text-slate-300">
        <Calendar className="w-3.5 h-3.5 text-indigo-400" />
        <span>{dateString}</span>
      </div>
      <span className="text-slate-600 hidden sm:inline">|</span>
      <div className="hidden sm:flex items-center gap-1 text-slate-400 text-[11px]">
        <ShieldCheck className="w-3 h-3 text-indigo-400" />
        <span>{timeZoneStr}</span>
      </div>
      <span className="text-slate-600">|</span>
      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-500/30 flex items-center gap-1">
        <Zap className="w-2.5 h-2.5 fill-emerald-400 text-emerald-400" /> Live System Watch
      </span>
    </div>
  );
};
