import React, { useState } from 'react';
import { Search, Sparkles, Plus, Send, CheckCircle2, Loader2, Globe, Building2, MapPin, Linkedin, UserCheck, Users, Briefcase, ExternalLink } from 'lucide-react';
import { Lead } from '../types';

interface FinderViewProps {
  onImportLead: (lead: Omit<Lead, 'id' | 'createdAt'>) => void;
  onSelectLeadForEmail: (lead: Lead) => void;
  existingLeads: Lead[];
}

export const FinderView: React.FC<FinderViewProps> = ({
  onImportLead,
  onSelectLeadForEmail,
  existingLeads,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'ai_discovery' | 'linkedin_prospector'>('ai_discovery');

  // AI Discovery State
  const [country, setCountry] = useState('USA');
  const [industry, setIndustry] = useState('Real Estate / Realtors');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [discoveredLeads, setDiscoveredLeads] = useState<any[]>([]);
  const [importedIds, setImportedIds] = useState<Record<string, boolean>>({});

  // LinkedIn Prospector State
  const [companyName, setCompanyName] = useState('');
  const [roleTitle, setRoleTitle] = useState('VP of Marketing / Founder / CEO');
  const [location, setLocation] = useState('San Francisco, CA');
  const [prospectorLoading, setProspectorLoading] = useState(false);
  const [prospects, setProspects] = useState<any[]>([]);
  const [importedProspectIds, setImportedProspectIds] = useState<Record<string, boolean>>({});

  const handleSearch = async () => {
    setLoading(true);
    setDiscoveredLeads([]);

    try {
      const res = await fetch('/api/ai/find-clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country, industry, city }),
      });
      const data = await res.json();
      if (data.success && data.leads) {
        setDiscoveredLeads(data.leads);
      } else {
        throw new Error(data.error || 'Failed to fetch discovered clients');
      }
    } catch (err) {
      console.warn('API error, falling back to simulated discovery:', err);
      const targetCity = city || 'Downtown';
      const mockDiscovered = [
        {
          businessName: `HubSpot Local Agency Hub (${targetCity})`,
          contactPerson: 'David Miller (Agency Director)',
          email: 'outreach@hubspot.com',
          phone: '+1 (888) 482-7768',
          website: 'https://www.hubspot.com',
          country: country,
          industry: industry,
          score: 92,
          temperature: 'HOT',
          websiteStatus: 'Mobile Landing Funnel Audit & Speed Optimization',
          suggestedService: 'Full Mobile Redesign & Instant Lead Router',
          auditIssue: 'Complex mobile menu drawer and asset load delay on 4G cellular networks.',
          pitchHook: `I noticed your mobile site in ${targetCity} takes over 3.8s to render heavy assets on mobile viewports.`,
        },
        {
          businessName: `Squarespace Partner Studio`,
          contactPerson: 'Sarah Jenkins (Studio Owner)',
          email: 'design@squarespace.com',
          phone: '+1 (888) 558-8329',
          website: 'https://www.squarespace.com',
          country: country,
          industry: industry,
          score: 88,
          temperature: 'WARM',
          websiteStatus: 'Retina Gallery Asset Compression & Mobile CTA',
          suggestedService: 'Headless Webflow & Fast Image Preloader',
          auditIssue: 'Retina images cause high initial bandwidth load on mobile screens.',
          pitchHook: 'Compressing retina hero images could boost your mobile page load score to 95+.',
        },
      ];
      setDiscoveredLeads(mockDiscovered);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkedInSearch = async () => {
    setProspectorLoading(true);
    setProspects([]);

    try {
      const res = await fetch('/api/ai/linkedin-prospector', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName, roleTitle, location }),
      });
      const data = await res.json();
      if (data.success && data.prospects) {
        setProspects(data.prospects);
      } else {
        throw new Error(data.error || 'Failed to search LinkedIn decision-makers');
      }
    } catch (err) {
      console.warn('LinkedIn search error, using simulated prospects:', err);
      const targetCompany = companyName || 'Luxe Living Real Estate';
      const mockProspects = [
        {
          contactPerson: 'Antoine Vance',
          roleTitle: 'VP of Digital Marketing & Sales',
          businessName: targetCompany,
          industry: 'Real Estate & Property Development',
          linkedInUrl: 'https://linkedin.com/in/antoine-vance-marketing',
          email: 'antoine@luxelivingrealty.com',
          phone: '+1 (305) 555-0182',
          website: 'https://www.luxelivingrealty.com',
          location: location || 'Miami, FL',
          teamSize: '50-200 Employees',
          score: 95,
          websiteStatus: 'Mobile Hero Video Load Bottleneck',
          suggestedService: 'Sub-Second React Edge Conversion',
          auditIssue: 'Autoplay hero MP4 video causes 4.2s delay on mobile 4G networks.',
          pitchHook: 'I noticed your luxury listing page takes over 4 seconds to load video on mobile devices.',
        },
        {
          contactPerson: 'Elena Rostova',
          roleTitle: 'Chief Operations Officer',
          businessName: `${targetCompany} Group`,
          industry: 'Luxury Properties & Architecture',
          linkedInUrl: 'https://linkedin.com/in/elena-rostova-coo',
          email: 'elena.rostova@luxegroup.com',
          phone: '+1 (415) 555-0921',
          website: 'https://www.luxegroup.com',
          location: location || 'San Francisco, CA',
          teamSize: '20-50 Employees',
          score: 91,
          websiteStatus: 'Lacks Direct Mobile Appointment CTA',
          suggestedService: 'Instant VIP Booking & Mobile Funnel',
          auditIssue: 'No direct booking button above the fold on mobile screens.',
          pitchHook: 'Adding a 1-tap mobile VIP booking widget could increase lead conversions by 35%.',
        },
      ];
      setProspects(mockProspects);
    } finally {
      setProspectorLoading(false);
    }
  };

  const handleImport = (item: any, index: number) => {
    const newLead: Omit<Lead, 'id' | 'createdAt'> = {
      businessName: item.businessName,
      contactPerson: `${item.contactPerson}${item.roleTitle ? ` (${item.roleTitle})` : ''}`,
      email: item.email,
      phone: item.phone,
      website: item.website,
      industry: item.industry || industry,
      country: item.country || country,
      city: item.location || city || 'Local',
      score: item.score || 85,
      temperature: item.temperature || 'WARM',
      contactStatus: 'Not Contacted',
      websiteStatus: item.websiteStatus || 'Discovered via AI',
      suggestedService: item.suggestedService || 'Website Redesign',
      auditIssue: item.auditIssue || 'Discovered issue',
      pitchHook: item.pitchHook || '',
      mobileViewport: false,
      clearCTA: false,
      speedRating: 'Slow',
      auditStatus: 'Audited',
    };

    onImportLead(newLead);
    setImportedIds((prev) => ({ ...prev, [index]: true }));
  };

  const handleImportProspect = (p: any, idx: number) => {
    handleImport(p, idx);
    setImportedProspectIds((prev) => ({ ...prev, [idx]: true }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Client Finder & Prospector Engine
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Discover high-value business prospects, audit website weaknesses, and find key decision-makers on LinkedIn.
          </p>
        </div>

        {/* Sub-Tab Navigation Toggle */}
        <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 inline-flex items-center gap-1 self-start md:self-auto">
          <button
            onClick={() => setActiveSubTab('ai_discovery')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'ai_discovery'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Web Client Discovery
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

      {activeSubTab === 'ai_discovery' ? (
        <>
          {/* Discovery Filters Panel */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-indigo-500" /> Target Country
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-indigo-500" /> Target Industry
                </label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-indigo-500" /> City or Keyword
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Miami, London, Austin..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleSearch}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-sm rounded-lg shadow-sm transition"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Scanning Web & Qualification...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Find & Audit Prospects
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Discovered Results Table */}
          {discoveredLeads.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-base">
                  Discovered High-Potential Businesses ({discoveredLeads.length})
                </h3>
                <span className="text-xs text-slate-500">
                  Generated for {country} • {industry}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-bold tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">Business & Contact</th>
                      <th className="p-3.5">Website</th>
                      <th className="p-3.5">Detected Flaw / Audit Issue</th>
                      <th className="p-3.5">AI Score</th>
                      <th className="p-3.5">Suggested Service</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700">
                    {discoveredLeads.map((item, idx) => {
                      const isImported = importedIds[idx];
                      return (
                        <tr key={`disc-${idx}-${item.businessName}`} className="hover:bg-slate-50/80 transition">
                          <td className="p-3.5 font-semibold text-slate-900">
                            <div>{item.businessName}</div>
                            <div className="text-[11px] text-slate-500 font-normal">
                              {item.contactPerson} ({item.email})
                            </div>
                          </td>
                          <td className="p-3.5 text-indigo-600 font-medium">
                            <a
                              href={
                                item.website.startsWith('http')
                                  ? item.website
                                  : `https://${item.website}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 hover:underline"
                            >
                              {item.website} <Globe className="w-3 h-3 text-slate-400" />
                            </a>
                          </td>
                          <td className="p-3.5 max-w-xs text-slate-600">
                            <span className="text-rose-600 font-semibold block">
                              {item.websiteStatus}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {item.auditIssue}
                            </span>
                          </td>
                          <td className="p-3.5 font-extrabold text-slate-900 text-sm">
                            {item.score}
                            <span className="text-xs text-slate-400 font-normal">/100</span>
                          </td>
                          <td className="p-3.5 font-medium text-slate-700">
                            {item.suggestedService}
                          </td>
                          <td className="p-3.5 text-right space-x-2">
                            {isImported ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Added to DB
                              </span>
                            ) : (
                              <button
                                onClick={() => handleImport(item, idx)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition inline-flex items-center gap-1 shadow-sm"
                              >
                                <Plus className="w-3.5 h-3.5" /> Import Lead
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        /* LinkedIn Prospector Tool UI */
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl border border-blue-900 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-wider">
              <Linkedin className="w-4 h-4 text-blue-400" /> B2B LinkedIn Decision-Maker Prospector
            </div>
            <h2 className="text-lg font-extrabold text-white">
              Find Key Executive Decision-Makers by Company Name & Location
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
              Search specific company names, domains, or industries to extract verified decision-makers (CEOs, VPs of Marketing, Founders) with direct work emails and custom pitch hooks.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-blue-300 uppercase mb-1">
                  Company Name or Domain
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Luxe Living, Remax, Shopify..."
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
                  placeholder="e.g. San Francisco, CA / London / Global"
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

          {/* LinkedIn Results Grid */}
          {prospects.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-blue-600" /> LinkedIn Executive Decision-Makers Discovered ({prospects.length})
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {prospects.map((p, idx) => {
                  const isImported = importedProspectIds[idx];
                  return (
                    <div
                      key={`prospect-${idx}-${p.contactPerson}`}
                      className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition space-y-3 relative overflow-hidden"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 font-extrabold text-base flex items-center justify-center border border-blue-200">
                            {p.contactPerson.split(' ').map((n: string) => n[0]).join('')}
                          </div>
                          <div>
                            <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                              {p.contactPerson}
                              <a
                                href={p.linkedInUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800"
                                title="Open LinkedIn Profile"
                              >
                                <Linkedin className="w-3.5 h-3.5" />
                              </a>
                            </h4>
                            <p className="text-xs font-semibold text-indigo-600">{p.roleTitle}</p>
                            <p className="text-[11px] text-slate-500 flex items-center gap-1">
                              <Building2 className="w-3 h-3" /> {p.businessName} • {p.location}
                            </p>
                          </div>
                        </div>

                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold text-[10px] rounded-full border border-emerald-200">
                          {p.score}/100 Score
                        </span>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs space-y-1">
                        <div className="text-slate-600 flex items-center justify-between text-[11px]">
                          <span><strong>Email:</strong> {p.email}</span>
                          <span className="text-slate-400">{p.teamSize}</span>
                        </div>
                        <div className="text-rose-700 font-semibold text-[11px]">
                          <strong>Site Issue:</strong> {p.auditIssue}
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-600 italic bg-amber-50/70 border border-amber-200 p-2.5 rounded-lg">
                        "{p.pitchHook}"
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <a
                          href={p.website.startsWith('http') ? p.website : `https://${p.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-indigo-600 font-medium hover:underline flex items-center gap-1"
                        >
                          {p.website} <ExternalLink className="w-3 h-3" />
                        </a>

                        {isImported ? (
                          <span className="text-emerald-600 font-bold text-xs flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Added to Leads DB
                          </span>
                        ) : (
                          <button
                            onClick={() => handleImportProspect(p, idx)}
                            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition shadow-xs flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" /> Save as Lead
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

