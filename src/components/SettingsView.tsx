import React, { useState } from 'react';
import { UserProfile } from '../types';
import { Key, User, RotateCcw, CheckCircle2, Sparkles, RefreshCw } from 'lucide-react';

interface SettingsViewProps {
  profile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  onResetData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  profile,
  onUpdateProfile,
  onResetData,
}) => {
  const [formData, setFormData] = useState<UserProfile>(profile);
  const [saved, setSaved] = useState(false);
  const [testingAi, setTestingAi] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<string | null>(null);

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
        setAiTestResult('Server online & Gemini 3.6 Flash engine connected successfully!');
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
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          API Credentials & Profile Settings
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure freelancer persona defaults, Gemini AI model connection, and data controls.
        </p>
      </div>

      {/* Gemini API Key Panel */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-base">Gemini AI Integration</h3>
          </div>
          <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-300">
            Runtime Injected
          </span>
        </div>
        <p className="text-xs text-slate-500">
          The app uses the server-side <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-indigo-700">GEMINI_API_KEY</code> environment variable automatically attached to Cloud Run container secrets.
        </p>
        <div className="pt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={handleTestAi}
            disabled={testingAi}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition inline-flex items-center gap-1.5 shadow-sm"
          >
            {testingAi ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Testing Connection...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" /> Test Gemini AI Connection
              </>
            )}
          </button>
          {aiTestResult && (
            <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {aiTestResult}
            </span>
          )}
        </div>
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
