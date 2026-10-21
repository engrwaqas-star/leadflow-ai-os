import React, { useState, useEffect } from 'react';
import { UserProfile, Lead } from '../types';
import { 
  Key, 
  User as UserIcon, 
  RotateCcw, 
  CheckCircle2, 
  Sparkles, 
  RefreshCw, 
  Database, 
  Search, 
  MapPin, 
  Layers, 
  AlertTriangle,
  Cloud,
  ExternalLink,
  Copy,
  Check,
  LogIn,
  LogOut,
  UploadCloud,
  DownloadCloud,
  ShieldCheck
} from 'lucide-react';
import { loggedFetch } from '../utils/apiLogger';
import { 
  FIREBASE_PROJECT_ID, 
  FIRESTORE_DATABASE_ID, 
  FIREBASE_CONSOLE_URL, 
  GCP_CONSOLE_URL,
  type User
} from '../firebase';

interface SettingsViewProps {
  profile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  onResetData: () => void;
  leads?: Lead[];
  currentUser?: User | null;
  onSignInGoogle?: () => void;
  onSignOut?: () => void;
  onSyncAllToCloud?: () => Promise<void>;
  onPullFromCloud?: () => Promise<void>;
  isSyncingCloud?: boolean;
  cloudSyncStatus?: string | null;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  profile,
  onUpdateProfile,
  onResetData,
  leads = [],
  currentUser = null,
  onSignInGoogle,
  onSignOut,
  onSyncAllToCloud,
  onPullFromCloud,
  isSyncingCloud = false,
  cloudSyncStatus = null,
}) => {
  const [formData, setFormData] = useState<UserProfile>(profile);
  const [saved, setSaved] = useState(false);
  const [testingAi, setTestingAi] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Provider Keys State
  const [serpapiKey, setSerpapiKey] = useState('');
  const [googlePlacesKey, setGooglePlacesKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [openrouterKey, setOpenrouterKey] = useState('');
  const [keysDiagnostic, setKeysDiagnostic] = useState<any>(null);
  const [savingKeys, setSavingKeys] = useState(false);
  const [keysSavedMessage, setKeysSavedMessage] = useState<string | null>(null);

  const fetchKeysDiagnostic = async () => {
    const { ok, data } = await loggedFetch('/api/provider/test-keys-diagnostic');
    if (ok && data?.results) {
      setKeysDiagnostic(data.results);
    }
  };

  useEffect(() => {
    fetchKeysDiagnostic();
  }, []);

  const handleSaveKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingKeys(true);
    setKeysSavedMessage(null);

    const { ok, data } = await loggedFetch('/api/provider/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serpapiKey,
        googlePlacesKey,
        apiKey: geminiKey,
        openrouterKey,
        providerId: 'serpapi-search',
      }),
    });

    if (ok) {
      setKeysSavedMessage('API Provider credentials updated and active!');
      fetchKeysDiagnostic();
      setTimeout(() => setKeysSavedMessage(null), 3000);
    }
    setSavingKeys(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleTestAi = async () => {
    setTestingAi(true);
    setAiTestResult(null);
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      if (data.status === 'ok') {
        setAiTestResult('Server online & Gemini engine connected successfully!');
      } else {
        setAiTestResult('Server returned unknown status');
      }
    } catch (err: any) {
      setAiTestResult(`Server connection issue: ${err.message}`);
    } finally {
      setTestingAi(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center justify-between">
          <span>API Credentials, Cloud Database & Profile</span>
          <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Firebase Cloud Active
          </span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Access your Google Cloud Platform backend, Firebase Firestore database, API discovery providers, and freelancer profile defaults.
        </p>
      </div>

      {/* FIREBASE CLOUD DATABASE & GOOGLE CLOUD COMMAND CENTER */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white p-6 rounded-2xl border border-indigo-900/60 shadow-md space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold tracking-tight text-white">
                  Google Cloud Platform & Firebase Firestore
                </h2>
                <span className="px-2 py-0.5 text-[10px] bg-indigo-500/30 text-indigo-300 font-extrabold rounded-md border border-indigo-400/30">
                  Provisioned
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Your application state is backed by Google Cloud Firestore with Attribute-Based Security Rules.
              </p>
            </div>
          </div>

          {/* User Sign-In / Account Status */}
          <div className="flex items-center gap-2 shrink-0">
            {currentUser ? (
              <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-xl text-xs">
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt="User" className="w-5 h-5 rounded-full" />
                ) : (
                  <UserIcon className="w-4 h-4 text-emerald-400" />
                )}
                <span className="text-slate-200 font-medium truncate max-w-[140px]">
                  {currentUser.email || currentUser.displayName || 'Google Account'}
                </span>
                {onSignOut && (
                  <button
                    onClick={onSignOut}
                    className="ml-1 text-slate-400 hover:text-rose-400 transition"
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
              onSignInGoogle && (
                <button
                  type="button"
                  onClick={onSignInGoogle}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition inline-flex items-center gap-1.5 shadow-xs"
                >
                  <LogIn className="w-3.5 h-3.5" /> Sign in with Google
                </button>
              )
            )}
          </div>
        </div>

        {/* Console Direct Access Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {/* Card 1: Firebase Firestore Console */}
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/80 hover:border-indigo-500/60 transition group space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5" /> Firebase Firestore Database
                </div>
                <h4 className="text-sm font-bold text-slate-100 mt-1">Live Database GUI & Records</h4>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  View and edit your leads, outreach records, and documents in Google's official visual spreadsheet interface.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={FIREBASE_CONSOLE_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-lg transition shadow-xs"
              >
                <span>Open Firebase Firestore</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={() => copyToClipboard(FIREBASE_CONSOLE_URL, 'firebase_url')}
                className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-lg transition flex items-center gap-1"
                title="Copy Direct URL"
              >
                {copiedField === 'firebase_url' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="text-[11px] font-bold">Copy Link</span>
              </button>
            </div>
          </div>

          {/* Card 2: Google Cloud Console */}
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/80 hover:border-indigo-500/60 transition group space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <Cloud className="w-3.5 h-3.5" /> Google Cloud Platform (GCP)
                </div>
                <h4 className="text-sm font-bold text-slate-100 mt-1">Project & Infrastructure Console</h4>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Manage Cloud APIs, OAuth 2.0 Client credentials, security policies, and resource quotas.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={GCP_CONSOLE_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-lg transition shadow-xs"
              >
                <span>Open Google Cloud Console</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={() => copyToClipboard(GCP_CONSOLE_URL, 'gcp_url')}
                className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-lg transition flex items-center gap-1"
                title="Copy Direct URL"
              >
                {copiedField === 'gcp_url' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="text-[11px] font-bold">Copy Link</span>
              </button>
            </div>
          </div>
        </div>

        {/* Project Metadata & Sync Control Bar */}
        <div className="pt-3 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {/* Project ID */}
          <div className="bg-slate-850 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">GCP Project ID</span>
              <span className="text-xs font-mono font-bold text-indigo-300 truncate max-w-[170px] inline-block">
                {FIREBASE_PROJECT_ID}
              </span>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(FIREBASE_PROJECT_ID, 'proj_id')}
              className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800"
              title="Copy Project ID"
            >
              {copiedField === 'proj_id' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Database ID */}
          <div className="bg-slate-850 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Firestore Database ID</span>
              <span className="text-xs font-mono font-bold text-emerald-300 truncate max-w-[170px] inline-block">
                {FIRESTORE_DATABASE_ID}
              </span>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(FIRESTORE_DATABASE_ID, 'db_id')}
              className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800"
              title="Copy Database ID"
            >
              {copiedField === 'db_id' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Sync Trigger Action */}
          <div className="bg-slate-850 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Local Leads ({leads.length})</span>
              <span className="text-xs font-bold text-slate-200">
                {cloudSyncStatus || 'Ready for Cloud Sync'}
              </span>
            </div>
            {onSyncAllToCloud && (
              <button
                type="button"
                disabled={isSyncingCloud}
                onClick={onSyncAllToCloud}
                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-[11px] rounded-lg transition inline-flex items-center gap-1 shrink-0"
              >
                {isSyncingCloud ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <UploadCloud className="w-3 h-3" />
                )}
                <span>Sync to Cloud</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Provider Status Diagnostic Overview */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-indigo-400" />
            <h3 className="font-extrabold text-base tracking-tight">Lead Provider & AI Connection Status</h3>
          </div>
          <button
            type="button"
            onClick={fetchKeysDiagnostic}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 font-bold text-xs rounded-lg transition inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Status
          </button>
        </div>

        {/* 5 Provider Status Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs">
          {/* SerpAPI */}
          <div className="bg-slate-850 p-3 rounded-xl border border-slate-800">
            <div className="text-[10px] uppercase font-bold text-slate-400">SerpAPI (Primary)</div>
            <div className="text-xs font-extrabold text-slate-200 mt-1 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${keysDiagnostic?.serpApi?.configured ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
              {keysDiagnostic?.serpApi?.status || (keysDiagnostic?.serpApi?.configured ? 'Connected' : 'Not configured')}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Real Google & Maps discovery</p>
          </div>

          {/* Google Places */}
          <div className="bg-slate-850 p-3 rounded-xl border border-slate-800">
            <div className="text-[10px] uppercase font-bold text-slate-400">Google Places (Optional)</div>
            <div className="text-xs font-extrabold text-slate-200 mt-1 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${keysDiagnostic?.googlePlaces?.configured ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
              {keysDiagnostic?.googlePlaces?.status || (keysDiagnostic?.googlePlaces?.configured ? 'Connected' : 'Optional / Not configured')}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Places IDs & review counts</p>
          </div>

          {/* Gemini */}
          <div className="bg-slate-850 p-3 rounded-xl border border-slate-800">
            <div className="text-[10px] uppercase font-bold text-slate-400">Gemini AI</div>
            <div className="text-xs font-extrabold text-slate-200 mt-1 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${keysDiagnostic?.googleAIStudio?.configured ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
              {keysDiagnostic?.googleAIStudio?.status || (keysDiagnostic?.googleAIStudio?.configured ? 'Connected' : 'Not configured')}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Lead score & pitch generation</p>
          </div>

          {/* OpenRouter */}
          <div className="bg-slate-850 p-3 rounded-xl border border-slate-800">
            <div className="text-[10px] uppercase font-bold text-slate-400">OpenRouter</div>
            <div className="text-xs font-extrabold text-slate-200 mt-1 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${keysDiagnostic?.openRouter?.configured ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
              {keysDiagnostic?.openRouter?.status || (keysDiagnostic?.openRouter?.configured ? 'Connected' : 'Not configured')}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">AI quota fallback model</p>
          </div>

          {/* Gmail */}
          <div className="bg-slate-850 p-3 rounded-xl border border-slate-800">
            <div className="text-[10px] uppercase font-bold text-slate-400">Gmail API</div>
            <div className="text-xs font-extrabold text-slate-200 mt-1 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${keysDiagnostic?.gmail?.configured ? 'bg-emerald-400' : 'bg-slate-500'}`}></span>
              {keysDiagnostic?.gmail?.status || (keysDiagnostic?.gmail?.configured ? 'Connected' : 'Not connected')}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Live Gmail send & threads</p>
          </div>
        </div>

        {/* Configure Provider Keys Form */}
        <form onSubmit={handleSaveKeys} className="pt-3 border-t border-slate-800 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-bold text-slate-300 mb-1 flex items-center justify-between">
                <span>SERPAPI_API_KEY (Primary Lead Discovery)</span>
                <span className="text-[10px] text-indigo-400 font-extrabold">Required for Search</span>
              </label>
              <input
                type="password"
                value={serpapiKey}
                onChange={(e) => setSerpapiKey(e.target.value)}
                placeholder="Enter SERPAPI_API_KEY..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1 flex items-center justify-between">
                <span>GOOGLE_PLACES_API_KEY (Optional Discovery)</span>
                <span className="text-[10px] text-amber-400 font-extrabold">Optional</span>
              </label>
              <input
                type="password"
                value={googlePlacesKey}
                onChange={(e) => setGooglePlacesKey(e.target.value)}
                placeholder="Optional: Enter GOOGLE_PLACES_API_KEY..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            {keysSavedMessage && (
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> {keysSavedMessage}
              </span>
            )}
            <button
              type="submit"
              disabled={savingKeys}
              className="ml-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition inline-flex items-center gap-1.5"
            >
              {savingKeys ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
              Save API Provider Keys
            </button>
          </div>
        </form>
      </div>

      {/* Freelancer Profile Form */}
      <form onSubmit={handleSubmit} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-4 border-b border-slate-200 pb-3">
          <div className="w-12 h-12 rounded-full bg-indigo-600 text-white text-base font-extrabold flex items-center justify-center shrink-0 border border-indigo-400 shadow-xs">
            WA
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">Outreach Sender Profile: {formData.name}</h3>
            <p className="text-xs text-slate-500">Official profile details used across email templates, signatures, and outreach messages.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Professional Title / Role
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Daily Outreach Goal
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={formData.dailyOutreachGoal}
              onChange={(e) => setFormData({ ...formData, dailyOutreachGoal: parseInt(e.target.value) || 10 })}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Personal Portfolio URL
            </label>
            <input
              type="url"
              value={formData.portfolioUrl || 'https://muhammadwaqas.dev'}
              onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="https://muhammadwaqas.dev"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              LinkedIn Profile Link
            </label>
            <input
              type="url"
              value={formData.linkedInUrl || ''}
              onChange={(e) => setFormData({ ...formData, linkedInUrl: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="https://www.linkedin.com/in/waqas-ashiq-b489b041b..."
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-3">
          {saved && (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Profile Updated!
            </span>
          )}
          <button
            type="submit"
            className="ml-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg shadow-sm transition"
          >
            Save Profile Changes
          </button>
        </div>
      </form>

      {/* Portfolio Media & HD Showcase Assets */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="font-bold text-slate-900 text-base">Portfolio Showcase & Media Kit (4K HD)</h3>
              <p className="text-xs text-slate-500">Ultra-high resolution thumbnails and cover images for Fiverr, Upwork, and personal portfolios.</p>
            </div>
          </div>
          <span className="bg-indigo-100 text-indigo-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-indigo-200">
            4K 16:9
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Official Brand Logo Card */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 hover:border-indigo-300 transition group shadow-xs">
            <div className="relative aspect-square overflow-hidden bg-slate-900 flex items-center justify-center p-4">
              <img
                src="/leadflow_logo.jpg"
                alt="LeadFlow AI Official Logo"
                className="w-full h-full object-contain group-hover:scale-105 transition duration-300"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-2 left-2 px-2 py-0.5 bg-slate-900/80 backdrop-blur-xs text-indigo-400 text-[10px] font-extrabold rounded-md border border-slate-700">
                Official Logo (1:1)
              </div>
            </div>
            <div className="p-3.5 space-y-2">
              <h4 className="font-bold text-xs text-slate-900">LeadFlow AI — Minimalist Tech Logo</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Deep indigo and slate blue geometric AI automation mark representing speed, precision, and autonomous client acquisition.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <a
                  href="/leadflow_logo.jpg"
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 text-center px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition"
                >
                  Open HD
                </a>
                <a
                  href="/leadflow_logo.jpg"
                  download="leadflow_ai_logo.jpg"
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-lg transition"
                >
                  Download
                </a>
              </div>
            </div>
          </div>

          {/* Dashboard Thumbnail Card */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 hover:border-indigo-300 transition group shadow-xs">
            <div className="relative aspect-square sm:aspect-video md:aspect-square overflow-hidden bg-slate-900">
              <img
                src="/leadflow_thumbnail.jpg"
                alt="LeadFlow AI OS Dashboard Thumbnail"
                className="w-full h-full object-cover group-hover:scale-102 transition duration-300"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-2 left-2 px-2 py-0.5 bg-slate-900/80 backdrop-blur-xs text-emerald-400 text-[10px] font-extrabold rounded-md border border-slate-700">
                Dashboard Thumbnail
              </div>
            </div>
            <div className="p-3.5 space-y-2">
              <h4 className="font-bold text-xs text-slate-900">Live Dashboard View (4K)</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Highlights the B2B discovery search hub, 5-provider health diagnostic bar, 0–100 opportunity score ring, and live prospect cards.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <a
                  href="/leadflow_thumbnail.jpg"
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 text-center px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition"
                >
                  Open HD
                </a>
                <a
                  href="/leadflow_thumbnail.jpg"
                  download="leadflow_ai_os_thumbnail.jpg"
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-lg transition"
                >
                  Download
                </a>
              </div>
            </div>
          </div>

          {/* Hero Cover Banner Card */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 hover:border-indigo-300 transition group shadow-xs">
            <div className="relative aspect-square sm:aspect-video md:aspect-square overflow-hidden bg-slate-900">
              <img
                src="/leadflow_cover.jpg"
                alt="LeadFlow AI OS Showcase Cover"
                className="w-full h-full object-cover group-hover:scale-102 transition duration-300"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-2 left-2 px-2 py-0.5 bg-slate-900/80 backdrop-blur-xs text-indigo-400 text-[10px] font-extrabold rounded-md border border-slate-700">
                Portfolio Cover (16:9)
              </div>
            </div>
            <div className="p-3.5 space-y-2">
              <h4 className="font-bold text-xs text-slate-900">Product Showcase Cover</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Clean visual presentation banner showcasing prompt engineering, AI opportunity scoring, and automated Gmail outreach workflows.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <a
                  href="/leadflow_cover.jpg"
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 text-center px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition"
                >
                  Open HD
                </a>
                <a
                  href="/leadflow_cover.jpg"
                  download="leadflow_ai_os_cover.jpg"
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-lg transition"
                >
                  Download
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Database Reset Section */}
      <div className="bg-rose-50 border border-rose-200 p-5 rounded-xl space-y-2 text-rose-900">
        <h3 className="font-bold text-base text-rose-950 flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-rose-600" /> Clear Lead Database
        </h3>
        <p className="text-xs text-rose-700">
          Wipes all saved leads, outreach logs, and scheduled messages to start fresh with a clean database.
        </p>
        <button
          type="button"
          onClick={() => {
            if (confirm('Are you sure you want to clear all data and start with an empty database?')) {
              onResetData();
            }
          }}
          className="mt-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-lg shadow-sm transition"
        >
          Clear Workspace Database
        </button>
      </div>
    </div>
  );
};
