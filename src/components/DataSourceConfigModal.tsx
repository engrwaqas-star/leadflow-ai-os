import React, { useState, useEffect } from 'react';
import { 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  RefreshCw, 
  Key, 
  ShieldCheck, 
  Activity,
  Sliders,
  Layers,
  MapPin,
  Search,
  Globe
} from 'lucide-react';
import { loggedFetch } from '../utils/apiLogger';

interface DataSourceConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved?: () => void;
  currentProviderId?: string;
  onSelectProvider?: (providerId: string) => void;
}

export const DataSourceConfigModal: React.FC<DataSourceConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved,
  currentProviderId = 'serpapi-search',
  onSelectProvider,
}) => {
  const [apiKey, setApiKey] = useState('');
  const [openrouterKey, setOpenrouterKey] = useState('');
  const [foursquareKey, setFoursquareKey] = useState('');
  const [serpapiKey, setSerpapiKey] = useState('');
  const [yelpKey, setYelpKey] = useState('');

  const [selectedProviderId, setSelectedProviderId] = useState(currentProviderId);
  const [loading, setLoading] = useState(false);
  const [healthData, setHealthData] = useState<any>(null);
  const [allProviders, setAllProviders] = useState<any[]>([]);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; statusCode?: number; provider?: string } | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    const { ok, data } = await loggedFetch(`/api/provider/status?providerId=${selectedProviderId}`);
    if (ok && data) {
      if (data.health) setHealthData(data.health);
      if (data.allProviders) setAllProviders(data.allProviders);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen, selectedProviderId]);

  const handleTestConnection = async (testId?: string) => {
    setLoading(true);
    setTestResult(null);

    const targetId = testId || selectedProviderId;

    const { ok, data } = await loggedFetch('/api/provider/test-connection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ providerId: targetId }),
    });

    if (data) {
      setTestResult({
        success: Boolean(data.success),
        message: data.message || 'Test execution completed',
        statusCode: data.statusCode,
        provider: data.provider,
      });
      fetchStatus();
    } else {
      setTestResult({
        success: false,
        message: 'Failed to communicate with provider test endpoint.',
      });
    }
    setLoading(false);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTestResult(null);

    const { ok, data } = await loggedFetch('/api/provider/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        apiKey, 
        openrouterKey,
        foursquareKey, 
        serpapiKey, 
        yelpKey, 
        providerId: selectedProviderId 
      }),
    });

    if (data) {
      setTestResult({
        success: Boolean(data.success),
        message: data.message || 'Provider configuration updated successfully.',
        statusCode: data.statusCode,
        provider: data.provider,
      });
      if (data.health) setHealthData(data.health);
      if (data.allProviders) setAllProviders(data.allProviders);
      if (onSelectProvider) onSelectProvider(selectedProviderId);
      if (onConfigSaved) onConfigSaved();
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden space-y-0">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="font-extrabold text-base tracking-tight">DATA SOURCES & LIVE PROVIDERS</h3>
              <p className="text-xs text-slate-400">Configure & verify live B2B lead discovery engines</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Active Provider Selector Tabs */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
              Active Lead Discovery Provider
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { id: 'google-search-live', name: 'Google Live Web Search', badge: 'Grounded Web', icon: Globe },
                { id: 'foursquare-places', name: 'Foursquare Places API', badge: '500 Free Pro Calls', icon: MapPin },
                { id: 'serpapi-search', name: 'SerpApi Google & Maps', badge: '250 Free Searches/Mo', icon: Search },
                { id: 'yelp-fusion', name: 'Yelp Fusion Places API', badge: 'Directory Listings', icon: Database },
                { id: 'auto-multi', name: 'Multi-Source Aggregator', badge: 'All Active Providers', icon: Layers },
              ].map((p) => {
                const Icon = p.icon;
                const isSelected = selectedProviderId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedProviderId(p.id);
                      if (onSelectProvider) onSelectProvider(p.id);
                    }}
                    className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 ${
                      isSelected 
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-950 ring-2 ring-indigo-500/20' 
                        : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? 'text-indigo-600' : 'text-slate-500'}`} />
                    <div className="space-y-0.5">
                      <div className="font-extrabold text-xs">{p.name}</div>
                      <span className="text-[10px] font-semibold text-slate-500 bg-white/80 px-1.5 py-0.5 rounded border border-slate-200 inline-block">
                        {p.badge}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Connected Health Status Card */}
          <div className="bg-slate-900 text-white rounded-xl p-4 space-y-3 border border-slate-800 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-indigo-400" /> Active Provider Health
              </span>

              {healthData?.status === 'Connected' ? (
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 font-extrabold text-xs rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Connected
                </span>
              ) : healthData?.status === 'Rate Limited' ? (
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 font-extrabold text-xs rounded-full border border-amber-500/30 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Rate Limited (429)
                </span>
              ) : (
                <span className="px-2.5 py-0.5 bg-rose-500/20 text-rose-300 font-extrabold text-xs rounded-full border border-rose-500/30 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> Not Configured
                </span>
              )}
            </div>

            <div className="text-xs text-slate-300 space-y-1 font-medium">
              <div>Selected: <strong className="text-white">{healthData?.providerName || 'Google Live Web Search Engine'}</strong></div>
              {healthData?.lastSuccessfulSearch && (
                <div>Last Search: <strong className="text-white">{new Date(healthData.lastSuccessfulSearch).toLocaleTimeString()}</strong></div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-800">
              <span className="text-[11px] text-slate-400">
                Supports real B2B prospect search with zero fake records
              </span>

              <button
                type="button"
                onClick={() => handleTestConnection(selectedProviderId)}
                disabled={loading}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition inline-flex items-center gap-1.5"
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                Test Selected Provider
              </button>
            </div>
          </div>

          {/* Test Connection Output Alert */}
          {testResult && (
            <div className={`p-4 rounded-xl border text-xs font-semibold space-y-1 ${
              testResult.success 
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
                : 'bg-rose-50 text-rose-900 border-rose-200'
            }`}>
              <div className="flex items-center gap-2">
                {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
                <strong>[{testResult.provider || 'Provider Test'}] {testResult.success ? 'Connection Verified' : 'Connection Failed'}</strong>
              </div>
              <p className="text-slate-700 font-normal">{testResult.message}</p>
            </div>
          )}

          {/* Provider API Credentials Form */}
          <form onSubmit={handleSaveConfig} className="space-y-4 pt-2">
            <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider">
              Optional Direct API Credentials
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Gemini API Key (GEMINI_API_KEY)
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Primary Gemini API key..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 pr-8 text-xs text-slate-800 font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <Key className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3" />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                  OpenRouter API Key (Fallback)
                  <span className="text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded font-extrabold border border-indigo-200">Auto-Switch</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={openrouterKey}
                    onChange={(e) => setOpenrouterKey(e.target.value)}
                    placeholder="OpenRouter key for Gemini quota fallback..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 pr-8 text-xs text-slate-800 font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <Key className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3" />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Foursquare API Key (FOURSQUARE_API_KEY)
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={foursquareKey}
                    onChange={(e) => setFoursquareKey(e.target.value)}
                    placeholder="Optional Foursquare v3 key..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 pr-8 text-xs text-slate-800 font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <Key className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3" />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  SerpApi Key (SERPAPI_API_KEY)
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={serpapiKey}
                    onChange={(e) => setSerpapiKey(e.target.value)}
                    placeholder="Optional SerpApi key..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 pr-8 text-xs text-slate-800 font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <Key className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3" />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Yelp Fusion Key (YELP_API_KEY)
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={yelpKey}
                    onChange={(e) => setYelpKey(e.target.value)}
                    placeholder="Optional Yelp Fusion key..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 pr-8 text-xs text-slate-800 font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <Key className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3" />
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              Note: If specific API keys are omitted, providers utilize Grounded Search Index mode to locate real directory listings.
            </p>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition inline-flex items-center gap-1.5"
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sliders className="w-3.5 h-3.5" />}
                Save Configuration & Activate Provider
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
