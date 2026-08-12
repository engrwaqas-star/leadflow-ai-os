import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';

export interface WorkingTimeContextType {
  /** The current live working Date object (synced with browser system clock or custom date) */
  now: Date;
  /** YYYY-MM-DD string of current working date */
  todayStr: string;
  /** Formatted time string (e.g. 10:45:12 PM) */
  timeStr: string;
  /** Formatted date string (e.g. Tue, Aug 11, 2026) */
  formattedDateStr: string;
  /** Local timezone string (e.g. America/Los_Angeles) */
  timeZoneStr: string;
  /** Whether using a custom simulated working date */
  isSimulated: boolean;
  /** Set a custom simulated date or pass null to reset to live browser system clock */
  setSimulatedDate: (date: Date | null) => void;
  /** Returns YYYY-MM-DD for a date offset by N days relative to current working date */
  getRelativeDateStr: (daysOffset: number) => string;
  /** Returns ISO string format for a date/time offset by days/hours */
  getRelativeISOStr: (daysAgo: number, hoursAgo?: number) => string;
  /** Calculates number of days elapsed from a date string relative to current working date */
  getDaysElapsed: (dateStr?: string) => number;
  /** Human friendly string ("Today", "Yesterday", "X days ago") */
  formatDaysAgo: (dateStr?: string) => string;
  /** Determines if a lead's last contact is due for follow-up (>= 5 days by default) */
  isFollowupDue: (lastContactDate?: string, thresholdDays?: number) => boolean;
}

const WorkingTimeContext = createContext<WorkingTimeContextType | undefined>(undefined);

export const WorkingTimeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [simulatedDate, setSimulatedDateState] = useState<Date | null>(null);
  const [systemClock, setSystemClock] = useState<Date>(new Date());

  // Keep system clock in sync with browser local time every 1 second
  useEffect(() => {
    const timer = setInterval(() => {
      setSystemClock(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Effective working date is either custom simulated date or live system clock
  const now = simulatedDate || systemClock;

  const todayStr = useMemo(() => {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [now]);

  const timeStr = useMemo(() => {
    return now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  }, [now]);

  const formattedDateStr = useMemo(() => {
    return now.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, [now]);

  const timeZoneStr = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local';
    } catch {
      return 'Local';
    }
  }, []);

  const getRelativeDateStr = (daysOffset: number): string => {
    const target = new Date(now.getTime());
    target.setDate(target.getDate() + daysOffset);
    const y = target.getFullYear();
    const m = String(target.getMonth() + 1).padStart(2, '0');
    const d = String(target.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getRelativeISOStr = (daysAgo: number, hoursAgo: number = 0): string => {
    const target = new Date(now.getTime() - (daysAgo * 86400000 + hoursAgo * 3600000));
    return target.toISOString();
  };

  const getDaysElapsed = (dateStr?: string): number => {
    if (!dateStr) return 0;
    try {
      const past = new Date(dateStr).getTime();
      const current = now.getTime();
      const diff = Math.floor((current - past) / (1000 * 60 * 60 * 24));
      return diff > 0 ? diff : 0;
    } catch {
      return 0;
    }
  };

  const formatDaysAgo = (dateStr?: string): string => {
    if (!dateStr) return 'Never';
    const days = getDaysElapsed(dateStr);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  const isFollowupDue = (lastContactDate?: string, thresholdDays: number = 5): boolean => {
    if (!lastContactDate) return false;
    const days = getDaysElapsed(lastContactDate);
    return days >= thresholdDays;
  };

  const setSimulatedDate = (date: Date | null) => {
    setSimulatedDateState(date);
  };

  const value: WorkingTimeContextType = {
    now,
    todayStr,
    timeStr,
    formattedDateStr,
    timeZoneStr,
    isSimulated: !!simulatedDate,
    setSimulatedDate,
    getRelativeDateStr,
    getRelativeISOStr,
    getDaysElapsed,
    formatDaysAgo,
    isFollowupDue,
  };

  return (
    <WorkingTimeContext.Provider value={value}>
      {children}
    </WorkingTimeContext.Provider>
  );
};

export const useWorkingTime = (): WorkingTimeContextType => {
  const context = useContext(WorkingTimeContext);
  if (!context) {
    throw new Error('useWorkingTime must be used within a WorkingTimeProvider');
  }
  return context;
};
