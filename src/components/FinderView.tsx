import React, { useState, useEffect } from 'react';
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
  Check,
  Activity,
  Sliders,
  ShieldCheck,
  Target,
  Handshake,
  Compass
} from 'lucide-react';
import { Lead, LeadStrategy, SuppressedDomainRecord } from '../types';
import { loggedFetch } from '../utils/apiLogger';
import { 
  checkIsSuppressed, 
  checkIsDuplicate, 
  calculateExplainableScore, 
  estimateProjectValue,
  ScoreBreakdown,
  ValueEstimate
} from '../utils/leadPipeline';
import { DataSourceConfigModal } from './DataSourceConfigModal';
import { exportLeadsToExcel } from '../utils/excel';

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

  // Strategy A (Direct Clients) vs Strategy B (Agency Partnerships)
  const [leadStrategy, setLeadStrategy] = useState<LeadStrategy>('DIRECT_CLIENTS');

  // Search Parameters - Free-form & non-restrictive
  const [country, setCountry] = useState('USA');
  const [industry, setIndustry] = useState('Salons');
  const [city, setCity] = useState('Austin');
  const [requestedLimit, setRequestedLimit] = useState<number>(20);
  const [opportunityType, setOpportunityType] = useState('$2,000+ Client Projects');
  const [companyStage, setCompanyStage] = useState('All Stages');
  const [budgetTarget, setBudgetTarget] = useState('$2,000+ Target');
  const [technology, setTechnology] = useState('React / TypeScript / Tailwind');
  const [keyword, setKeyword] = useState('');
  const [selectedProviderId, setSelectedProviderId] = useState('serpapi-search');

  const [loading, setLoading] = useState(false);
  const [discoveredLeads, setDiscoveredLeads] = useState<any[]>([]);
  const [hasExecutedSearch, setHasExecutedSearch] = useState(false);
  const [searchSummary, setSearchSummary] = useState<{
    requestedCount: number;
    rawCount: number;
    newCount: number;
    duplicateCount: number;
    suppressedCount: number;
    finalActive: number;
    source: string;
    missingFields?: {
      missingWebsite: number;
      missingPhone: number;
      missingEmail: number;
      missingContactPerson: number;
    };
  } | null>(null);

  const [importedIds, setImportedIds] = useState<Record<string, boolean>>({});
  const [apiError, setApiError] = useState<{ message: string; code?: string } | null>(null);

  // Data Source Provider Config Modal & Diagnostics
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [providerHealth, setProviderHealth] = useState<any>(null);
  const [keysDiagnostic, setKeysDiagnostic] = useState<any>(null);
  const [testingKeys, setTestingKeys] = useState(false);

  // Parameterized Search Cache (Key: provider|country|city|industry|keyword|limit)
  const [searchCache, setSearchCache] = useState<Record<string, { leads: any[]; summary: any; timestamp: number }>>({});

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

  const fetchProviderHealth = async () => {
    const { ok, data } = await loggedFetch(`/api/provider/status?providerId=${selectedProviderId}`);
    if (ok && data?.health) {
      setProviderHealth(data.health);
    }
  };

  const runKeysDiagnostic = async () => {
    setTestingKeys(true);
    const { ok, data } = await loggedFetch('/api/provider/test-keys-diagnostic');
    if (ok && data?.results) {
      setKeysDiagnostic(data.results);
    }
    setTestingKeys(false);
  };

  useEffect(() => {
    fetchProviderHealth();
    runKeysDiagnostic();
  }, [selectedProviderId]);

  const handleSearch = async (forceRefresh = false) => {
    setLoading(true);
    setApiError(null);
    setDiscoveredLeads([]);
    setSearchSummary(null);
    setHasExecutedSearch(true);

    const cleanCity = city.trim();
    const cleanCountry = country.trim();
    const cleanIndustry = industry.trim();
    const cleanKeyword = keyword.trim();

    const cacheKey = `${selectedProviderId}|${cleanCountry.toLowerCase()}|${cleanCity.toLowerCase() || 'all'}|${cleanIndustry.toLowerCase()}|${cleanKeyword.toLowerCase()}|limit=${requestedLimit}`;

    // Check cache with 15-minute TTL unless user clicks force refresh
    if (!forceRefresh && searchCache[cacheKey]) {
      const cached = searchCache[cacheKey];
      if (Date.now() - (cached.timestamp || 0) < 15 * 60 * 1000) {
        setDiscoveredLeads(cached.leads);
        setSearchSummary(cached.summary);
        setLoading(false);
        return;
      }
    }

    const { ok, data, error, code } = await loggedFetch('/api/ai/find-clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        country: cleanCountry, 
        industry: cleanIndustry, 
        city: cleanCity,
        opportunityType,
        companyStage,
        budgetTarget,
        technology,
        keyword: cleanKeyword,
        providerId: selectedProviderId,
        limit: requestedLimit,
        leadStrategy
      }),
    });

    if (ok && data?.success && Array.isArray(data.leads)) {
      const rawLeads = data.leads;
      let duplicateCount = 0;
      let suppressedCount = 0;
      const validActiveLeads: any[] = [];

      rawLeads.forEach((item: any) => {
        const leadObj = {
          ...item,
          city: item.city || cleanCity || 'Local',
          country: item.country || cleanCountry,
          verificationStatus: item.verificationStatus || 'VERIFIED',
          source: item.source || data.provider || 'SerpApi Google Maps',
          sourceUrl: item.sourceUrl || item.website || '',
          address: item.address || '',
          google_place_id: item.placeId || item.google_place_id,
          rating: item.rating,
          review_count: item.reviews ?? item.review_count,
          missingFields: item.missingFields || [],
          evidenceText: item.evidenceText || `Discovered active company in ${item.city || cleanCity || cleanCountry} with requirement for ${item.suggestedService || 'Web Development'}.`,
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
        requestedCount: data.summary?.requestedCount || requestedLimit,
        rawCount: data.rawCount || rawLeads.length,
        newCount: validActiveLeads.length,
        duplicateCount: (data.summary?.duplicates || 0) + duplicateCount,
        suppressedCount,
        finalActive: validActiveLeads.length,
        source: data.provider || 'SerpApi Google Maps',
        missingFields: data.summary?.missingFields || {
          missingWebsite: validActiveLeads.filter(l => !l.website || l.website === 'Not found').length,
          missingPhone: validActiveLeads.filter(l => !l.phone || l.phone === 'Not found').length,
          missingEmail: validActiveLeads.length,
          missingContactPerson: validActiveLeads.length,
        },
      };

      setDiscoveredLeads(validActiveLeads);
      setSearchSummary(summary);
      setSearchCache((prev) => ({ 
        ...prev, 
        [cacheKey]: { leads: validActiveLeads, summary, timestamp: Date.now() } 
      }));
      fetchProviderHealth();
    } else {
      const msg = error || data?.error || 'Live lead provider not configured or temporarily unavailable.';
      setApiError({ message: msg, code: code || data?.code || 'LIVE_PROVIDER_ERROR' });
      fetchProviderHealth();
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
    const scoreData = calculateExplainableScore({
      ...item,
      leadStrategy,
      suggestedService: item.suggestedService,
    });
    const valueData = estimateProjectValue({
      ...item,
      suggestedService: item.suggestedService,
    });

    const cleanContactPerson = item.contactPerson && item.contactPerson !== 'Owner / Manager' && item.contactPerson !== 'Business Owner' ? item.contactPerson : 'Not found';
    const cleanEmail = item.email && !item.email.includes('domain.com') ? item.email : 'Not found';
    const cleanPhone = item.phone && item.phone !== 'Not found' ? item.phone : 'Not found';
    const cleanWebsite = item.website && item.website !== 'Not found' && !item.website.includes('domain.com') ? item.website : 'Not found';

    const newLead: Omit<Lead, 'id' | 'createdAt'> = {
      businessName: item.businessName,
      contactPerson: cleanContactPerson,
      email: cleanEmail,
      phone: cleanPhone,
      website: cleanWebsite,
      address: item.address || '',
      industry: item.industry || industry,
      niche: item.industry || industry,
      country: item.country || country,
      city: item.city || city || 'Local',
      google_place_id: item.placeId || item.google_place_id,
      rating: item.rating,
      review_count: item.reviews ?? item.review_count,
      score: scoreData.totalScore,
      temperature: item.temperature || (scoreData.totalScore >= 80 ? 'HOT' : scoreData.totalScore >= 65 ? 'GOOD' : 'POTENTIAL'),
      contactStatus: 'Not Contacted',
      stage: item.verificationStatus === 'VERIFIED' ? 'IDENTITY_VERIFIED' : 'DISCOVERED',
      leadStrategy,
      websiteStatus: item.websiteStatus || 'Discovered via Discovery Pipeline',
      suggestedService: item.suggestedService || (leadStrategy === 'AGENCY_PARTNERSHIPS' ? 'Frontend Subcontractor & Overflow React Implementation' : valueData.recommendedService),
      auditIssue: 'Technical website audit pending live inspection',
      pitchHook: item.pitchHook || (leadStrategy === 'AGENCY_PARTNERSHIPS' 
        ? `I noticed ${item.businessName}'s agency work and wanted to offer reliable frontend overflow capacity in React and Tailwind.`
        : `I came across ${item.businessName} and noticed a few frontend opportunities to improve responsive performance.`),
      mobileViewport: false,
      clearCTA: false,
      speedRating: 'Average',
      auditStatus: 'Pending',
      estimatedBudget: valueData.estimatedValueRange,
      scoreBreakdown: {
        budgetPotentialScore: scoreData.budgetPotentialScore,
        needScore: scoreData.needScore,
        skillMatchScore: scoreData.skillMatchScore,
        clientQualityScore: scoreData.clientQualityScore,
        projectQualityScore: scoreData.projectQualityScore,
        relationshipPotentialScore: scoreData.relationshipPotentialScore,
        totalLeadScore: scoreData.totalScore,
      },
      skillGaps: scoreData.skillGaps,
      notes: item.evidenceText ? `[Evidence]: ${item.evidenceText}` : undefined,
      verificationScore: item.verificationScore || 85,
      verificationStatus: item.verificationStatus || 'VERIFIED',
      fieldVerification: item.fieldVerification,
      missingFields: item.missingFields,
      source: item.source || 'SerpApi Google Maps',
      sourceUrl: item.sourceUrl || item.website || '',
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
          {/* Verified Leads Only Mode Banner */}
          <div className="bg-emerald-950 text-emerald-100 rounded-2xl p-4 border border-emerald-800/60 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-900/80 rounded-xl text-emerald-300 border border-emerald-700/50">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-white tracking-tight">
                    AUTHENTIC LEADS ONLY — ZERO DEMO / SYNTHETIC DATA
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-bold text-[10px] rounded-full border border-emerald-500/30">
                    Live Web Verified
                  </span>
                </div>
                <p className="text-emerald-300/80 text-[11px] mt-0.5 font-medium">
                  Discovery is locked to genuine operating businesses with real domains and identifiable frontend needs. Unverified contact fields remain "Not found" rather than fabricated.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <button
                onClick={runKeysDiagnostic}
                disabled={testingKeys}
                className="px-3 py-1.5 bg-emerald-900/90 hover:bg-emerald-800 text-emerald-200 border border-emerald-700 font-bold rounded-xl text-xs transition inline-flex items-center gap-1.5"
              >
                {testingKeys ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Verifying Keys...
                  </>
                ) : (
                  <>
                    <Activity className="w-3.5 h-3.5 text-emerald-400" /> Check API Keys Health
                  </>
                )}
              </button>
            </div>
          </div>

          {/* API Keys & Provider Health Diagnostic Bar */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-800 rounded-xl text-indigo-400 border border-slate-700">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-sm text-white">
                      Live Lead Provider: {providerHealth?.providerName || 'Google Live Web Search Engine'}
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-bold text-[10px] rounded-full border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Engine Active
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Querying live web indices for real businesses • All niche categories enabled
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsConfigModalOpen(true)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white font-bold rounded-xl border border-slate-700 transition inline-flex items-center gap-2 text-xs"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  Provider Keys & Sources
                </button>
              </div>
            </div>

            {/* Diagnostic Keys Status Pills */}
            {keysDiagnostic && (
              <div className="pt-2 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs">
                {/* SerpAPI Status */}
                <div className="bg-slate-850 p-2.5 rounded-xl border border-slate-800 flex flex-col justify-between">
                  <div className="text-[10px] uppercase font-bold text-slate-400">SerpAPI (Primary)</div>
                  <div className="text-xs font-extrabold text-slate-200 mt-1 flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${keysDiagnostic.serpApi?.configured ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                    {keysDiagnostic.serpApi?.status || (keysDiagnostic.serpApi?.configured ? 'Connected' : 'Not configured')}
                  </div>
                </div>

                {/* Google Places Status */}
                <div className="bg-slate-850 p-2.5 rounded-xl border border-slate-800 flex flex-col justify-between">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Google Places (Optional)</div>
                  <div className="text-xs font-extrabold text-slate-200 mt-1 flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${keysDiagnostic.googlePlaces?.configured ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                    {keysDiagnostic.googlePlaces?.status || (keysDiagnostic.googlePlaces?.configured ? 'Connected' : 'Optional / Not configured')}
                  </div>
                </div>

                {/* Gemini Status */}
                <div className="bg-slate-850 p-2.5 rounded-xl border border-slate-800 flex flex-col justify-between">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Gemini AI</div>
                  <div className="text-xs font-extrabold text-slate-200 mt-1 flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${keysDiagnostic.googleAIStudio?.configured ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                    {keysDiagnostic.googleAIStudio?.status || (keysDiagnostic.googleAIStudio?.configured ? 'Connected' : 'Not configured')}
                  </div>
                </div>

                {/* OpenRouter Status */}
                <div className="bg-slate-850 p-2.5 rounded-xl border border-slate-800 flex flex-col justify-between">
                  <div className="text-[10px] uppercase font-bold text-slate-400">OpenRouter (Fallback)</div>
                  <div className="text-xs font-extrabold text-slate-200 mt-1 flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${keysDiagnostic.openRouter?.configured ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                    {keysDiagnostic.openRouter?.status || (keysDiagnostic.openRouter?.configured ? 'Connected' : 'Not configured')}
                  </div>
                </div>

                {/* Gmail Status */}
                <div className="bg-slate-850 p-2.5 rounded-xl border border-slate-800 flex flex-col justify-between">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Gmail API</div>
                  <div className="text-xs font-extrabold text-slate-200 mt-1 flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${keysDiagnostic.gmail?.configured ? 'bg-emerald-400' : 'bg-slate-500'}`}></span>
                    {keysDiagnostic.gmail?.status || (keysDiagnostic.gmail?.configured ? 'Connected' : 'Not connected')}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Universal Discovery Search Panel - Unrestricted */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Search className="w-4 h-4 text-indigo-600" /> Universal Lead Discovery (Any Niche, Any Location)
              </span>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
                Target Project Value: $2,000+
              </span>
            </div>

            {/* 1. Lead Strategy Selection: Strategy A (Direct Clients) vs Strategy B (Agency Partnerships) */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-indigo-600" /> Lead Acquisition Strategy
                </span>
                <span className="text-[10px] text-slate-500 font-semibold">Select prior to searching</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setLeadStrategy('DIRECT_CLIENTS');
                    if (industry === 'Web & Marketing Agencies') setIndustry('SaaS & AI Startups');
                    setOpportunityType('$2,000+ Client Projects');
                  }}
                  className={`p-3 rounded-xl border text-left transition flex items-start gap-3 ${
                    leadStrategy === 'DIRECT_CLIENTS'
                      ? 'bg-white border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'bg-white/70 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className={`p-2 rounded-lg shrink-0 ${leadStrategy === 'DIRECT_CLIENTS' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      Strategy A: Direct Clients
                      {leadStrategy === 'DIRECT_CLIENTS' && (
                        <span className="text-[9px] bg-indigo-100 text-indigo-800 font-black px-1.5 py-0.2 rounded">Active</span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Businesses needing responsive redesigns, SaaS MVP interfaces, landing pages, or booking funnels.
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLeadStrategy('AGENCY_PARTNERSHIPS');
                    setIndustry('Web & Marketing Agencies');
                    setOpportunityType('Frontend Subcontracting / Contract');
                    setKeyword('web design agency contractor overflow frontend');
                  }}
                  className={`p-3 rounded-xl border text-left transition flex items-start gap-3 ${
                    leadStrategy === 'AGENCY_PARTNERSHIPS'
                      ? 'bg-white border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'bg-white/70 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className={`p-2 rounded-lg shrink-0 ${leadStrategy === 'AGENCY_PARTNERSHIPS' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <Handshake className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      Strategy B: Agency Partnerships
                      {leadStrategy === 'AGENCY_PARTNERSHIPS' && (
                        <span className="text-[9px] bg-indigo-100 text-indigo-800 font-black px-1.5 py-0.2 rounded">Active</span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Design & marketing agencies needing white-label frontend subcontractors or overflow implementation capacity.
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Main Search Parameters Grid */}
            {/* Main Search Parameters Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {/* 1. Target Niche / Industry (Unrestricted Free-Form) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Target Niche / Industry
                </label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="e.g. Salons, Dental, Healthcare, SaaS, Agencies..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                {/* Meaningful Niche Selection Pills */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {[
                    { label: 'Salons', ind: 'Salons', opp: 'Website Redesign & Modernization' },
                    { label: 'Dental & Clinics', ind: 'Dental Clinics', opp: 'Website Redesign & Modernization' },
                    { label: 'SaaS Startups', ind: 'SaaS Startups', opp: 'Startup MVP Frontend' },
                    { label: 'Web Agencies', ind: 'Web Agencies', opp: 'Frontend Subcontracting / Contract' },
                    { label: 'Restaurants', ind: 'Restaurants & Cafes', opp: 'Website Redesign & Modernization' },
                    { label: 'E-Commerce', ind: 'E-Commerce & Retail', opp: '$2,000+ Client Projects' },
                  ].map((niche) => (
                    <button
                      key={niche.label}
                      type="button"
                      onClick={() => {
                        setIndustry(niche.ind);
                        setOpportunityType(niche.opp);
                        if (niche.ind === 'Web Agencies') {
                          setLeadStrategy('AGENCY_PARTNERSHIPS');
                        } else {
                          setLeadStrategy('DIRECT_CLIENTS');
                        }
                      }}
                      className={`text-[10px] px-2 py-0.5 rounded-md font-semibold transition ${
                        industry.toLowerCase().includes(niche.ind.toLowerCase())
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {niche.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Target City / Region */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-indigo-600" /> City / Metropolitan Area
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Austin, New York, Chicago, London, Lahore..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                {/* Quick City Pills */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {['Austin', 'New York', 'San Francisco', 'Chicago', 'London', 'Lahore'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCity(c)}
                      className={`text-[10px] px-2 py-0.5 rounded-md font-semibold transition ${
                        city.toLowerCase() === c.toLowerCase()
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Target Country */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-indigo-600" /> Country / Territory
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. USA, United Kingdom, Canada, Pakistan..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                {/* Quick Country Pills */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {['USA', 'United Kingdom', 'Canada', 'Australia', 'Pakistan'].map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setCountry(loc)}
                      className={`text-[10px] px-2 py-0.5 rounded-md font-semibold transition ${
                        country.toLowerCase() === loc.toLowerCase()
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Requested Result Limit (Max 100) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Results Limit</span>
                  <span className="text-[10px] text-indigo-600 font-semibold">Up to 100</span>
                </label>
                <select
                  value={requestedLimit}
                  onChange={(e) => setRequestedLimit(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value={20}>20 Leads (1 Page / Fast)</option>
                  <option value={50}>50 Leads (Multi-Page Deep Search)</option>
                  <option value={100}>100 Leads (Maximum Discovery)</option>
                </select>
                <div className="text-[10px] text-slate-500 pt-1 font-medium">
                  Paginated retrieval across SerpApi Google Maps
                </div>
              </div>

              {/* 5. Lead Provider Engine */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Discovery Engine Provider
                </label>
                <select
                  value={selectedProviderId}
                  onChange={(e) => setSelectedProviderId(e.target.value)}
                  className="w-full bg-indigo-50/70 border border-indigo-200 rounded-xl p-2.5 text-xs text-indigo-950 font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="serpapi-search">SerpApi Google & Maps (Primary Real Discovery)</option>
                  <option value="google-places">Google Places API (Optional Discovery Source)</option>
                  <option value="auto-multi">Multi-Source Lead Aggregator (All Active)</option>
                  <option value="foursquare-places">Foursquare Places API</option>
                  <option value="yelp-fusion">Yelp Fusion Places API</option>
                </select>
                <div className="text-[10px] text-emerald-700 font-bold pt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active credentials verified
                </div>
              </div>

              {/* 6. Opportunity Goal / Project Type */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Opportunity & Project Goal
                </label>
                <select
                  value={opportunityType}
                  onChange={(e) => setOpportunityType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="$2,000+ Client Projects">$2,000+ Full Client Projects</option>
                  <option value="Website Redesign & Modernization">Website Redesign & Modernization</option>
                  <option value="Startup MVP Frontend">Startup MVP Frontend (React/Next.js)</option>
                  <option value="Custom Web Portal & Dashboard">Custom Web Portal & Dashboard</option>
                  <option value="Mobile Performance & Speed Fix">Mobile Performance & Speed Fix</option>
                  <option value="Frontend Subcontracting / Contract">Frontend Subcontracting / Contract</option>
                </select>
                <div className="text-[10px] text-slate-500 pt-1 font-medium">
                  Used for post-discovery opportunity qualification
                </div>
              </div>
            </div>

            {/* Custom Specific Requirements / Pitch Focus Bar */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Specific Keyword or Category Modifier (Optional)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="e.g. hair stylist, cosmetic surgery, boutique, web design, plumbing..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Run Search Action Row */}
            <div className="flex flex-col sm:flex-row items-center justify-between pt-3 border-t border-slate-100 gap-3">
              <div className="text-xs text-slate-500 font-medium flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Real local businesses only from Google Maps. Up to {requestedLimit} unique records.</span>
              </div>

              <button
                onClick={() => handleSearch(false)}
                disabled={loading}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Querying Google Maps via SerpApi...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Discover Real Clients & Opportunities
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
                    ⚠️ LIVE PROVIDER NOT CONFIGURED
                  </h4>
                  <p className="text-xs text-rose-800 leading-relaxed font-medium">
                    Live lead discovery is not connected. Configure a legitimate live lead provider to search real businesses.
                  </p>
                  <p className="text-[11px] text-rose-700 font-normal">
                    {apiError.message}
                  </p>
                  {apiError.code && (
                    <span className="inline-block px-2 py-0.5 bg-rose-200 text-rose-900 font-mono text-[10px] rounded font-bold">
                      Code: {apiError.code}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-rose-200">
                <button
                  onClick={() => setIsConfigModalOpen(true)}
                  className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl transition inline-flex items-center gap-1.5 shadow-sm"
                >
                  <Sliders className="w-3.5 h-3.5" /> Configure Provider
                </button>
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-rose-800 border border-rose-300 font-bold text-xs rounded-xl transition inline-flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Retry Search
                </button>
              </div>
            </div>
          )}

          {/* Search Session Statistics Summary Bar */}
          {searchSummary && (
            <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow-md space-y-3 text-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-2 font-bold text-indigo-300">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span className="font-extrabold text-white">Discovery Results Summary:</span>
                  <span className="text-slate-400 font-normal">Source: <strong className="text-slate-200">{searchSummary.source}</strong></span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-slate-300 font-semibold">
                  <span>Target Requested: <strong className="text-white">{searchSummary.requestedCount}</strong></span>
                  <span>•</span>
                  <span>Unique Results: <strong className="text-emerald-400">{searchSummary.finalActive}</strong></span>
                  <span>•</span>
                  <span>Duplicates Filtered: <strong className="text-amber-400">{searchSummary.duplicateCount}</strong></span>
                  <span>•</span>
                  <span>Suppressed: <strong className="text-rose-400">{searchSummary.suppressedCount}</strong></span>
                </div>
              </div>

              {searchSummary.missingFields && (
                <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800 text-[11px] text-slate-400 font-medium">
                  <span className="font-bold text-indigo-300">Provider Field Provenance:</span>
                  <span>No Website: <strong className="text-amber-300">{searchSummary.missingFields.missingWebsite}</strong></span>
                  <span>•</span>
                  <span>No Phone: <strong className="text-amber-300">{searchSummary.missingFields.missingPhone}</strong></span>
                  <span>•</span>
                  <span>Public Email Not Listed: <strong className="text-slate-300">{searchSummary.missingFields.missingEmail}</strong></span>
                  <span>•</span>
                  <span>Executive Contact Not Listed: <strong className="text-slate-300">{searchSummary.missingFields.missingContactPerson}</strong></span>
                </div>
              )}
            </div>
          )}

          {/* Discovered Leads List or Empty State */}
          {discoveredLeads.length > 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50 gap-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    Discovered Opportunities ({discoveredLeads.length})
                    <span className="text-[10px] px-2 py-0.5 bg-indigo-100 text-indigo-800 font-extrabold rounded-full">
                      Requested: {searchSummary?.requestedCount || requestedLimit}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Real operating businesses from {searchSummary?.source || 'SerpApi Google Maps'} in {city ? `${city}, ` : ''}{country}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSearch(true)}
                    disabled={loading}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold rounded-xl text-xs inline-flex items-center gap-1.5 transition shadow-xs"
                    title="Bypass cached results and fetch freshly from provider"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
                  </button>
                  <button
                    onClick={() => exportLeadsToExcel(discoveredLeads, `LeadFlow_${city || country}_${industry}.xlsx`)}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5 transition shadow-xs"
                  >
                    <FileText className="w-3.5 h-3.5" /> Export Results (.xlsx)
                  </button>
                </div>
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

                            {/* Google Rating Badge */}
                            {typeof item.rating === 'number' && (
                              <span className="px-2 py-0.5 bg-amber-50 text-amber-900 font-bold text-[10px] rounded-full border border-amber-200 flex items-center gap-1">
                                ⭐ {item.rating} ({item.reviews || item.review_count || 0} reviews)
                              </span>
                            )}

                            {/* Verification Badge */}
                            {item.verificationStatus === 'UNVERIFIED' ? (
                              <span className="px-2 py-0.5 bg-amber-50 text-amber-800 font-bold text-[10px] rounded-full border border-amber-200 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                UNVERIFIED
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 font-bold text-[10px] rounded-full border border-emerald-200 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                VERIFIED
                              </span>
                            )}

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
                            <span>
                              Contact Person: <strong className={item.contactPerson && item.contactPerson !== 'Not found' && item.contactPerson !== 'Owner / Manager' ? 'text-slate-900 font-bold' : 'text-slate-400 font-normal italic'}>
                                {item.contactPerson && item.contactPerson !== 'Owner / Manager' ? item.contactPerson : 'Not found'}
                              </strong>
                            </span>
                            <span>•</span>
                            <span>
                              Email: {item.email && item.email !== 'Not found' && !item.email.includes('domain.com') ? (
                                <a href={`mailto:${item.email}`} className="text-indigo-600 font-semibold hover:underline">
                                  {item.email}
                                </a>
                              ) : (
                                <span className="text-slate-400 font-normal italic">Not publicly available</span>
                              )}
                            </span>
                            <span>•</span>
                            <span>
                              Phone: {item.phone && item.phone !== 'Not found' ? (
                                <span className="text-slate-800 font-semibold">{item.phone}</span>
                              ) : (
                                <span className="text-slate-400 font-normal italic">Not found</span>
                              )}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1" title={item.address || ''}>
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {item.address || `${item.city || city || 'Local'}, ${item.country || country}`}
                            </span>
                            <span>•</span>
                            {item.website && item.website !== 'Not found' && !item.website.includes('domain.com') ? (
                              <a
                                href={item.website?.startsWith('http') ? item.website : `https://${item.website}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 hover:underline flex items-center gap-1 font-semibold"
                              >
                                {item.website} <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <span className="text-slate-400 font-normal italic">Website: Not listed</span>
                            )}
                          </div>

                          {/* Source & Source URL */}
                          <div className="text-[11px] text-slate-500 font-medium flex items-center gap-3 pt-0.5">
                            <span>Source Provider: <strong className="text-slate-800">{item.source || 'Google Live Search Provider'}</strong></span>
                            {item.sourceUrl && (
                              <>
                                <span>•</span>
                                <a
                                  href={item.sourceUrl.startsWith('http') ? item.sourceUrl : `https://${item.sourceUrl}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-indigo-600 hover:underline flex items-center gap-1 font-mono text-[10px]"
                                >
                                  [Source Listing] <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              </>
                            )}
                          </div>

                          <p className="text-xs text-slate-600 bg-slate-100 p-2.5 rounded-xl border border-slate-200/80">
                            <strong>Evidence:</strong> {item.evidenceText || item.auditIssue}
                          </p>
                        </div>

                        {/* Scores & Value Box */}
                        <div className="flex flex-wrap md:flex-col items-end gap-2 shrink-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-slate-500">Verification:</span>
                            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 font-black text-xs rounded-xl border border-emerald-300 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {item.verificationScore || 90}/100
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-slate-500">Qualification:</span>
                            <button
                              onClick={() => setActiveScoreModal({ lead: item, scoreData })}
                              className="px-2.5 py-1 bg-slate-900 text-white font-extrabold text-xs rounded-xl hover:bg-slate-800 transition flex items-center gap-1 shadow-xs"
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
            hasExecutedSearch && !loading && !apiError && (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3">
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200">
                  <Database className="w-6 h-6" />
                </div>
                <h4 className="font-extrabold text-slate-900 text-base">No verified live leads found</h4>
                <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                  No live businesses matching <strong>{country} → {city || "All Cities"} → {industry}</strong> were returned by the connected provider.
                </p>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 max-w-md mx-auto font-medium">
                  Zero fake leads or fallback demo records were substituted. Configure your provider or adjust location parameters to retry.
                </div>
              </div>
            )
          )}

          {!hasExecutedSearch && !loading && !apiError && (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3">
              <Sparkles className="w-10 h-10 text-indigo-500 mx-auto" />
              <h4 className="font-extrabold text-slate-900 text-base">Live Lead Discovery Engine Ready</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Select your discovery parameters (Country, Industry, City, Opportunity Type) and click <strong>Run Verified Client Search</strong> to fetch live prospects from your connected Live Data Provider.
              </p>
            </div>
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

      {/* DATA SOURCE CONFIG & HEALTH MODAL */}
      <DataSourceConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        currentProviderId={selectedProviderId}
        onSelectProvider={(id) => setSelectedProviderId(id)}
        onConfigSaved={() => {
          fetchProviderHealth();
        }}
      />
    </div>
  );
};
