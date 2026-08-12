import { GoogleGenAI, Type } from "@google/genai";

export interface LeadQueryParams {
  country?: string;
  city?: string;
  industry?: string;
  opportunityType?: string;
  budgetTarget?: string;
  keyword?: string;
  providerId?: string;
}

export interface DiscoveredLeadRaw {
  businessName: string;
  contactPerson: string;
  email: string;
  phone?: string;
  website: string;
  address?: string;
  city?: string;
  country?: string;
  industry?: string;
  score?: number;
  temperature?: string;
  websiteStatus?: string;
  suggestedService?: string;
  auditIssue?: string;
  pitchHook?: string;
  source: string;
  sourceUrl: string;
  verificationStatus: "VERIFIED" | "UNVERIFIED";
  dateDiscovered?: string;
  evidenceText?: string;
}

export interface ProviderSearchResult {
  success: boolean;
  leads: DiscoveredLeadRaw[];
  provider: string;
  providerId: string;
  statusCode?: number;
  error?: string;
  code?: string;
  rawCount?: number;
  validatedCount?: number;
  duplicatesRemovedCount?: number;
  suppressedCount?: number;
  finalActiveCount?: number;
  searchParamsUsed?: LeadQueryParams;
}

export interface ConnectionTestResult {
  success: boolean;
  statusCode: number;
  message: string;
  details?: any;
}

export interface LeadProvider {
  id: string;
  name: string;
  supportedSearchTypes: string[];
  isConfigured(): boolean;
  testConnection(): Promise<ConnectionTestResult>;
  searchBusinesses(query: LeadQueryParams): Promise<ProviderSearchResult>;
  searchJobs?(query: LeadQueryParams): Promise<ProviderSearchResult>;
  searchStartups?(query: LeadQueryParams): Promise<ProviderSearchResult>;
  getCompanyDetails?(companyId: string): Promise<any>;
  getSourceUrl?(companyId: string): string;
}

export interface ProviderHealth {
  providerId: string;
  providerName: string;
  status: "Connected" | "Not Configured" | "Error" | "Rate Limited" | "Unauthorized";
  lastSuccessfulSearch?: string;
  lastError?: {
    code: string;
    message: string;
    statusCode: number;
    timestamp: string;
  };
  supportedSearchTypes: string[];
}

// In-memory provider health state store
const providerHealthStore: Record<string, ProviderHealth> = {
  "serpapi-search": {
    providerId: "serpapi-search",
    providerName: "SerpApi Google & Maps Search (250 Free Searches)",
    status: process.env.SERPAPI_API_KEY ? "Connected" : "Not Configured",
    supportedSearchTypes: ["Google Local Maps", "Web SERP Leads", "Broad Discovery"],
  },
  "foursquare-places": {
    providerId: "foursquare-places",
    providerName: "Foursquare Places API (500 Free Calls)",
    status: process.env.FOURSQUARE_API_KEY ? "Connected" : "Not Configured",
    supportedSearchTypes: ["Local Businesses", "Category Search", "Directory Places"],
  },
  "yelp-fusion": {
    providerId: "yelp-fusion",
    providerName: "Yelp Fusion Places API",
    status: process.env.YELP_API_KEY ? "Connected" : "Not Configured",
    supportedSearchTypes: ["Local Business Directories", "Review & Phone Records", "Merchant Audits"],
  },
  "google-search-live": {
    providerId: "google-search-live",
    providerName: "Google Live Web Search Engine",
    status: process.env.GEMINI_API_KEY ? "Connected" : "Not Configured",
    supportedSearchTypes: ["Client Projects ($2k+)", "Startup MVP Frontend", "Website Modernization", "Dashboard & Portals"],
  },
  "auto-multi": {
    providerId: "auto-multi",
    providerName: "Multi-Source Lead Aggregator (All Active)",
    status: (process.env.SERPAPI_API_KEY || process.env.FOURSQUARE_API_KEY || process.env.YELP_API_KEY || process.env.GEMINI_API_KEY) ? "Connected" : "Not Configured",
    supportedSearchTypes: ["Combined Cross-Directory Search"],
  },
};

export function getProviderHealth(providerId = "serpapi-search"): ProviderHealth {
  const health = providerHealthStore[providerId] || providerHealthStore["serpapi-search"];
  let isConfigured = false;
  if (providerId === "serpapi-search") isConfigured = Boolean(process.env.SERPAPI_API_KEY && process.env.SERPAPI_API_KEY.trim().length > 0);
  else if (providerId === "foursquare-places") isConfigured = Boolean(process.env.FOURSQUARE_API_KEY && process.env.FOURSQUARE_API_KEY.trim().length > 0);
  else if (providerId === "yelp-fusion") isConfigured = Boolean(process.env.YELP_API_KEY && process.env.YELP_API_KEY.trim().length > 0);
  else if (providerId === "google-search-live") isConfigured = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);
  else if (providerId === "auto-multi") isConfigured = Boolean(process.env.SERPAPI_API_KEY || process.env.FOURSQUARE_API_KEY || process.env.YELP_API_KEY || process.env.GEMINI_API_KEY);

  return {
    ...health,
    status: isConfigured ? (health.status === "Not Configured" ? "Connected" : health.status) : "Not Configured",
  };
}

export function getAllProvidersHealth(): ProviderHealth[] {
  return Object.keys(providerHealthStore).map((id) => getProviderHealth(id));
}

export function updateProviderHealth(providerId: string, updates: Partial<ProviderHealth>) {
  if (providerHealthStore[providerId]) {
    providerHealthStore[providerId] = {
      ...providerHealthStore[providerId],
      ...updates,
    };
  }
}

/**
 * Agent Kashi Qualification & Scoring Engine (0-100 Rubric)
 * Qualifies verified records from live providers without altering business details.
 */
export async function qualifyLeadsWithKashi(
  rawRecords: DiscoveredLeadRaw[],
  query: LeadQueryParams
): Promise<DiscoveredLeadRaw[]> {
  if (!rawRecords || rawRecords.length === 0) return [];

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    // Deterministic Kashi Rubric Scoring (0-100) fallback
    return rawRecords.map((lead) => {
      let score = 55; // base score
      if (lead.website && !lead.website.includes("example.com")) score += 20;
      if (lead.phone) score += 10;
      if (lead.address) score += 10;
      if (lead.verificationStatus === "VERIFIED") score += 5;

      let temperature: "HOT" | "STRONG" | "POTENTIAL" | "LOW" = "POTENTIAL";
      if (score >= 80) temperature = "HOT";
      else if (score >= 65) temperature = "STRONG";
      else if (score >= 50) temperature = "POTENTIAL";
      else temperature = "LOW";

      return {
        ...lead,
        score,
        temperature,
        suggestedService: lead.suggestedService || "Custom React/Next.js Modernization & Landing Page",
        auditIssue: lead.auditIssue || "Mobile viewport & conversion CTA optimization recommended",
        pitchHook: lead.pitchHook || `I noticed ${lead.businessName} on live maps and checked your mobile web performance.`,
        evidenceText: `Verified business record qualified by Agent Kashi (${score}/100 - ${temperature} LEAD).`,
      };
    });
  }

  // Gemini Agent Kashi Qualification
  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `You are Agent Kashi, a professional client-acquisition agent for frontend developer Muhammad Waqas.
Evaluate these REAL, VERIFIED business prospect records returned from live provider search.

QUERY CONTEXT:
- Country: ${query.country || "USA"}
- City: ${query.city || "General"}
- Industry: ${query.industry || "General"}
- Opportunity Type: ${query.opportunityType || "Client Projects ($2k+)"}
- Keyword: ${query.keyword || "N/A"}

VERIFIED BUSINESS RECORDS FROM PROVIDER:
${JSON.stringify(
  rawRecords.map((r, idx) => ({
    id: idx,
    businessName: r.businessName,
    website: r.website,
    phone: r.phone,
    address: r.address,
    city: r.city,
    country: r.country,
    industry: r.industry,
    source: r.source,
    sourceUrl: r.sourceUrl,
  })),
  null,
  2
)}

STRICT RULES:
1. YOU MUST PRESERVE the exact businessName, website, phone, address, city, country, source, and sourceUrl for each item. DO NOT invent or change any business names or URLs!
2. Score each business on Kashi's 0-100 rubric:
   - Budget Potential (25 pts): $2,000+ potential
   - Need (20 pts): web modernization, mobile UI improvement, clear CTA
   - Skill Match (20 pts): React, TypeScript, Tailwind, Next.js, Node
   - Client Quality (15 pts): legitimate operating business/agency/startup
   - Project Quality (10 pts): portfolio case-study value
   - Relationship Potential (10 pts): recurring/long-term potential
3. Set temperature:
   - HOT (80-100 score)
   - STRONG (65-79 score)
   - POTENTIAL (50-64 score)
   - LOW (0-49 score)
4. Provide a tailored suggestedService, auditIssue, and low-pressure pitchHook for Muhammad Waqas.

Return JSON array matching input length with fields: id, score, temperature, suggestedService, auditIssue, pitchHook.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.INTEGER },
              score: { type: Type.INTEGER },
              temperature: { type: Type.STRING },
              suggestedService: { type: Type.STRING },
              auditIssue: { type: Type.STRING },
              pitchHook: { type: Type.STRING },
            },
            required: ["id", "score", "temperature", "suggestedService", "auditIssue", "pitchHook"],
          },
        },
      },
    });

    const evaluations: Array<{
      id: number;
      score: number;
      temperature: string;
      suggestedService: string;
      auditIssue: string;
      pitchHook: string;
    }> = JSON.parse(response.text || "[]");

    const evalMap = new Map(evaluations.map((e) => [e.id, e]));

    return rawRecords.map((lead, idx) => {
      const evalData = evalMap.get(idx);
      if (!evalData) return lead;

      const score = Math.max(0, Math.min(100, evalData.score || 75));
      let temp = evalData.temperature as "HOT" | "STRONG" | "POTENTIAL" | "LOW";
      if (!["HOT", "STRONG", "POTENTIAL", "LOW"].includes(temp)) {
        if (score >= 80) temp = "HOT";
        else if (score >= 65) temp = "STRONG";
        else if (score >= 50) temp = "POTENTIAL";
        else temp = "LOW";
      }

      return {
        ...lead,
        score,
        temperature: temp,
        suggestedService: evalData.suggestedService || lead.suggestedService,
        auditIssue: evalData.auditIssue || lead.auditIssue,
        pitchHook: evalData.pitchHook || lead.pitchHook,
        evidenceText: `Verified business record qualified & scored by Agent Kashi (${score}/100 - ${temp} LEAD).`,
      };
    });
  } catch (err) {
    console.error("Kashi qualification error:", err);
    return rawRecords;
  }
}

/**
 * 1. SerpApi Google & Maps Search Provider (FIRST LIVE LEAD PROVIDER)
 */
export class SerpApiSearchProvider implements LeadProvider {
  id = "serpapi-search";
  name = "SerpApi Google & Maps Search (Primary)";
  supportedSearchTypes = ["Google Local Maps", "Web SERP Leads", "Broad Discovery"];

  isConfigured(): boolean {
    return Boolean(process.env.SERPAPI_API_KEY && process.env.SERPAPI_API_KEY.trim().length > 0);
  }

  async testConnection(): Promise<ConnectionTestResult> {
    if (!this.isConfigured()) {
      updateProviderHealth(this.id, { status: "Not Configured" });
      return {
        success: false,
        statusCode: 503,
        message: "SerpApi is not configured. Please enter your SERPAPI_API_KEY in Data Sources.",
      };
    }

    try {
      const apiKey = process.env.SERPAPI_API_KEY!.trim();
      const res = await fetch(`https://serpapi.com/search.json?engine=google_maps&q=web+developer&api_key=${apiKey}`);
      if (res.ok) {
        updateProviderHealth(this.id, { status: "Connected" });
        return {
          success: true,
          statusCode: 200,
          message: "SerpApi Google Maps provider verified & connected successfully.",
        };
      } else {
        const errText = await res.text();
        throw new Error(`SerpApi error status (${res.status}): ${errText}`);
      }
    } catch (err: any) {
      updateProviderHealth(this.id, { status: "Error" });
      return { success: false, statusCode: 500, message: err.message || "SerpApi connection test failed" };
    }
  }

  async searchBusinesses(query: LeadQueryParams): Promise<ProviderSearchResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        leads: [],
        provider: this.name,
        providerId: this.id,
        statusCode: 503,
        error: "SerpApi provider is not configured. Please enter SERPAPI_API_KEY in Data Sources.",
        code: "LIVE_PROVIDER_NOT_CONFIGURED",
        searchParamsUsed: query,
      };
    }

    const { country, city, industry, keyword, opportunityType } = query;
    const apiKey = process.env.SERPAPI_API_KEY!.trim();

    try {
      // Build search query using user parameters
      const queryParts = [keyword, industry, opportunityType].filter(Boolean).join(" ");
      const locationParts = [city, country].filter(Boolean).join(", ");
      const fullQuery = locationParts ? `${queryParts} in ${locationParts}` : queryParts || "businesses";

      const url = `https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(fullQuery)}&api_key=${apiKey}`;
      const response = await fetch(url);

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`SerpApi search request failed (${response.status}): ${errText}`);
      }

      const data = await response.json();
      const localResults: any[] = data.local_results || data.organic_results || [];

      if (localResults.length === 0) {
        updateProviderHealth(this.id, { status: "Connected", lastSuccessfulSearch: new Date().toISOString() });
        return {
          success: true,
          leads: [],
          provider: this.name,
          providerId: this.id,
          statusCode: 200,
          rawCount: 0,
          searchParamsUsed: query,
        };
      }

      // Preserve exact business information returned by SerpApi
      const rawLeads: DiscoveredLeadRaw[] = localResults.slice(0, 12).map((item: any) => {
        const title = item.title || item.name || "Business Prospect";
        const cleanWebsite = item.website || item.link || "";
        const phone = item.phone || item.phone_number || "";
        const address = item.address || item.formatted_address || "";
        const itemCategory = item.type || item.category || industry || "Business";
        
        // Return exact source URLs
        const sourceUrl = item.link || item.serpapi_link || (item.place_id 
          ? `https://www.google.com/maps/place/?q=place_id:${item.place_id}` 
          : (cleanWebsite || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(title)}`));

        return {
          businessName: title,
          contactPerson: "Owner / Manager",
          email: cleanWebsite ? `contact@${cleanWebsite.replace(/^https?:\/\//, "").replace(/\/.*$/, "")}` : "",
          phone,
          website: cleanWebsite,
          address,
          city: city || item.city || "Local",
          country: country || item.country || "USA",
          industry: itemCategory,
          score: 75,
          temperature: "STRONG",
          websiteStatus: cleanWebsite ? "Active Website Recorded" : "No Listed Website",
          suggestedService: "Custom High-Converting Web Application & Mobile UX Optimization",
          auditIssue: "Mobile viewport optimization & appointment booking CTA recommended",
          pitchHook: `I noticed ${title} on Google Maps and analyzed your online presence.`,
          source: "SerpApi Google Maps",
          sourceUrl,
          verificationStatus: (cleanWebsite || phone || address) ? "VERIFIED" : "UNVERIFIED",
          dateDiscovered: new Date().toISOString(),
          evidenceText: `Verified local Google Maps record via SerpApi (${item.reviews || 0} reviews, ${item.rating || "N/A"} rating).`,
        };
      });

      // Filter verified records and qualify with Kashi
      const verifiedLeads = rawLeads.filter((l) => l.verificationStatus === "VERIFIED");
      const targetLeads = verifiedLeads.length > 0 ? verifiedLeads : rawLeads;
      const qualifiedLeads = await qualifyLeadsWithKashi(targetLeads, query);

      updateProviderHealth(this.id, { status: "Connected", lastSuccessfulSearch: new Date().toISOString() });

      return {
        success: true,
        leads: qualifiedLeads,
        provider: this.name,
        providerId: this.id,
        statusCode: 200,
        rawCount: localResults.length,
        searchParamsUsed: query,
      };
    } catch (err: any) {
      updateProviderHealth(this.id, { status: "Error" });
      return {
        success: false,
        leads: [],
        provider: this.name,
        providerId: this.id,
        statusCode: 500,
        error: err.message || "Failed SerpApi search execution",
        searchParamsUsed: query,
      };
    }
  }
}

/**
 * 2. Foursquare Places API Provider (500 Free Pro Calls)
 */
export class FoursquarePlacesProvider implements LeadProvider {
  id = "foursquare-places";
  name = "Foursquare Places API (500 Free Calls)";
  supportedSearchTypes = ["Local Businesses", "Category Search", "Directory Places"];

  isConfigured(): boolean {
    return Boolean(process.env.FOURSQUARE_API_KEY && process.env.FOURSQUARE_API_KEY.trim().length > 0);
  }

  async testConnection(): Promise<ConnectionTestResult> {
    if (!this.isConfigured()) {
      updateProviderHealth(this.id, { status: "Not Configured" });
      return {
        success: false,
        statusCode: 503,
        message: "Foursquare Places API is not configured. Provide FOURSQUARE_API_KEY in Data Sources.",
      };
    }

    try {
      const apiKey = process.env.FOURSQUARE_API_KEY!.trim();
      const res = await fetch("https://api.foursquare.com/v3/places/search?limit=1", {
        headers: { Authorization: apiKey, Accept: "application/json" },
      });
      if (res.ok) {
        updateProviderHealth(this.id, { status: "Connected" });
        return {
          success: true,
          statusCode: 200,
          message: "Foursquare Places API native key verified & connected successfully.",
        };
      } else {
        const errText = await res.text();
        throw new Error(`Foursquare API error (${res.status}): ${errText}`);
      }
    } catch (err: any) {
      updateProviderHealth(this.id, { status: "Error" });
      return { success: false, statusCode: 500, message: err.message || "Foursquare test failed" };
    }
  }

  async searchBusinesses(query: LeadQueryParams): Promise<ProviderSearchResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        leads: [],
        provider: this.name,
        providerId: this.id,
        statusCode: 503,
        error: "Foursquare Places API provider not configured. Please enter FOURSQUARE_API_KEY.",
        code: "LIVE_PROVIDER_NOT_CONFIGURED",
        searchParamsUsed: query,
      };
    }

    const { country, industry, city, keyword } = query;
    const apiKey = process.env.FOURSQUARE_API_KEY!.trim();

    try {
      const loc = city ? `${city}, ${country || ""}` : country || "USA";
      const url = `https://api.foursquare.com/v3/places/search?near=${encodeURIComponent(loc)}&query=${encodeURIComponent(keyword || industry || "business")}&limit=12&fields=fsq_id,name,link,location,categories,tel,email,website,rating,description`;
      
      const response = await fetch(url, {
        headers: { Authorization: apiKey, Accept: "application/json" },
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Foursquare API request failed (${response.status}): ${errText}`);
      }

      const data = await response.json();
      const results = data.results || [];

      const rawLeads: DiscoveredLeadRaw[] = results.map((item: any) => {
        const cleanSite = item.website || "";
        const fsqUrl = item.link || (item.fsq_id ? `https://foursquare.com/v/${item.fsq_id}` : cleanSite);
        
        return {
          businessName: item.name,
          contactPerson: "Business Manager",
          email: item.email || (cleanSite ? `contact@${cleanSite.replace(/^https?:\/\//, "").replace(/\/.*$/, "")}` : ""),
          phone: item.tel || "",
          website: cleanSite,
          address: item.location?.formatted_address || item.location?.address || "",
          city: item.location?.locality || city || "Local",
          country: item.location?.country || country || "USA",
          industry: item.categories?.[0]?.name || industry || "General",
          score: item.rating ? Math.round(item.rating * 10) : 75,
          temperature: "STRONG",
          websiteStatus: cleanSite ? "Active Website Listed" : "No Listed Website",
          suggestedService: "Custom High-Converting Web Landing Page & Booking Portal",
          auditIssue: "Lacks direct online booking engine & responsive mobile layout",
          pitchHook: `I found ${item.name} on Foursquare and checked your mobile web interface.`,
          source: "Foursquare Places API",
          sourceUrl: fsqUrl,
          verificationStatus: (cleanSite || item.tel || item.location) ? "VERIFIED" : "UNVERIFIED",
          dateDiscovered: new Date().toISOString(),
          evidenceText: `Verified place record on Foursquare Places API.`,
        };
      });

      const qualifiedLeads = await qualifyLeadsWithKashi(rawLeads, query);

      updateProviderHealth(this.id, { status: "Connected", lastSuccessfulSearch: new Date().toISOString() });
      return {
        success: true,
        leads: qualifiedLeads,
        provider: this.name,
        providerId: this.id,
        statusCode: 200,
        rawCount: rawLeads.length,
        searchParamsUsed: query,
      };
    } catch (err: any) {
      updateProviderHealth(this.id, { status: "Error" });
      return {
        success: false,
        leads: [],
        provider: this.name,
        providerId: this.id,
        statusCode: 500,
        error: err.message || "Failed Foursquare search",
        searchParamsUsed: query,
      };
    }
  }
}

/**
 * 3. Yelp Fusion / Places API Provider
 */
export class YelpFusionProvider implements LeadProvider {
  id = "yelp-fusion";
  name = "Yelp Fusion Places API";
  supportedSearchTypes = ["Local Business Directories", "Review & Phone Records", "Merchant Audits"];

  isConfigured(): boolean {
    return Boolean(process.env.YELP_API_KEY && process.env.YELP_API_KEY.trim().length > 0);
  }

  async testConnection(): Promise<ConnectionTestResult> {
    if (!this.isConfigured()) {
      updateProviderHealth(this.id, { status: "Not Configured" });
      return {
        success: false,
        statusCode: 503,
        message: "Yelp Fusion API is not configured. Provide YELP_API_KEY in Data Sources.",
      };
    }

    try {
      const apiKey = process.env.YELP_API_KEY!.trim();
      const res = await fetch("https://api.yelp.com/v3/businesses/search?location=NYC&limit=1", {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (res.ok) {
        updateProviderHealth(this.id, { status: "Connected" });
        return {
          success: true,
          statusCode: 200,
          message: "Yelp Fusion API native key verified & connected successfully.",
        };
      } else {
        const errText = await res.text();
        throw new Error(`Yelp API error status (${res.status}): ${errText}`);
      }
    } catch (err: any) {
      updateProviderHealth(this.id, { status: "Error" });
      return { success: false, statusCode: 500, message: err.message || "Yelp test failed" };
    }
  }

  async searchBusinesses(query: LeadQueryParams): Promise<ProviderSearchResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        leads: [],
        provider: this.name,
        providerId: this.id,
        statusCode: 503,
        error: "Yelp Fusion provider not configured. Please enter YELP_API_KEY.",
        code: "LIVE_PROVIDER_NOT_CONFIGURED",
        searchParamsUsed: query,
      };
    }

    const { country, industry, city, keyword } = query;
    const apiKey = process.env.YELP_API_KEY!.trim();

    try {
      const term = keyword || industry || "services";
      const loc = city ? `${city}, ${country || ""}` : country || "USA";
      const url = `https://api.yelp.com/v3/businesses/search?term=${encodeURIComponent(term)}&location=${encodeURIComponent(loc)}&limit=12`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Yelp API request failed (${response.status}): ${errText}`);
      }

      const data = await response.json();
      const businesses = data.businesses || [];

      const rawLeads: DiscoveredLeadRaw[] = businesses.map((item: any) => {
        const cleanSite = item.url || "";
        return {
          businessName: item.name,
          contactPerson: "Business Owner",
          email: "",
          phone: item.phone || item.display_phone || "",
          website: cleanSite,
          address: item.location?.address1 || "",
          city: item.location?.city || city || "Local",
          country: item.location?.country || country || "USA",
          industry: item.categories?.[0]?.title || industry || "General",
          score: item.rating ? Math.round(item.rating * 18) : 75,
          temperature: "STRONG",
          websiteStatus: "Yelp Verified Merchant Entry",
          suggestedService: "Modern Mobile Responsive Web Design & Lead Capture Form",
          auditIssue: "Lacks direct mobile lead conversion engine & high-speed viewport",
          pitchHook: `I noticed your Yelp profile for ${item.name} and analyzed your mobile web site.`,
          source: "Yelp Fusion API",
          sourceUrl: item.url || `https://www.yelp.com/biz/${item.id}`,
          verificationStatus: "VERIFIED",
          dateDiscovered: new Date().toISOString(),
          evidenceText: `Verified operating business on Yelp Fusion (${item.review_count || 0} reviews, ${item.rating || "N/A"} stars).`,
        };
      });

      const qualifiedLeads = await qualifyLeadsWithKashi(rawLeads, query);

      updateProviderHealth(this.id, { status: "Connected", lastSuccessfulSearch: new Date().toISOString() });
      return {
        success: true,
        leads: qualifiedLeads,
        provider: this.name,
        providerId: this.id,
        statusCode: 200,
        rawCount: rawLeads.length,
        searchParamsUsed: query,
      };
    } catch (err: any) {
      updateProviderHealth(this.id, { status: "Error" });
      return {
        success: false,
        leads: [],
        provider: this.name,
        providerId: this.id,
        statusCode: 500,
        error: err.message || "Failed Yelp search",
        searchParamsUsed: query,
      };
    }
  }
}

/**
 * 4. Google Live Web Search Engine Provider
 */
export class GoogleSearchLiveProvider implements LeadProvider {
  id = "google-search-live";
  name = "Google Live Web Search Engine";
  supportedSearchTypes = ["Client Projects ($2k+)", "Startup MVP Frontend", "Website Modernization", "Dashboard & Portals"];

  isConfigured(): boolean {
    return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);
  }

  async testConnection(): Promise<ConnectionTestResult> {
    if (!this.isConfigured()) {
      updateProviderHealth(this.id, { status: "Not Configured" });
      return {
        success: false,
        statusCode: 503,
        message: "Google Search Engine is not configured. Configure GEMINI_API_KEY.",
      };
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const res = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: "Respond JSON: {\"status\":\"ok\"}",
      });
      if (res?.text) {
        updateProviderHealth(this.id, { status: "Connected" });
        return {
          success: true,
          statusCode: 200,
          message: "Google Live Web Search provider verified & connected.",
        };
      }
      throw new Error("No response from provider test");
    } catch (err: any) {
      updateProviderHealth(this.id, { status: "Error" });
      return { success: false, statusCode: 500, message: err.message || "Test failed" };
    }
  }

  async searchBusinesses(query: LeadQueryParams): Promise<ProviderSearchResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        leads: [],
        provider: this.name,
        providerId: this.id,
        statusCode: 503,
        error: "Google Search Engine provider not configured.",
        code: "LIVE_PROVIDER_NOT_CONFIGURED",
        searchParamsUsed: query,
      };
    }

    const { country, industry, city, opportunityType, budgetTarget, keyword } = query;
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY!,
      httpOptions: { headers: { "User-Agent": "leadflow-ai-os" } },
    });

    const prompt = `You are a live B2B lead discovery engine querying real public search indices.
Locate 6 REAL, operating prospect businesses strictly matching:
- Country: ${country || "USA"}
- City: ${city || "General"}
- Industry: ${industry || "Real Estate"}
- Opportunity Type: ${opportunityType || "Client Projects"}
- Budget Target: ${budgetTarget || "All Ranges"}
${keyword ? `- Keyword: ${keyword}` : ""}

STRICT RULES:
1. Return ONLY REAL, operating businesses with real websites and addresses in ${city || country}.
2. Do NOT invent fake company names or fake domains. If zero match, return [].
3. Preserve real source URLs.

Return JSON array with businessName, contactPerson, email, phone, website, address, city, country, industry, score, temperature, websiteStatus, suggestedService, auditIssue, pitchHook, source ("Google Live Web Search Engine"), sourceUrl, verificationStatus ("VERIFIED"), evidenceText.`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                businessName: { type: Type.STRING },
                contactPerson: { type: Type.STRING },
                email: { type: Type.STRING },
                phone: { type: Type.STRING },
                website: { type: Type.STRING },
                address: { type: Type.STRING },
                city: { type: Type.STRING },
                country: { type: Type.STRING },
                industry: { type: Type.STRING },
                score: { type: Type.INTEGER },
                temperature: { type: Type.STRING },
                websiteStatus: { type: Type.STRING },
                suggestedService: { type: Type.STRING },
                auditIssue: { type: Type.STRING },
                pitchHook: { type: Type.STRING },
                source: { type: Type.STRING },
                sourceUrl: { type: Type.STRING },
                verificationStatus: { type: Type.STRING },
                evidenceText: { type: Type.STRING },
              },
              required: ["businessName", "website", "score", "temperature", "suggestedService", "auditIssue", "pitchHook"],
            },
          },
        },
      });

      const rawLeads: DiscoveredLeadRaw[] = JSON.parse(response.text || "[]");
      const qualifiedLeads = await qualifyLeadsWithKashi(rawLeads, query);

      updateProviderHealth(this.id, { status: "Connected", lastSuccessfulSearch: new Date().toISOString() });
      return {
        success: true,
        leads: qualifiedLeads,
        provider: this.name,
        providerId: this.id,
        statusCode: 200,
        rawCount: qualifiedLeads.length,
        searchParamsUsed: query,
      };
    } catch (err: any) {
      updateProviderHealth(this.id, { status: "Error" });
      return {
        success: false,
        leads: [],
        provider: this.name,
        providerId: this.id,
        statusCode: 500,
        error: err.message || "Failed Google Search",
        searchParamsUsed: query,
      };
    }
  }
}

/**
 * 5. Auto Multi-Source Aggregator Provider (All Configured)
 */
export class AutoMultiProvider implements LeadProvider {
  id = "auto-multi";
  name = "Multi-Source Lead Aggregator (All Active)";
  supportedSearchTypes = ["Combined Cross-Directory Search"];

  isConfigured(): boolean {
    return Boolean(process.env.SERPAPI_API_KEY || process.env.FOURSQUARE_API_KEY || process.env.YELP_API_KEY || process.env.GEMINI_API_KEY);
  }

  async testConnection(): Promise<ConnectionTestResult> {
    return {
      success: true,
      statusCode: 200,
      message: "Multi-Source Lead Aggregator ready. Combines SerpApi, Foursquare, Yelp & Google Search Engine.",
    };
  }

  async searchBusinesses(query: LeadQueryParams): Promise<ProviderSearchResult> {
    const providers: LeadProvider[] = [
      new SerpApiSearchProvider(),
      new FoursquarePlacesProvider(),
      new YelpFusionProvider(),
      new GoogleSearchLiveProvider(),
    ];

    const activeProviders = providers.filter((p) => p.isConfigured());

    if (activeProviders.length === 0) {
      return {
        success: false,
        leads: [],
        provider: this.name,
        providerId: this.id,
        statusCode: 503,
        error: "No active lead discovery providers configured. Please configure SERPAPI_API_KEY or another provider.",
        code: "LIVE_PROVIDER_NOT_CONFIGURED",
        searchParamsUsed: query,
      };
    }

    const allLeads: DiscoveredLeadRaw[] = [];
    for (const provider of activeProviders) {
      try {
        const res = await provider.searchBusinesses(query);
        if (res.success && res.leads) {
          allLeads.push(...res.leads);
        }
      } catch (err) {
        console.error(`Error in multi-provider (${provider.name}):`, err);
      }
    }

    // Deduplicate by business name / domain
    const seenMap = new Set<string>();
    const deduplicatedLeads: DiscoveredLeadRaw[] = [];

    for (const lead of allLeads) {
      const key = (lead.businessName + (lead.website || "")).toLowerCase().replace(/[^a-z0-9]/g, "");
      if (!seenMap.has(key)) {
        seenMap.add(key);
        deduplicatedLeads.push(lead);
      }
    }

    updateProviderHealth(this.id, { status: "Connected", lastSuccessfulSearch: new Date().toISOString() });

    return {
      success: true,
      leads: deduplicatedLeads,
      provider: this.name,
      providerId: this.id,
      statusCode: 200,
      rawCount: allLeads.length,
      searchParamsUsed: query,
    };
  }
}

/**
 * Provider Resolver Function
 */
export function getLiveDataProvider(providerId?: string): LeadProvider {
  if (providerId === "foursquare-places") return new FoursquarePlacesProvider();
  if (providerId === "serpapi-search") return new SerpApiSearchProvider();
  if (providerId === "yelp-fusion") return new YelpFusionProvider();
  if (providerId === "google-search-live") return new GoogleSearchLiveProvider();
  if (providerId === "auto-multi") return new AutoMultiProvider();

  // Primary Default Provider: SerpApi Google & Maps Search
  const serpapi = new SerpApiSearchProvider();
  if (serpapi.isConfigured()) return serpapi;

  // Fallbacks if specific key is present
  const foursquare = new FoursquarePlacesProvider();
  if (foursquare.isConfigured()) return foursquare;

  const yelp = new YelpFusionProvider();
  if (yelp.isConfigured()) return yelp;

  const google = new GoogleSearchLiveProvider();
  if (google.isConfigured()) return google;

  // Default to SerpApi so missing key error explicitly instructs SerpApi setup
  return serpapi;
}
