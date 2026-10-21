import React from 'react';
import { 
  Zap, 
  LayoutDashboard, 
  Search, 
  Database, 
  Send, 
  FileText, 
  BarChart3, 
  Settings, 
  Upload,
  Inbox,
  Columns,
  Bot,
  X,
  ExternalLink
} from 'lucide-react';
import { UserProfile } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  followupCount: number;
  unreadInboxCount?: number;
  profile: UserProfile;
  onOpenImportModal: () => void;
  onCloseMobileSidebar?: () => void;
}

interface NavSection {
  title: string;
  items: {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    isSpecial?: boolean;
    tag?: string;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  followupCount,
  unreadInboxCount = 0,
  profile,
  onOpenImportModal,
  onCloseMobileSidebar,
}) => {
  const sections: NavSection[] = [
    {
      title: 'CORE INTELLIGENCE',
      items: [
        { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
        { id: 'kashi_agent', label: 'Agent Kashi', icon: Bot, isSpecial: true, tag: 'AI Lead OS' },
      ],
    },
    {
      title: 'CLIENT PIPELINE & CRM',
      items: [
        { id: 'finder', label: 'Find Clients', icon: Search },
        { id: 'database', label: 'Leads & CRM', icon: Database },
        { id: 'pipeline', label: 'Pipeline Board', icon: Columns },
      ],
    },
    {
      title: 'OUTREACH ENGINE',
      items: [
        { id: 'outreach', label: 'Outreach & Sequences', icon: Send },
        { id: 'inbox', label: 'Unified Inbox', icon: Inbox, badge: unreadInboxCount },
        { id: 'templates', label: 'Pitch Templates', icon: FileText },
      ],
    },
    {
      title: 'ANALYTICS & CONTROL',
      items: [
        { id: 'analytics', label: 'Performance Analytics', icon: BarChart3 },
        { id: 'settings', label: 'Settings & Integrations', icon: Settings },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-slate-950 text-slate-200 p-4 flex flex-col justify-between shrink-0 min-h-screen border-r border-slate-800/80 select-none">
      <div className="space-y-4">
        {/* Brand Header */}
        <div className="px-2 pt-1 pb-3 border-b border-slate-800/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 shadow-md shadow-indigo-500/20 shrink-0">
              <img
                src="/leadflow_logo.jpg"
                alt="LeadFlow AI Logo"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <div className="font-black text-base tracking-tight text-white flex items-center gap-1.5">
                LeadFlow <span className="bg-gradient-to-r from-indigo-400 to-indigo-200 bg-clip-text text-transparent">AI</span>
              </div>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">
                Automation OS
              </span>
            </div>
          </div>

          {onCloseMobileSidebar && (
            <button
              onClick={onCloseMobileSidebar}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Grouped Navigation Sections */}
        <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-250px)] pr-1 scrollbar-thin scrollbar-thumb-slate-800">
          {sections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              <div className="px-2 text-[10px] font-black text-slate-500 tracking-wider uppercase">
                {section.title}
              </div>

              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        onCloseMobileSidebar?.();
                      }}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 text-left group ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-extrabold ring-1 ring-indigo-400/30'
                          : item.isSpecial
                          ? 'bg-slate-900/80 hover:bg-slate-900 text-slate-200 border border-indigo-500/30 hover:border-indigo-500/60'
                          : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                          isActive
                            ? 'text-white'
                            : item.isSpecial
                            ? 'text-amber-400'
                            : 'text-slate-400 group-hover:text-slate-200'
                        }`}
                      />
                      <span className="flex-1 truncate">{item.label}</span>

                      {item.tag && !isActive && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-tight">
                          {item.tag}
                        </span>
                      )}

                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full shadow-xs">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sidebar Footer: Profile & Import Action */}
      <div className="pt-3 border-t border-slate-800/80 space-y-2.5 bg-slate-950">
        <button
          onClick={onOpenImportModal}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white rounded-xl border border-slate-800 hover:border-slate-700 transition shadow-xs"
        >
          <Upload className="w-3.5 h-3.5 text-indigo-400" />
          Import Excel / CSV Leads
        </button>

        {/* User Card */}
        <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800/80 space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm border border-indigo-400/40 uppercase">
              {profile.name ? profile.name.split(' ').map(n => n[0]).join('').slice(0, 2) : 'MW'}
            </div>
            <div className="overflow-hidden flex-1">
              <div className="font-bold text-xs text-slate-100 truncate">{profile.name}</div>
              <div className="text-[10px] text-indigo-300 truncate font-medium">{profile.title}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[10px] font-bold">
            <a
              href={profile.githubUrl || 'https://github.com/engrwaqas-star'}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition flex items-center justify-center gap-1 truncate"
            >
              GitHub <ExternalLink className="w-2.5 h-2.5" />
            </a>
            <a
              href={profile.linkedInUrl || 'https://www.linkedin.com/in/waqas-ashiq-b489b041b'}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-1 bg-blue-900/50 hover:bg-blue-800/70 text-blue-200 hover:text-white rounded-lg transition flex items-center justify-center gap-1 truncate border border-blue-700/30"
            >
              LinkedIn <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
};

