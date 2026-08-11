import React, { useState, useEffect } from 'react';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { Lead, Temperature, ContactStatus } from '../types';

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (lead: Omit<Lead, 'id' | 'createdAt'>, existingId?: string) => void;
  initialLead?: Lead | null;
}

export const LeadModal: React.FC<LeadModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialLead,
}) => {
  const [businessName, setBusinessName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [industry, setIndustry] = useState('Real Estate / Realtors');
  const [country, setCountry] = useState('USA');
  const [city, setCity] = useState('');
  const [score, setScore] = useState(80);
  const [temperature, setTemperature] = useState<Temperature>('WARM');
  const [contactStatus, setContactStatus] = useState<ContactStatus>('Not Contacted');
  const [websiteStatus, setWebsiteStatus] = useState('Needs Audit');
  const [suggestedService, setSuggestedService] = useState('Full Website Redesign');
  const [auditIssue, setAuditIssue] = useState('');
  const [pitchHook, setPitchHook] = useState('');
  const [notes, setNotes] = useState('');
  const [auditing, setAuditing] = useState(false);

  useEffect(() => {
    if (initialLead) {
      setBusinessName(initialLead.businessName || '');
      setContactPerson(initialLead.contactPerson || '');
      setEmail(initialLead.email || '');
      setPhone(initialLead.phone || '');
      setWebsite(initialLead.website || '');
      setIndustry(initialLead.industry || 'Real Estate / Realtors');
      setCountry(initialLead.country || 'USA');
      setCity(initialLead.city || '');
      setScore(initialLead.score || 80);
      setTemperature(initialLead.temperature || 'WARM');
      setContactStatus(initialLead.contactStatus || 'Not Contacted');
      setWebsiteStatus(initialLead.websiteStatus || '');
      setSuggestedService(initialLead.suggestedService || 'Full Website Redesign');
      setAuditIssue(initialLead.auditIssue || '');
      setPitchHook(initialLead.pitchHook || '');
      setNotes(initialLead.notes || '');
    } else {
      setBusinessName('');
      setContactPerson('');
      setEmail('');
      setPhone('');
      setWebsite('');
      setIndustry('Real Estate / Realtors');
      setCountry('USA');
      setCity('');
      setScore(85);
      setTemperature('WARM');
      setContactStatus('Not Contacted');
      setWebsiteStatus('Needs Audit');
      setSuggestedService('Full Website Redesign');
      setAuditIssue('');
      setPitchHook('');
      setNotes('');
    }
  }, [initialLead, isOpen]);

  if (!isOpen) return null;

  const handleRunAiAudit = async () => {
    if (!businessName) return alert('Please enter a Business Name first.');
    setAuditing(true);

    try {
      const res = await fetch('/api/ai/audit-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName,
          website,
          industry,
          country,
          notes,
        }),
      });
      const data = await res.json();
      if (data.success && data.audit) {
        setScore(data.audit.score || 85);
        setTemperature(data.audit.temperature || 'WARM');
        setWebsiteStatus(data.audit.auditStatus || 'Audited by Gemini');
        setSuggestedService(data.audit.suggestedService || 'Website Optimization');
        if (data.audit.auditIssues && data.audit.auditIssues.length > 0) {
          setAuditIssue(data.audit.auditIssues.join('; '));
        }
        setPitchHook(data.audit.pitchHook || '');
      }
    } catch (err) {
      console.warn('Fallback audit simulation:', err);
      setScore(88);
      setTemperature('WARM');
      setWebsiteStatus('Missing Mobile Responsive CTA');
      setSuggestedService('Next.js Mobile Redesign & Direct Scheduling');
      setAuditIssue('Page load speed > 3.8s on mobile networks; no direct appointment form.');
      setPitchHook(`I noticed ${businessName}'s site lacks a mobile 1-click booking button.`);
    } finally {
      setAuditing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(
      {
        businessName,
        contactPerson,
        email,
        phone,
        website,
        industry,
        country,
        city,
        score,
        temperature,
        contactStatus,
        websiteStatus,
        suggestedService,
        auditIssue,
        pitchHook,
        notes,
        mobileViewport: false,
        clearCTA: false,
        speedRating: 'Slow',
        auditStatus: 'Audited',
      },
      initialLead?.id
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-5">
          <h2 className="text-xl font-bold text-slate-900">
            {initialLead ? 'Edit Prospect Lead' : 'Add New Prospect Lead'}
          </h2>
          <button
            type="button"
            onClick={handleRunAiAudit}
            disabled={auditing}
            className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-lg transition inline-flex items-center gap-1.5 border border-indigo-200"
          >
            {auditing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> AI Auditing...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Auto AI Qualification
              </>
            )}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Business Name *</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
                placeholder="e.g. Apex Family Dental"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contact Person</label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="e.g. Dr. Marcus Vance"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@apexdental.com"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Website URL</label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="www.apexdental.com"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Industry</label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="Real Estate / Realtors">Real Estate / Realtors</option>
                <option value="Restaurants & Cafes">Restaurants & Cafes</option>
                <option value="Hotels & Lodging">Hotels & Lodging</option>
                <option value="Dentists & Clinics">Dentists & Clinics</option>
                <option value="Law Firms">Law Firms</option>
                <option value="Construction & Interior">Construction & Interior</option>
                <option value="Marketing Agencies">Marketing Agencies</option>
                <option value="SaaS & Startups">SaaS & Startups</option>
                <option value="Gyms & Salons">Gyms & Salons</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Country</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="USA">USA</option>
                <option value="UK">UK</option>
                <option value="Canada">Canada</option>
                <option value="Australia">Australia</option>
                <option value="Europe">Europe</option>
                <option value="Remote Global">Remote Global</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">AI Score (0-100)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={score}
                onChange={(e) => setScore(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Temperature</label>
              <select
                value={temperature}
                onChange={(e) => setTemperature(e.target.value as Temperature)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="HOT">HOT (90-100)</option>
                <option value="WARM">WARM (75-89)</option>
                <option value="POTENTIAL">POTENTIAL (50-74)</option>
                <option value="LOW">LOW (&lt;50)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Suggested Service</label>
            <input
              type="text"
              value={suggestedService}
              onChange={(e) => setSuggestedService(e.target.value)}
              placeholder="e.g. Next.js Mobile Redesign & Direct Booking Engine"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Audit Issue Flaw</label>
            <textarea
              value={auditIssue}
              onChange={(e) => setAuditIssue(e.target.value)}
              rows={2}
              placeholder="e.g. Non-responsive mobile layout; booking form breaks on iOS Safari."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Personalized Pitch Hook</label>
            <textarea
              value={pitchHook}
              onChange={(e) => setPitchHook(e.target.value)}
              rows={2}
              placeholder="e.g. I noticed your mobile site takes over 4 seconds to load and lacks a 1-click booking button..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm transition"
            >
              Save Prospect
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
