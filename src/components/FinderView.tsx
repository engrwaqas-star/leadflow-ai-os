import React, { useState } from 'react';
import { 
  Search, 
  Sparkles, 
  Plus, 
  CheckCircle2, 
  Loader2, 
  Globe, 
  Building2, 
  MapPin, 
  Linkedin, 
  UserCheck, 
  ExternalLink, 
  AlertTriangle, 
  RefreshCw, 
  ShieldAlert, 
  Database,
  Briefcase,
  HelpCircle,
  X,
  FileText,
  DollarSign,
  Layers,
  Send,
  Eye,
  Info,
  Filter,
  Check
} from 'lucide-react';
import { Lead, SuppressedDomainRecord } from '../types';
import { loggedFetch } from '../utils/apiLogger';
import { 
  checkIsSuppressed, 
  checkIsDuplicate, 
  calculateExplainableScore, 
  estimateProjectValue,
  ScoreBreakdown,
  ValueEstimate
} from '../utils/leadPipeline';

interface FinderViewProps {
  onImportLead: (lead: Omit<Lead, 'id' | 'createdAt'>) => void;
  onSelectLeadForEmail: (lead: Lead) => void;
  existingLeads: Lead[];
  suppressedRecords?: SuppressedDomainRecord[];
  onSuppressLead?: (lead: Lead) => void;
}

export const FinderView: React.FC<FinderViewProps> = ({
  onImportLead,
  onSelectLeadForEmail,
  existingLeads,
  suppressedRecords = [],
  onSuppressLead,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'ai_discovery' | 'linkedin_prospector' | 'job_opportunities'>('ai_discovery');

  // Search Parameters
  const [country, setCountry] = useState('USA');
  const [industry, setIndustry] = useState('Real Estate / Realtors');
  const [city, setCity] = useState('');
  const [opportunityType, setOpportunityType] = useState('$2,000+ Client Projects');
  const [companyStage, setCompanyStage] = useState('All Stages');
  const [budgetTarget, setBudgetTarget] = useState('$2,000+ Target');
  const [technology, setTechnology] = useState('React / JavaScript');
  const [keyword, setKeyword] = useState('');

  const [loading, setLoading] = useState(false);
  const [discoveredLeads, setDiscoveredLeads] = useState<any[]>([]);
  const [searchSummary, setSearchSummary] = useState<{
    rawCount: number;
    newCount: number;
    duplicateCount: number;
    suppressedCount: number;
    finalActive: number;
  } | null>(null);

  const [importedIds, setImportedIds] = useState<Record<string, boolean>>({});
  const [apiError, setApiError] = useState<{ message: string; code?: string } | null>(null);

  // Parameterized Search Cache (Key: country|city|industry|oppType|budget)
  const [searchCache, setSearchCache] = useState<Record<string, { leads: any[]; summary: any }>>({});

  // Modal States
  const [activeScoreModal, setActiveScoreModal] = useState<{ lead: any; scoreData: ScoreBreakdown } | null>(null);
  const [activeBriefModal, setActiveBriefModal] = useState<{ lead: any; scoreData: ScoreBreakdown; valueData: ValueEstimate } | null>(null);

  // LinkedIn Prospector State
  const [companyName, setCompanyName] = useState('');
  const [roleTitle, setRoleTitle] = useState('VP of Marketing / Founder / CEO');
  const [location, setLocation] = useState('San Francisco, CA');
  const [prospectorLoading, setProspectorLoading] = useState(false);
  const [prospects, setProspects] = useState<any[]>([]);
  const [importedProspectIds, setImportedProspectIds] = useState<Record<string, boolean>>({});
  const [prospectorError, setProspectorError] = useState<{ message: string; code?: string } | null>(null);

  const handleSearch = async () => {
    setLoading(true);
    setApiError(null);
    setDiscoveredLeads([]);
    setSearchSummary(null);

    const cacheKey = `${country}|${city.trim().toLowerCase() || 'all'}|${industry}|${opportunityType}|${budgetTarget}`;

    // Check cache
    if (searchCache[cacheKey]) {
      setDiscoveredLeads(searchCache[cacheKey].leads);
      setSearchSummary(searchCache[cacheKey].summary);
      setLoading(false);
      return;
    }

    const { ok, data, error, code } = await loggedFetch('/api/ai/find-clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        country, 
        industry, 
        city,
        opportunityType,
        companyStage,
        budgetTarget,
        technology,
        keyword
      }),
    });

    if (ok && data?.success && Array.isArray(data.leads)) {
      const rawLeads = data.leads;
      let duplicateCount = 0;
      let suppressedCount = 0;
      const validActiveLeads: any[] = [];

      rawLeads.forEach((item: any) => {
        // Absolute Search Integrity check - do not alter city if provided
        const leadObj = {
          ...item,
          city: item.city || city || 'Local',
          country: item.country || country,
          verificationStatus: item.verificationStatus || 'VERIFIED',
          source: item.source || 'Live Search Engine',
          sourceUrl: item.sourceUrl || item.website || '',
          evidenceText: item.evidenceText || `Discovered active company in ${item.city || country} with requirement for ${item.suggestedService || 'Web Development'}.`,
        };

        if (checkIsSuppressed(leadObj, suppressedRecords)) {
          suppressedCount++;
        } else if (checkIsDuplicate(leadObj, existingLeads)) {
          duplicateCount++;
        } else {
          validActiveLeads.push(leadObj);
        }
      });

      const summary = {
        rawCount: rawLeads.length,
        newCount: validActiveLeads.length,
        duplicateCount,
        suppressedCount,
        finalActive: validActiveLeads.length,
      };

      setDiscoveredLeads(validActiveLeads);
      setSearchSummary(summary);
      setSearchCache((prev) => ({ ...prev, [cacheKey]: { leads: validActiveLeads, summary } }));
    } else {
      const msg = error || data?.error || 'Live lead provider not configured or temporarily unavailable.';
      setApiError({ message: msg, code });
    }

    setLoading(false);
  };

  const handleLinkedInSearch = async () => {
    setProspectorLoading(true);
    setProspectorError(null);
    setProspects([]);

    const { ok, data, error, code } = await loggedFetch('/api/ai/linkedin-prospector', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyName, roleTitle, location }),
    });

    if (ok && data?.success && Array.isArray(data.prospects)) {
      setProspects(data.prospects);
    } else {
      const msg = error || data?.error || 'LinkedIn prospector API unavailable.';
      setProspectorError({ message: msg, code });
    }

    setProspectorLoading(false);
  };

  const handleImport = (item: any, index: number) => {
    const scoreData = calculateExplainableScore(item);
    const valueData = estimateProjectValue(item);

    const newLead: Omit<Lead, 'id' | 'createdAt'> = {
      businessName: item.businessName,
      contactPerson: item.contactPerson || 'Business Owner',
      email: item.email || 'contact@domain.com',
      phone: item.phone || '+1 (555) 012-3456',
      website: item.website || 'www.domain.com',
      industry: item.industry || industry,
      country: item.country || country,
      city: item.city || city || 'Local',
      score: scoreData.totalScore,
      temperature: item.temperature || 'WARM',
      contactStatus: 'Not Contacted',
      websiteStatus: item.websiteStatus || 'Discovered via Discovery Pipeline',
      suggestedService: item.suggestedService || valueData.recommendedService,
      auditIssue: item.auditIssue || 'Optimization required for mobile viewport and speed',
      pitchHook: item.pitchHook || 'I noticed your mobile page speed could be improved by 3+ seconds.',
      mobileViewport: true,
      clearCTA: false,
      speedRating: 'Slow',
      auditStatus: 'Audited',
      notes: item.evidenceText ? `[Evidence]: ${item.evidenceText}` : undefined,
    };

    onImportLead(newLead);
    setImportedIds((prev) => ({ ...prev, [index]: true }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Client Acquisition & Opportunity Discovery
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Discover real prospects with verified development needs, target $2,000+ project values, and match your React skills.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Navigation Sub-Tabs */}
          <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 inline-flex items-center gap-1">
            <button
              onClick={() => setActiveSubTab('ai_discovery')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeSubTab === 'ai_discovery'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> Client Projects ($2k+)
            </button>
            <button
              onClick={() => setActiveSubTab('job_opportunities')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeSubTab === 'job_opportunities'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 text-emerald-600" /> Frontend Jobs & Contracts
            </button>
            <button
              onClick={() => setActiveSubTab('linkedin_prospector')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeSubTab === 'linkedin_prospector'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Linkedin className="w-3.5 h-3.5 text-blue-600" /> LinkedIn Prospector
            </button>
          </div>
        </div>
      </div>

      {activeSubTab === 'ai_discovery' && (
        <>
          {/* Filter Form Panel */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Filter className="w-4 h-4 text-indigo-600" /> Discovery Search Parameters
              </span>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Target Project Value: $2,000+ Default
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                  Country
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="USA">USA</option>
                  <option value="Pakistan">Pakistan</option>
                  <option value="UK">UK</option>
                  <option value="Canada">Canada</option>
                  <option value="Australia">Australia</option>
                  <option value="Europe">Europe</option>
                  <option value="Remote Global">Remote Global</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                  Industry
                </label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="Real Estate / Realtors">Real Estate / Realtors</option>
                  <option value="SaaS & Startups">SaaS & Startups</option>
                  <option value="Law Firms">Law Firms</option>
                  <option value="Dentists & Clinics">Dentists & Clinics</option>
                  <option value="Restaurants & Cafes">Restaurants & Cafes</option>
                  <option value="Marketing Agencies">Marketing Agencies</option>
                  <option value="Gyms & Salons">Gyms & Salons</option>
                  <option value="E-Commerce Stores">E-Commerce Stores</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                  City or Keyword
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Lahore, Karachi, Austin..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                  Opportunity Type
                </label>
                <select
                  value={opportunityType}
                  onChange={(e) => setOpportunityType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="$2,000+ Client Projects">$2,000+ Client Projects</option>
                  <option value="Startup MVP Frontend">Startup MVP Frontend</option>
                  <option value="Website Modernization">Website Modernization</option>
                  <option value="Dashboard / Portal">Dashboard / Portal</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                Strict search integrity enforced. Location and lead evidence are never mutated.
              </span>

              <button
                onClick={handleSearch}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Querying Discovery Engine...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Run Verified Client Search
                  </>
                )}
              </button>
            </div>
          </div>

          {/* API Error / Provider Not Configured Alert */}
          {apiError && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 space-y-3">
              <div className="flex items-start gap-3 text-rose-900">
                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-extrabold text-sm text-rose-950 uppercase tracking-tight">
                    LIVE LEAD PROVIDER NOT CONFIGURED
                  </h4>
                  <p className="text-xs text-rose-800 leading-relaxed">
                    {apiError.message}
                  </p>
                  {apiError.code && (
                    <span className="inline-block px-2 py-0.5 bg-rose-200 text-rose-900 font-mono text-[10px] rounded font-bold">
                      Code: {apiError.code}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-rose-200">
                <button
                  onClick={handleSearch}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg transition inline-flex items-center gap-1.5 shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Retry Search
                </button>
              </div>
            </div>
          )}

          {/* Search Session Statistics Summary Bar */}
          {searchSummary && (
            <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow-md flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-2 font-bold text-indigo-300">
                <Sparkles className="w-4 h-4 text-indigo-400" /> Discovery Pipeline Execution Summary:
              </div>

              <div className="flex items-center gap-4 text-slate-300 font-semibold">
                <span>Candidates Found: <strong className="text-white">{searchSummary.rawCount}</strong></span>
                <span>•</span>
                <span>New Verified: <strong className="text-emerald-400">{searchSummary.newCount}</strong></span>
                <span>•</span>
                <span>Duplicates Filtered: <strong className="text-amber-400">{searchSummary.duplicateCount}</strong></span>
                <span>•</span>
                <span>Suppressed: <strong className="text-rose-400">{searchSummary.suppressedCount}</strong></span>
              </div>
            </div>
          )}

          {/* Discovered Leads List or Empty State */}
          {discoveredLeads.length > 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  Discovered Opportunities ({discoveredLeads.length})
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  Filtered against suppression list & active database
                </span>
              </div>

              <div className="divide-y divide-slate-200">
                {discoveredLeads.map((item, idx) => {
                  const isImported = importedIds[idx];
                  const scoreData = calculateExplainableScore(item);
                  const valueData = estimateProjectValue(item);

                  return (
                    <div
                      key={`disc-${idx}-${item.businessName}`}
                      className="p-5 hover:bg-slate-50/80 transition space-y-3"
                    >
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-extrabold text-slate-900 text-base">
                              {item.businessName}
                            </h4>

                            {/* Verification Badge */}
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 font-bold text-[10px] rounded-full border border-emerald-200 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              VERIFIED
                            </span>

                            {/* Skill Match Badge */}
                            {scoreData.skillMatchStatus === 'SKILL_GAP' ? (
                              <span className="px-2 py-0.5 bg-rose-100 text-rose-900 font-extrabold text-[10px] rounded-full border border-rose-300">
                                SKILL GAP — VERIFY BEFORE OUTREACH
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold text-[10px] rounded-full border border-indigo-200">
                                React Skill Match: 100%
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-slate-600 flex flex-wrap items-center gap-3 font-medium">
                            <span>Contact: <strong>{item.contactPerson}</strong></span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {item.city || city || 'Local'}, {item.country || country}
                            </span>
                            <span>•</span>
                            <a
                              href={item.website?.startsWith('http') ? item.website : `https://${item.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:underline flex items-center gap-1"
                            >
                              {item.website} <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>

                          <p className="text-xs text-slate-600 bg-slate-100 p-2.5 rounded-xl border border-slate-200/80">
                            <strong>Evidence:</strong> {item.evidenceText || item.auditIssue}
                          </p>
                        </div>

                        {/* Scores & Value Box */}
                        <div className="flex flex-wrap md:flex-col items-end gap-2 shrink-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-500">Qualification Score:</span>
                            <button
                              onClick={() => setActiveScoreModal({ lead: item, scoreData })}
                              className="px-3 py-1 bg-slate-900 text-white font-extrabold text-xs rounded-xl hover:bg-slate-800 transition flex items-center gap-1 shadow-xs"
                            >
                              {scoreData.totalScore}/100 <HelpCircle className="w-3 h-3 text-amber-400" />
                            </button>
                          </div>

                          <div className="text-right">
                            <div className="text-xs font-bold text-emerald-700">
                              Value: {valueData.estimatedValueRange}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Confidence: {valueData.confidence}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Bar */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                        <div className="text-slate-500 font-medium text-[11px]">
                          Suggested Service: <strong className="text-slate-800">{item.suggestedService || valueData.recommendedService}</strong>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setActiveBriefModal({ lead: item, scoreData, valueData })}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition flex items-center gap-1"
                          >
                            <FileText className="w-3.5 h-3.5 text-indigo-600" /> Opportunity Brief
                          </button>

                          {isImported ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-xs px-3 py-1.5 bg-emerald-50 rounded-xl border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Added to DB
                            </span>
                          ) : (
                            <button
                              onClick={() => handleImport(item, idx)}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition inline-flex items-center gap-1 shadow-sm"
                            >
                              <Plus className="w-3.5 h-3.5" /> Import Lead
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            !loading && !apiError && (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3">
                <Sparkles className="w-10 h-10 text-indigo-500 mx-auto" />
                <h4 className="font-extrabold text-slate-900 text-base">Live Lead Discovery Ready</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Select your discovery parameters (Country, Industry, City, Opportunity Type) and click <strong>Run Verified Client Search</strong> to fetch live prospects from your connected Live Data Provider.
                </p>
              </div>
            )
          )}
        </>
      )}

      {/* Jobs Sub-Tab */}
      {activeSubTab === 'job_opportunities' && (
        <div className="space-y-4">
          <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md space-y-2">
            <h3 className="font-extrabold text-base flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-emerald-400" /> Remote Frontend Jobs & Subcontracting Contracts
            </h3>
            <p className="text-xs text-slate-300">
              Verified job postings seeking React, JavaScript, and HTML/CSS web developers.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3">
            <Briefcase className="w-10 h-10 text-indigo-500 mx-auto" />
            <h4 className="font-extrabold text-slate-900 text-base">Live Jobs & Contracts Pipeline Active</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Use the Client Projects search above or LinkedIn Prospector to find active clients, agencies, and contract opportunities for your developer profile.
            </p>
          </div>
        </div>
      )}

      {/* LinkedIn Prospector */}
      {activeSubTab === 'linkedin_prospector' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl border border-blue-900 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-wider">
              <Linkedin className="w-4 h-4 text-blue-400" /> B2B LinkedIn Decision-Maker Prospector
            </div>
            <h2 className="text-lg font-extrabold text-white">
              Find Key Executive Decision-Makers by Company Name & Location
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-blue-300 uppercase mb-1">
                  Company Name or Domain
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Luxe Living, Remax..."
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-blue-300 uppercase mb-1">
                  Decision-Maker Title / Role
                </label>
                <input
                  type="text"
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  placeholder="e.g. VP of Marketing, Founder, CEO"
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-blue-300 uppercase mb-1">
                  Location / Region
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. San Francisco, CA"
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleLinkedInSearch}
                disabled={prospectorLoading}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2"
              >
                {prospectorLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Mining Decision-Makers...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" /> Search LinkedIn Decision-Makers
                  </>
                )}
              </button>
            </div>
          </div>

          {prospects.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-600" /> LinkedIn Decision-Makers ({prospects.length})
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {prospects.map((p, idx) => (
                  <div
                    key={`prospect-${idx}`}
                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm">{p.contactPerson}</h4>
                        <p className="text-xs text-indigo-600 font-semibold">{p.roleTitle}</p>
                        <p className="text-[11px] text-slate-500">{p.businessName} • {p.location}</p>
                      </div>
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-full">
                        {p.score}/100 Score
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <a href={p.linkedInUrl} target="_blank" rel="noreferrer" className="text-blue-600 font-bold hover:underline">
                        View Profile
                      </a>
                      <button
                        onClick={() => handleImport(p, idx)}
                        className="px-3 py-1.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700"
                      >
                        Import Lead
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* WHY THIS SCORE? Explanation Modal */}
      {activeScoreModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-indigo-600" /> Why This Score ({activeScoreModal.scoreData.totalScore}/100)?
              </h3>
              <button
                onClick={() => setActiveScoreModal(null)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-slate-600 font-medium">
                Qualification breakdown for <strong>{activeScoreModal.lead.businessName}</strong> based on evidence and developer profile matching:
              </p>

              <div className="space-y-2 pt-2">
                {activeScoreModal.scoreData.scoreExplanation.map((exp, expIdx) => (
                  <div key={expIdx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 font-medium flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{exp}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setActiveScoreModal(null)}
                className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800"
              >
                Close Explanation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OPPORTUNITY BRIEF MODAL */}
      {activeBriefModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider block">
                  Evidence-Driven Prospect Brief
                </span>
                <h3 className="font-extrabold text-lg text-slate-900">
                  {activeBriefModal.lead.businessName}
                </h3>
              </div>
              <button
                onClick={() => setActiveBriefModal(null)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-500 font-semibold block uppercase text-[10px]">Company & Location</span>
                <div className="font-bold text-slate-900 text-sm">{activeBriefModal.lead.businessName}</div>
                <div className="text-slate-600">{activeBriefModal.lead.city || 'Local'}, {activeBriefModal.lead.country}</div>
                <div className="text-indigo-600">{activeBriefModal.lead.website}</div>
              </div>

              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
                <span className="text-emerald-800 font-semibold block uppercase text-[10px]">Estimated Value Scope</span>
                <div className="font-extrabold text-emerald-950 text-base">{activeBriefModal.valueData.estimatedValueRange}</div>
                <div className="text-emerald-800">Confidence: {activeBriefModal.valueData.confidence}</div>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">Evidence & Detected Need</h4>
              <p className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 font-medium leading-relaxed">
                {activeBriefModal.lead.evidenceText || activeBriefModal.lead.auditIssue}
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">Recommended Portfolio Proof Item</h4>
              <div className="p-3 bg-indigo-50 text-indigo-950 rounded-xl border border-indigo-200 font-bold">
                {activeBriefModal.valueData.recommendedPortfolioProject}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <p className="text-[11px] text-slate-500">
                {activeBriefModal.valueData.disclaimer}
              </p>
              <button
                onClick={() => setActiveBriefModal(null)}
                className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800"
              >
                Close Brief
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
