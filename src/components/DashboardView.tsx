import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Flame, 
  Zap, 
  Mail, 
  AlertCircle, 
  UserPlus, 
  Download, 
  Send, 
  Sparkles,
  TrendingUp,
  LineChart as LineChartIcon,
  Calendar,
  Filter,
  BarChart2,
  CheckCircle2,
  ArrowUpRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Lead, OutreachLog, InboundReply } from '../types';

interface DashboardViewProps {
  leads: Lead[];
  emailsSentCount: number;
  followupsDueCount: number;
  logs?: OutreachLog[];
  inboundReplies?: InboundReply[];
  onNavigateTab: (tab: string) => void;
  onExportExcel: () => void;
  onSelectLeadForEmail: (lead: Lead) => void;
  onSelectLeadForAudit: (lead: Lead) => void;
  onEditLead: (lead: Lead) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  leads,
  emailsSentCount,
  followupsDueCount,
  logs = [],
  inboundReplies = [],
  onNavigateTab,
  onExportExcel,
  onSelectLeadForEmail,
  onSelectLeadForAudit,
  onEditLead,
}) => {
  const [activeSubView, setActiveSubView] = useState<'combined' | 'trends' | 'overview'>('combined');
  const [timeframeDays, setTimeframeDays] = useState<7 | 14 | 30>(30);
  const [chartType, setChartType] = useState<'line' | 'area'>('line');

  const hotLeads = leads.filter((l) => l.temperature === 'HOT');
  const warmLeads = leads.filter((l) => l.temperature === 'WARM');

  // Compute 30-day daily outreach volume and conversion rate data
  const chartData = useMemo(() => {
    const data: Array<{
      date: string;
      fullDate: string;
      outreachVolume: number;
      conversions: number;
      conversionRate: number;
      targetGoal: number;
    }> = [];

    const now = new Date();
    
    // Compute purely from live recorded outreach logs and inbound replies
    for (let i = timeframeDays - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const isoDate = d.toISOString().split('T')[0];
      const monthDay = d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });

      // Match actual live logs
      const dayLogs = logs.filter((l) => l.sentDate === isoDate);
      const dayReplies = inboundReplies.filter((r) => r.receivedAt?.startsWith(isoDate));

      const volume = dayLogs.length;
      const convs = dayReplies.length;
      const rate = volume > 0 ? parseFloat(((convs / volume) * 100).toFixed(1)) : 0;

      data.push({
        date: monthDay,
        fullDate: isoDate,
        outreachVolume: volume,
        conversions: convs,
        conversionRate: rate,
        targetGoal: 30,
      });
    }

    return data;
  }, [logs, inboundReplies, timeframeDays]);

  // Summary Metrics over selected timeframe
  const summaryStats = useMemo(() => {
    const totalVolume = chartData.reduce((acc, d) => acc + d.outreachVolume, 0);
    const totalConversions = chartData.reduce((acc, d) => acc + d.conversions, 0);
    const avgDailyVolume = Math.round(totalVolume / (chartData.length || 1));
    const overallConversionRate = totalVolume > 0 
      ? parseFloat(((totalConversions / totalVolume) * 100).toFixed(1)) 
      : 0;

    let peakDay = chartData[0];
    chartData.forEach((d) => {
      if (d.outreachVolume > (peakDay?.outreachVolume || 0)) {
        peakDay = d;
      }
    });

    return {
      totalVolume,
      totalConversions,
      avgDailyVolume,
      overallConversionRate,
      peakDay,
    };
  }, [chartData]);

  const getTemperatureBadge = (temp: string) => {
    switch (temp) {
      case 'HOT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-300">
            <Flame className="w-3 h-3 fill-rose-500 text-rose-500" /> HOT
          </span>
        );
      case 'WARM':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Zap className="w-3 h-3 fill-amber-500 text-amber-500" /> WARM
          </span>
        );
      case 'POTENTIAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-300">
            POTENTIAL
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-300">
            LOW
          </span>
        );
    }
  };

  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const volume = payload.find((p: any) => p.dataKey === 'outreachVolume')?.value ?? 0;
      const rate = payload.find((p: any) => p.dataKey === 'conversionRate')?.value ?? 0;
      const convs = payload[0]?.payload?.conversions ?? 0;

      return (
        <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-xl border border-slate-700 text-xs space-y-2 min-w-[200px]">
          <div className="font-bold text-slate-200 border-b border-slate-800 pb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" /> {label}
            </span>
            <span className="text-[10px] text-slate-400">Target: 30/day</span>
          </div>
          <div className="flex items-center justify-between text-indigo-300 font-semibold">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Outreach Volume:
            </span>
            <span className="font-extrabold text-white bg-indigo-950 px-2 py-0.5 rounded border border-indigo-700">
              {volume} sent
            </span>
          </div>
          <div className="flex items-center justify-between text-emerald-300 font-semibold">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Conversions:
            </span>
            <span className="font-extrabold text-white bg-emerald-950 px-2 py-0.5 rounded border border-emerald-700">
              {convs} replies
            </span>
          </div>
          <div className="flex items-center justify-between text-amber-300 font-bold border-t border-slate-800 pt-1.5">
            <span>Conversion Rate:</span>
            <span className="text-amber-400 font-extrabold text-sm">{rate}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Outreach Command Center
            <span className="text-xs font-semibold px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full">
              30-Day Recharts Active
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Find prospects, audit website opportunities, track 30-day outreach volume &amp; conversion rates.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigateTab('kashi_agent')}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-sm rounded-lg shadow-sm transition"
          >
            <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" /> Agent Kashi
          </button>
          <button
            onClick={() => onNavigateTab('finder')}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm rounded-lg border border-slate-300 shadow-sm transition"
          >
            <UserPlus className="w-4 h-4 text-indigo-600" /> Find Clients
          </button>
          <button
            onClick={onExportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm rounded-lg border border-slate-300 shadow-sm transition"
          >
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Sub-View Navigation Switcher Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveSubView('combined')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition ${
              activeSubView === 'combined'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-indigo-600" /> Combined Full Dashboard
          </button>
          <button
            onClick={() => setActiveSubView('trends')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition ${
              activeSubView === 'trends'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LineChartIcon className="w-3.5 h-3.5 text-indigo-600" /> 30-Day Outreach &amp; Conversion Chart
          </button>
          <button
            onClick={() => setActiveSubView('overview')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition ${
              activeSubView === 'overview'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5 text-indigo-600" /> Command Overview
          </button>
        </div>

        <div className="text-xs text-slate-500 font-medium hidden sm:block">
          Target: <strong className="text-slate-800">30 Pitches / Day</strong> • Agent Kashi Automated
        </div>
      </div>

      {/* Agent Kashi Daily 30 Outreach Tracker Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-4 border border-slate-800 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 font-black shadow-md border border-indigo-400">
            🤖
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-black text-sm text-white">Agent Kashi Operations Alert</span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Target: 30 Leads/Day
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Daily Outreach Goal: <strong>30 Leads</strong>. Kashi is monitoring your queue and ready to auto-dispatch skills-based pitches (Full Stack React, Sub-second Speed).
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('kashi_agent')}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl transition shrink-0 flex items-center gap-1.5 shadow-md"
        >
          Open Agent Kashi Hub &amp; Autopilot &rarr;
        </button>
      </div>

      {/* KPI Metrics */}
      {(activeSubView === 'combined' || activeSubView === 'overview') && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              Total Leads <Users className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-2">{leads.length}</div>
            <div className="text-xs text-slate-500 mt-1">In Database</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              HOT Prospects <Flame className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-extrabold text-rose-600 mt-2">{hotLeads.length}</div>
            <div className="text-xs text-slate-500 mt-1">Score 90–100</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              WARM Prospects <Zap className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-extrabold text-amber-600 mt-2">{warmLeads.length}</div>
            <div className="text-xs text-slate-500 mt-1">Score 75–89</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              Emails Sent <Mail className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-2">{emailsSentCount}</div>
            <div className="text-xs text-slate-500 mt-1">Initial Outreach</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              Follow-ups Due <AlertCircle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-extrabold text-rose-600 mt-2">{followupsDueCount}</div>
            <div className="text-xs text-rose-500 font-medium mt-1">&gt; 5 Days Since Sent</div>
          </div>
        </div>
      )}

      {/* NEW VIEW: 30-Day Outreach Volume & Conversion Rate Line Chart (Recharts) */}
      {(activeSubView === 'combined' || activeSubView === 'trends') && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
          {/* Chart Header Controls */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg tracking-tight">
                    30-Day Outreach Volume &amp; Conversion Rate Trends
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Interactive line chart tracking daily pitches dispatched vs. client response conversion rate (%)
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end md:self-auto">
              {/* Timeframe selector */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <span className="text-[11px] text-slate-400 px-2 flex items-center gap-1">
                  <Filter className="w-3 h-3" /> Time:
                </span>
                <button
                  onClick={() => setTimeframeDays(7)}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    timeframeDays === 7 ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  7 Days
                </button>
                <button
                  onClick={() => setTimeframeDays(14)}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    timeframeDays === 14 ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  14 Days
                </button>
                <button
                  onClick={() => setTimeframeDays(30)}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    timeframeDays === 30 ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  30 Days
                </button>
              </div>

              {/* Chart type toggle */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setChartType('line')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    chartType === 'line' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Line Chart
                </button>
                <button
                  onClick={() => setChartType('area')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    chartType === 'area' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Area Chart
                </button>
              </div>
            </div>
          </div>

          {/* 30-Day Period KPI Highlights */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80">
            <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                {timeframeDays}-Day Total Volume
              </span>
              <span className="text-xl font-black text-indigo-600 mt-1 block">
                {summaryStats.totalVolume} <span className="text-xs font-normal text-slate-500">emails sent</span>
              </span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Daily Average Volume
              </span>
              <span className="text-xl font-black text-slate-900 mt-1 block">
                {summaryStats.avgDailyVolume} <span className="text-xs font-normal text-slate-500">/ day</span>
              </span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Avg. Conversion Rate
              </span>
              <span className="text-xl font-black text-emerald-600 mt-1 block">
                {summaryStats.overallConversionRate}% <span className="text-xs font-normal text-slate-500">replied</span>
              </span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Peak Outreach Day
              </span>
              <span className="text-xl font-black text-amber-600 mt-1 block">
                {summaryStats.peakDay?.date || 'N/A'}{' '}
                <span className="text-xs font-normal text-slate-500">({summaryStats.peakDay?.outreachVolume || 0} sent)</span>
              </span>
            </div>
          </div>

          {/* Recharts Line / Area Canvas */}
          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'line' ? (
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#64748b" 
                    fontSize={11} 
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis 
                    yAxisId="left" 
                    stroke="#6366f1" 
                    fontSize={11} 
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                    label={{ value: 'Daily Volume (Emails)', angle: -90, position: 'insideLeft', style: { fill: '#6366f1', fontSize: '10px', fontWeight: 700 } }}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    stroke="#10b981" 
                    fontSize={11} 
                    unit="%"
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                    label={{ value: 'Conversion Rate (%)', angle: 90, position: 'insideRight', style: { fill: '#10b981', fontSize: '10px', fontWeight: 700 } }}
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Legend 
                    verticalAlign="top" 
                    height={36}
                    formatter={(value) => <span className="text-xs font-bold text-slate-700 mr-4">{value}</span>}
                  />
                  <Line 
                    yAxisId="left" 
                    type="monotone" 
                    dataKey="outreachVolume" 
                    name="Outreach Volume (Sent)" 
                    stroke="#6366f1" 
                    strokeWidth={3} 
                    dot={{ r: 3, fill: '#6366f1' }} 
                    activeDot={{ r: 6, fill: '#4f46e5' }} 
                  />
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="conversionRate" 
                    name="Conversion Rate (%)" 
                    stroke="#10b981" 
                    strokeWidth={3} 
                    dot={{ r: 3, fill: '#10b981' }} 
                    activeDot={{ r: 6, fill: '#059669' }} 
                  />
                </LineChart>
              ) : (
                <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis yAxisId="left" stroke="#6366f1" fontSize={11} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={11} unit="%" tickLine={false} />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Legend verticalAlign="top" height={36} />
                  <Area yAxisId="left" type="monotone" dataKey="outreachVolume" name="Outreach Volume (Sent)" stroke="#6366f1" fillOpacity={1} fill="url(#colorVolume)" strokeWidth={2.5} />
                  <Area yAxisId="right" type="monotone" dataKey="conversionRate" name="Conversion Rate (%)" stroke="#10b981" fillOpacity={1} fill="url(#colorRate)" strokeWidth={2.5} />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* 30-Day Daily Breakdown Mini Table */}
          <div className="border-t border-slate-100 pt-4 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                Daily Outreach &amp; Conversion Breakdown ({timeframeDays} Days)
              </h4>
              <span className="text-[11px] text-slate-500 font-medium">
                Goal Benchmark: 30 Sent / Day • ~15% Avg Response
              </span>
            </div>

            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-bold sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">Outreach Volume</th>
                    <th className="p-2.5">Conversions</th>
                    <th className="p-2.5">Conversion Rate</th>
                    <th className="p-2.5 text-right">Daily Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {chartData.slice().reverse().map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition">
                      <td className="p-2.5 font-bold text-slate-900">{row.date} ({row.fullDate})</td>
                      <td className="p-2.5 font-extrabold text-indigo-600">{row.outreachVolume} sent</td>
                      <td className="p-2.5 font-semibold text-slate-800">{row.conversions} replies</td>
                      <td className="p-2.5 font-bold text-emerald-600">{row.conversionRate}%</td>
                      <td className="p-2.5 text-right">
                        {row.outreachVolume >= 28 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Target Met
                          </span>
                        ) : row.outreachVolume >= 15 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            Moderate
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-300">
                            Low Volume
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* High Opportunity Prospects Table */}
      {(activeSubView === 'combined' || activeSubView === 'overview') && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">High Opportunity Prospects</h3>
              <p className="text-xs text-slate-500">
                Sorted by highest AI qualification lead score
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('database')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
            >
              View All Leads ({leads.length}) &rarr;
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Business</th>
                  <th className="p-3.5">Industry</th>
                  <th className="p-3.5">Country</th>
                  <th className="p-3.5">AI Score</th>
                  <th className="p-3.5">Temp</th>
                  <th className="p-3.5">Suggested Service</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      <div className="max-w-md mx-auto space-y-2">
                        <p className="font-semibold text-slate-700">No leads in database yet</p>
                        <p className="text-xs text-slate-400">Click &ldquo;Find Clients&rdquo; or use Agent Kashi to discover authentic businesses and qualify real frontend development opportunities.</p>
                        <button
                          onClick={() => onNavigateTab('finder')}
                          className="mt-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition"
                        >
                          Launch Client Finder &rarr;
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  leads
                    .slice()
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 5)
                    .map((lead) => (
                      <tr key={lead.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3.5 font-semibold text-slate-900">
                          <div>{lead.businessName}</div>
                          <div className="text-[11px] text-slate-400 font-normal">
                            {lead.contactPerson}
                          </div>
                        </td>
                        <td className="p-3.5">{lead.industry}</td>
                        <td className="p-3.5 font-medium">{lead.country}</td>
                        <td className="p-3.5">
                          <span className="font-extrabold text-sm text-slate-900">
                            {lead.score}
                          </span>
                          <span className="text-slate-400">/100</span>
                        </td>
                        <td className="p-3.5">{getTemperatureBadge(lead.temperature)}</td>
                        <td className="p-3.5 text-slate-600 max-w-xs truncate">
                          {lead.suggestedService}
                        </td>
                        <td className="p-3.5 text-right space-x-1.5">
                          <button
                            onClick={() => onSelectLeadForAudit(lead)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-[11px] transition inline-flex items-center gap-1"
                            title="Audit Website"
                          >
                            <Sparkles className="w-3 h-3 text-indigo-600" /> Audit
                          </button>
                          <button
                            onClick={() => onSelectLeadForEmail(lead)}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded text-[11px] transition inline-flex items-center gap-1 shadow-sm"
                            title="Cold Email"
                          >
                            <Send className="w-3 h-3" /> Email
                          </button>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

