import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  PieChart, 
  Pie, 
  Legend 
} from 'recharts';
import { Lead, OutreachLog } from '../types';

interface AnalyticsViewProps {
  leads: Lead[];
  logs: OutreachLog[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ leads, logs }) => {
  // Temperature distribution
  const tempCounts = {
    HOT: leads.filter((l) => l.temperature === 'HOT').length,
    WARM: leads.filter((l) => l.temperature === 'WARM').length,
    POTENTIAL: leads.filter((l) => l.temperature === 'POTENTIAL').length,
    LOW: leads.filter((l) => l.temperature === 'LOW').length,
  };

  const tempPieData = [
    { name: 'HOT (90-100)', value: tempCounts.HOT, color: '#f43f5e' },
    { name: 'WARM (75-89)', value: tempCounts.WARM, color: '#f59e0b' },
    { name: 'POTENTIAL (50-74)', value: tempCounts.POTENTIAL, color: '#3b82f6' },
    { name: 'LOW (<50)', value: tempCounts.LOW, color: '#64748b' },
  ];

  // Industry breakdown
  const industryMap: Record<string, number> = {};
  leads.forEach((l) => {
    industryMap[l.industry] = (industryMap[l.industry] || 0) + 1;
  });

  const industryBarData = Object.keys(industryMap).map((ind) => ({
    industry: ind.split(' ')[0],
    count: industryMap[ind],
  }));

  // Funnel metrics
  const totalCount = leads.length;
  const contactedCount = leads.filter((l) => l.contactStatus !== 'Not Contacted').length;
  const repliedCount = leads.filter((l) => l.contactStatus === 'Replied' || l.contactStatus === 'Closed Won').length;
  const closedCount = leads.filter((l) => l.contactStatus === 'Closed Won').length;

  const funnelData = [
    { stage: 'Database Leads', value: totalCount },
    { stage: 'Outreach Sent', value: contactedCount },
    { stage: 'Client Replied', value: repliedCount },
    { stage: 'Deals Won', value: closedCount },
  ];

  const avgScore =
    leads.length > 0
      ? Math.round(leads.reduce((acc, l) => acc + l.score, 0) / leads.length)
      : 0;

  const responseRate =
    contactedCount > 0 ? Math.round((repliedCount / contactedCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Outreach Performance Analytics
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Visual metrics on lead quality, industry distribution, and outreach response conversion rates.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase">Average Lead Score</div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">{avgScore}/100</div>
          <div className="text-xs text-emerald-600 font-medium mt-1">AI Qualified Potential</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase">Response Rate</div>
          <div className="text-3xl font-extrabold text-indigo-600 mt-2">{responseRate}%</div>
          <div className="text-xs text-slate-500 mt-1">Replies / Emails Sent</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase">HOT Prospects Ratio</div>
          <div className="text-3xl font-extrabold text-rose-600 mt-2">
            {Math.round((tempCounts.HOT / (totalCount || 1)) * 100)}%
          </div>
          <div className="text-xs text-slate-500 mt-1">{tempCounts.HOT} High-Priority Leads</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase">Active Conversations</div>
          <div className="text-3xl font-extrabold text-emerald-600 mt-2">{repliedCount}</div>
          <div className="text-xs text-slate-500 mt-1">Interested Prospect Leads</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart: Lead Quality Temperature */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="font-bold text-slate-900 text-base">Lead Score Temperature Breakdown</h3>
          <p className="text-xs text-slate-500">Distribution of HOT, WARM, and POTENTIAL prospects</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tempPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {tempPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart: Outreach Funnel */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="font-bold text-slate-900 text-base">Outreach Conversion Funnel</h3>
          <p className="text-xs text-slate-500">Progress from total database leads to closed client deals</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData}>
                <XAxis dataKey="stage" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip />
                <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
