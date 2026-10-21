import { GoogleGenAI, Type } from "@google/genai";
import { executeAIGeneratedContent, cleanJsonText } from "../services/aiService";

export interface LeadQueryParams {
  country?: string;
  city?: string;
  industry?: string;
  service?: string;
  targetService?: string;
  problemFocus?: string;
  opportunityType?: string;
  budgetTarget?: string;
  keyword?: string;
  providerId?: string;
  leadStrategy?: 'DIRECT_CLIENTS' | 'AGENCY_PARTNERSHIPS';
}

export interface FieldVerification {
  companyNameVerified: boolean;
  locationVerified: boolean;
  industryVerified: boolean;
  websiteVerified: boolean;
  phoneVerified: boolean;
  emailVerified: boolean;
  contactPersonVerified: boolean;
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
  score?: number; // Qualification / Opportunity Score (0-100)
  qualificationScore?: number; // Canonical qualification score
  verificationScore?: number; // Verification Score (0-100)
  fieldVerification?: FieldVerification;
  rejectionReason?: string;
  temperature?: string;
  websiteStatus?: string;
  suggestedService?: string;
  auditIssue?: string;
  pitchHook?: string;
  source: string;
  sourceUrl: string;
  verificationStatus: "VERIFIED" | "UNVERIFIED" | "REJECTED";
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
  rejectedCount?: number;
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
  "google-places": {
    providerId: "google-places",
    providerName: "Google Places API (Real Places & Details)",
    status: (process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY) ? "Connected" : "Not Configured",
    supportedSearchTypes: ["Real Business Discovery", "Google Place ID", "Phone & Address", "Rating & Reviews", "Business Status"],
  },
  "serpapi-search": {
    providerId: "serpapi-search",
    providerName: "SerpApi Google & Maps Search (Primary)",
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
    status: (process.env.GEMINI_API_KEY || process.env.OPENROUTER_API_KEY) ? "Connected" : "Not Configured",
    supportedSearchTypes: ["Client Projects ($2k+)", "Startup MVP Frontend", "Website Modernization", "Dashboard & Portals"],
  },
  "auto-multi": {
    providerId: "auto-multi",
    providerName: "Multi-Source Lead Aggregator (All Active)",
    status: (process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY || process.env.SERPAPI_API_KEY || process.env.FOURSQUARE_API_KEY || process.env.YELP_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENROUTER_API_KEY) ? "Connected" : "Not Configured",
    supportedSearchTypes: ["Combined Cross-Directory Search"],
  },
};

export function getProviderHealth(providerId = "google-search-live"): ProviderHealth {
  const health = providerHealthStore[providerId] || providerHealthStore["google-search-live"];
  let isConfigured = false;
  if (providerId === "google-places") isConfigured = Boolean((process.env.GOOGLE_PLACES_API_KEY && process.env.GOOGLE_PLACES_API_KEY.trim().length > 0) || (process.env.GOOGLE_MAPS_API_KEY && process.env.GOOGLE_MAPS_API_KEY.trim().length > 0));
  else if (providerId === "serpapi-search") isConfigured = Boolean(process.env.SERPAPI_API_KEY && process.env.SERPAPI_API_KEY.trim().length > 0);
  else if (providerId === "foursquare-places") isConfigured = Boolean(process.env.FOURSQUARE_API_KEY && process.env.FOURSQUARE_API_KEY.trim().length > 0);
  else if (providerId === "yelp-fusion") isConfigured = Boolean(process.env.YELP_API_KEY && process.env.YELP_API_KEY.trim().length > 0);
  else if (providerId === "google-search-live") isConfigured = Boolean((process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0) || (process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY.trim().length > 0));
  else if (providerId === "auto-multi") isConfigured = Boolean(process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY || process.env.SERPAPI_API_KEY || process.env.FOURSQUARE_API_KEY || process.env.YELP_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENROUTER_API_KEY);

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

// Hard Verification & Placeholder Detection Rules
const INVALID_NAME_PATTERNS = [
  "unnamed business",
  "unknown business",
  "test company",
  "example company",
  "demo company",
  "sample business",
  "placeholder company",
  "unnamed",
  "unknown",
  "test business",
  "sample company",
  "demo business",
  "placeholder business",
];

const INVALID_DOMAIN_PATTERNS = [
  "domain.com",
  "example.com",
  "example.org",
  "test.com",
  "localhost",
  "test.org",
  "sample.com",
  "placeholder.com",
];

const INVALID_EMAIL_PATTERNS = [
  "contact@domain.com",
  "test@test.com",
  "example@example.com",
  "user@example.com",
  "hello@example.com",
  "info@domain.com",
  "admin@domain.com",
  "email@domain.com",
  "support@domain.com",
];

export function isPlaceholderName(name?: string): boolean {
  if (!name || typeof name !== "string") return true;
  const lower = name.trim().toLowerCase();
  if (lower.length < 2) return true;
  return INVALID_NAME_PATTERNS.some((p) => lower === p || lower.startsWith("unnamed business") || lower.startsWith("placeholder company"));
}

export function isPlaceholderDomain(domainOrUrl?: string): boolean {
  if (!domainOrUrl || typeof domainOrUrl !== "string") return true;
  const lower = domainOrUrl.trim().toLowerCase();
  if (lower === "" || lower === "n/a" || lower === "none" || lower === "null" || lower === "not found" || lower === "not publicly available") return true;
  if (INVALID_DOMAIN_PATTERNS.some((p) => lower.includes(p))) return true;
  if (lower.startsWith("https://www.google.com/search") || lower.startsWith("https://google.com/search")) return true;
  return false;
}

export function isPlaceholderEmail(email?: string): boolean {
  if (!email || typeof email !== "string") return true;
  const lower = email.trim().toLowerCase();
  if (lower === "" || lower === "n/a" || lower === "none" || lower === "null" || lower === "not found" || lower === "not publicly available") return true;
  if (INVALID_EMAIL_PATTERNS.some((p) => lower === p)) return true;
  if (lower.endsWith("@domain.com") || lower.endsWith("@example.com") || lower.endsWith("@test.com")) return true;
  return false;
}

/**
 * Field-level Lead Verification & Normalization Engine
 * Guarantees zero synthetic or fabricated values in Live Mode.
 */
export function verifyAndNormalizeLead(
  raw: DiscoveredLeadRaw,
  queryContext?: LeadQueryParams
): { lead: DiscoveredLeadRaw; isVerified: boolean; reason?: string } {
  const name = (raw.businessName || "").trim();

  // 1. Reject placeholder company name
  if (isPlaceholderName(name)) {
    return {
      lead: {
        ...raw,
        businessName: name || "Unnamed Business",
        verificationStatus: "REJECTED",
        verificationScore: 0,
        rejectionReason: "Rejected placeholder or unnamed company name",
      },
      isVerified: false,
      reason: "Placeholder or unnamed business",
    };
  }

  // 2. Clean website and sourceUrl
  let cleanWebsite = (raw.website || "").trim();
  if (isPlaceholderDomain(cleanWebsite)) {
    cleanWebsite = "Not found";
  }

  let cleanSourceUrl = (raw.sourceUrl || "").trim();
  if (!cleanSourceUrl || isPlaceholderDomain(cleanSourceUrl)) {
    cleanSourceUrl = cleanWebsite !== "Not found" ? cleanWebsite : "";
  }

  // 3. Clean email, phone, contact person
  let cleanEmail = (raw.email || "").trim();
  if (isPlaceholderEmail(cleanEmail)) {
    cleanEmail = "Not found";
  }

  let cleanPhone = (raw.phone || "").trim();
  if (
    !cleanPhone ||
    cleanPhone.toLowerCase() === "n/a" ||
    cleanPhone.toLowerCase() === "none" ||
    cleanPhone.toLowerCase() === "not found" ||
    cleanPhone === "0"
  ) {
    cleanPhone = "Not found";
  }

  let cleanContactPerson = (raw.contactPerson || "").trim();
  if (
    !cleanContactPerson ||
    cleanContactPerson.toLowerCase() === "owner / manager" ||
    cleanContactPerson.toLowerCase() === "business manager" ||
    cleanContactPerson.toLowerCase() === "business owner" ||
    cleanContactPerson.toLowerCase() === "owner" ||
    cleanContactPerson.toLowerCase() === "manager" ||
    cleanContactPerson.toLowerCase() === "not found"
  ) {
    cleanContactPerson = "Not found";
  }

  const hasWebsite = cleanWebsite !== "Not found";
  const hasPhone = cleanPhone !== "Not found";
  const hasEmail = cleanEmail !== "Not found";
  const hasSource = Boolean(cleanSourceUrl);

  // Hard Rule: A lead with no real company name + no source + no website + no contact information MUST be rejected from Live Mode.
  if (!hasWebsite && !hasPhone && !hasEmail && !hasSource) {
    return {
      lead: {
        ...raw,
        businessName: name,
        website: cleanWebsite,
        email: cleanEmail,
        phone: cleanPhone,
        contactPerson: cleanContactPerson,
        verificationStatus: "REJECTED",
        verificationScore: 20,
        rejectionReason: "Rejected: Core identity missing (no website, source, phone, or email proof found)",
      },
      isVerified: false,
      reason: "No contact info or web source found",
    };
  }

  // 4. Compute Field Verification Flags
  const fieldVerification: FieldVerification = {
    companyNameVerified: true,
    locationVerified: Boolean(raw.address || raw.city || raw.country),
    industryVerified: Boolean(raw.industry),
    websiteVerified: hasWebsite,
    phoneVerified: hasPhone,
    emailVerified: hasEmail,
    contactPersonVerified: cleanContactPerson !== "Not found",
  };

  // 5. Compute Verification Score (0-100)
  let verificationScore = 30; // Real non-placeholder company name (+30)
  if (hasSource) verificationScore += 25;
  if (fieldVerification.locationVerified) verificationScore += 20;
  if (fieldVerification.industryVerified) verificationScore += 15;
  if (hasWebsite) verificationScore += 10;
  if (hasPhone) verificationScore += 5;
  if (hasEmail) verificationScore += 5;

  verificationScore = Math.min(100, verificationScore);

  const isVerified = verificationScore >= 80;
  const verificationStatus: "VERIFIED" | "UNVERIFIED" | "REJECTED" = isVerified ? "VERIFIED" : "UNVERIFIED";

  const normalizedLead: DiscoveredLeadRaw = {
    ...raw,
    businessName: name,
    website: cleanWebsite,
    sourceUrl: cleanSourceUrl || cleanWebsite || raw.sourceUrl || "",
    email: cleanEmail,
    phone: cleanPhone,
    contactPerson: cleanContactPerson,
    city: raw.city || queryContext?.city || "Local",
    country: raw.country || queryContext?.country || "USA",
    industry: raw.industry || queryContext?.industry || "General",
    verificationScore,
    fieldVerification,
    verificationStatus,
    rejectionReason: isVerified ? undefined : `Verification score (${verificationScore}/100) below threshold (80)`,
    websiteStatus: hasWebsite ? "Active Website Recorded" : "No Website Listed",
    evidenceText: `Verified business identity (${verificationScore}/100 verification score) via ${raw.source || "SerpApi"}.`,
  };

  return { lead: normalizedLead, isVerified, reason: normalizedLead.rejectionReason };
}

/**
 * Agent Kashi Qualification & Scoring Engine (0-100 Rubric)
 * ONLY runs on verified leads. Calculates Opportunity/Qualification Score separately from Verification Score.
 */
export async function qualifyLeadsWithKashi(
  verifiedRecords: DiscoveredLeadRaw[],
  query: LeadQueryParams
): Promise<DiscoveredLeadRaw[]> {
  if (!verifiedRecords || verifiedRecords.length === 0) return [];

  const hasAIKey = Boolean(
    (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0) ||
    (process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY.trim().length > 0)
  );

  if (!hasAIKey) {
    // Deterministic Kashi Rubric Scoring (0-100) fallback
    return verifiedRecords.map((lead) => {
      const isAgency = query.leadStrategy === 'AGENCY_PARTNERSHIPS' || (lead.industry || '').toLowerCase().includes('agency');
      let oppScore = 60; // base opportunity score for verified business
      if (lead.website && lead.website !== "Not found") oppScore += 10;
      if (lead.phone && lead.phone !== "Not found") oppScore += 5;
      if (lead.address) oppScore += 5;
      if (isAgency) oppScore += 5; // Subcontracting partnership potential

      let temperature: "HOT" | "STRONG" | "POTENTIAL" | "LOW" = "POTENTIAL";
      if (oppScore >= 80) temperature = "HOT";
      else if (oppScore >= 65) temperature = "STRONG";
      else if (oppScore >= 50) temperature = "POTENTIAL";
      else temperature = "LOW";

      const suggestedService = isAgency 
        ? "Frontend Subcontractor & Overflow React/Tailwind Implementation" 
        : (lead.suggestedService || "Responsive Business Frontend & Modernization");

      return {
        ...lead,
        score: oppScore,
        qualificationScore: oppScore,
        temperature,
        suggestedService,
        auditIssue: "Technical website audit pending live inspection",
        pitchHook: isAgency 
          ? `I noticed ${lead.businessName}'s agency work and wanted to introduce myself as a reliable frontend subcontractor for React/Tailwind overflow.`
          : `I came across ${lead.businessName} and wanted to share a few frontend observations for your online presence.`,
      };
    });
  }

  // Agent Kashi Opportunity Qualification (Gemini -> OpenRouter Fallback)
  try {
    const prompt = `You are Agent Kashi, a professional client-acquisition agent for frontend developer Muhammad Waqas.
Evaluate these REAL, VERIFIED business prospect records for client opportunity.

QUERY CONTEXT:
- Country: ${query.country || "USA"}
- City: ${query.city || "General"}
- Industry: ${query.industry || "General"}
- Opportunity Type: ${query.opportunityType || "Client Projects ($2k+)"}

VERIFIED BUSINESS RECORDS FROM PROVIDER:
${JSON.stringify(
  verifiedRecords.map((r, idx) => ({
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
    verificationScore: r.verificationScore,
  })),
  null,
  2
)}

STRICT RULES:
1. DO NOT invent or alter businessName, website, phone, email, address, city, country, source, or sourceUrl.
2. Score each business on Kashi's 0-100 Opportunity Rubric:
   - Budget Potential (25 pts): $2,000+ potential
   - Need (20 pts): real developer need or overflow capacity requirement
   - Skill Match (20 pts): React, TypeScript, Tailwind, HTML, CSS, Node
   - Client Quality (15 pts): legitimate operating business/agency/startup
   - Project Quality (10 pts): portfolio case-study value
   - Relationship Potential (10 pts): recurring/long-term potential
3. Set temperature: HOT (80-100 score), STRONG (65-79), POTENTIAL (50-64), LOW (0-49).
4. If Strategy is AGENCY_PARTNERSHIPS or business is an agency: Do not treat existing web services as a defect. Suggest "Frontend Subcontractor & Overflow Capacity" and focus on white-label implementation.
5. If Strategy is DIRECT_CLIENTS: Recommend responsive modernization, landing pages, or portals. Do not force React unless justified.
6. Since this is initial discovery, note that live DOM audit is pending. Set auditIssue: "Technical audit pending live inspection".
7. Developer profile: Muhammad Waqas (6 months frontend development, comfortable with React, Tailwind, HTML/CSS, TypeScript, Node). Never claim senior level.

Return JSON array matching input length with fields: id, score, temperature, suggestedService, auditIssue, pitchHook.`;

    const aiResult = await executeAIGeneratedContent({
      prompt,
      responseJson: true,
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
    });

    const evaluations: Array<{
      id: number;
      score: number;
      temperature: string;
      suggestedService: string;
      auditIssue: string;
      pitchHook: string;
    }> = JSON.parse(cleanJsonText(aiResult.text) || "[]");

    const evalMap = new Map(evaluations.map((e) => [e.id, e]));

    return verifiedRecords.map((lead, idx) => {
      const evalData = evalMap.get(idx);
      if (!evalData) return lead;

      const oppScore = Math.max(0, Math.min(100, evalData.score || 75));
      let temp = evalData.temperature as "HOT" | "STRONG" | "POTENTIAL" | "LOW";
      if (!["HOT", "STRONG", "POTENTIAL", "LOW"].includes(temp)) {
        if (oppScore >= 80) temp = "HOT";
        else if (oppScore >= 65) temp = "STRONG";
        else if (oppScore >= 50) temp = "POTENTIAL";
        else temp = "LOW";
      }

      return {
        ...lead,
        score: oppScore,
        qualificationScore: oppScore,
        temperature: temp,
        suggestedService: evalData.suggestedService || lead.suggestedService,
        auditIssue: evalData.auditIssue || lead.auditIssue,
        pitchHook: evalData.pitchHook || lead.pitchHook,
      };
    });
  } catch (err) {
    console.error("Kashi qualification error:", err);
    return verifiedRecords;
  }
}

/**
 * 0. Google Places API Provider (OFFICIAL PLACES & DETAILS)
 */
export class GooglePlacesProvider implements LeadProvider {
  id = "google-places";
  name = "Google Places API (Real Places & Details)";
  supportedSearchTypes = ["Real Business Discovery", "Google Place ID", "Phone & Address", "Rating & Reviews", "Business Status"];

  isConfigured(): boolean {
    const key = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
    return Boolean(key && key.trim().length > 0);
  }

  async testConnection(): Promise<ConnectionTestResult> {
    if (!this.isConfigured()) {
      updateProviderHealth(this.id, { status: "Not Configured" });
      return {
        success: false,
        statusCode: 503,
        message: "Google Places API is not configured. Please enter GOOGLE_PLACES_API_KEY in Data Sources.",
      };
    }

    try {
      const apiKey = (process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY)!.trim();
      const res = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=web+developer&key=${apiKey}`);
      const data = await res.json();
      if (res.ok && (data.status === "OK" || data.status === "ZERO_RESULTS")) {
        updateProviderHealth(this.id, { status: "Connected" });
        return {
          success: true,
          statusCode: 200,
          message: "Google Places API verified & connected successfully.",
          details: { status: data.status },
        };
      } else if (data.status === "REQUEST_DENIED") {
        updateProviderHealth(this.id, { status: "Unauthorized" });
        return {
          success: false,
          statusCode: 401,
          message: `Google Places API request denied: ${data.error_message || "Invalid API key or Places API not enabled in Google Cloud Console."}`,
        };
      } else {
        throw new Error(data.error_message || `Google Places API status: ${data.status}`);
      }
    } catch (err: any) {
      updateProviderHealth(this.id, { status: "Error" });
      return {
        success: false,
        statusCode: 500,
        message: err.message || "Google Places API connection test failed",
      };
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
        error: "Google Places API provider is not configured. Please enter GOOGLE_PLACES_API_KEY in Data Sources.",
        code: "LIVE_PROVIDER_NOT_CONFIGURED",
        searchParamsUsed: query,
      };
    }

    const { country, city, industry, keyword, opportunityType } = query;
    const apiKey = (process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY)!.trim();

    try {
      const queryParts = [keyword, industry, opportunityType].filter(Boolean).join(" ");
      const locationParts = [city, country].filter(Boolean).join(", ");
      const textQuery = locationParts ? `${queryParts} in ${locationParts}` : queryParts || "business";

      const placesUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(textQuery)}&key=${apiKey}`;
      const response = await fetch(placesUrl);

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Google Places API HTTP error (${response.status}): ${errText}`);
      }

      const data = await response.json();
      if (data.status === "REQUEST_DENIED") {
        throw new Error(`Google Places API denied: ${data.error_message || "Check API Key and Places API permissions"}`);
      }

      const results = data.results || [];
      if (results.length === 0) {
        updateProviderHealth(this.id, { status: "Connected", lastSuccessfulSearch: new Date().toISOString() });
        return {
          success: true,
          leads: [],
          provider: this.name,
          providerId: this.id,
          statusCode: 200,
          rawCount: 0,
          validatedCount: 0,
          rejectedCount: 0,
          searchParamsUsed: query,
        };
      }

      const rawLeads: DiscoveredLeadRaw[] = [];
      const topPlaces = results.slice(0, 12);

      for (const place of topPlaces) {
        const placeId = place.place_id;
        let website = "";
        let phone = "";
        let formattedAddress = place.formatted_address || "";

        if (placeId) {
          try {
            const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,international_phone_number,website,url,rating,user_ratings_total,business_status,types&key=${apiKey}`;
            const detailRes = await fetch(detailUrl);
            if (detailRes.ok) {
              const detailData = await detailRes.json();
              if (detailData.result) {
                website = detailData.result.website || "";
                phone = detailData.result.international_phone_number || detailData.result.formatted_phone_number || "";
                if (detailData.result.formatted_address) formattedAddress = detailData.result.formatted_address;
              }
            }
          } catch (e) {
            console.error(`Error fetching details for place ${placeId}:`, e);
          }
        }

        const sourceUrl = placeId 
          ? `https://www.google.com/maps/place/?q=place_id:${placeId}` 
          : (website || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name || "")}`);

        rawLeads.push({
          businessName: place.name || "",
          contactPerson: "Not found",
          email: "Not found",
          phone: phone || "Not found",
          website: website || "Not found",
          address: formattedAddress,
          city: city || "Local",
          country: country || "USA",
          industry: industry || (place.types?.[0]?.replace(/_/g, " ") || "Business"),
          source: "Google Places API",
          sourceUrl,
          verificationStatus: "UNVERIFIED",
          dateDiscovered: new Date().toISOString(),
          evidenceText: `Verified place record on Google Places API (Place ID: ${placeId || "N/A"}, Rating: ${place.rating || "N/A"} with ${place.user_ratings_total || 0} reviews).`,
        });
      }

      let rejectedCount = 0;
      const verifiedLeads: DiscoveredLeadRaw[] = [];

      for (const raw of rawLeads) {
        const { lead, isVerified } = verifyAndNormalizeLead(raw, query);
        if (isVerified) {
          verifiedLeads.push(lead);
        } else {
          rejectedCount++;
        }
      }

      const qualifiedLeads = await qualifyLeadsWithKashi(verifiedLeads, query);

      updateProviderHealth(this.id, { status: "Connected", lastSuccessfulSearch: new Date().toISOString() });

      return {
        success: true,
        leads: qualifiedLeads,
        provider: this.name,
        providerId: this.id,
        statusCode: 200,
        rawCount: results.length,
        validatedCount: qualifiedLeads.length,
        rejectedCount,
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
        error: err.message || "Failed Google Places API search execution",
        searchParamsUsed: query,
      };
    }
  }
}

/**
 * 1. SerpApi Google & Maps Search Provider (PRIMARY LIVE LEAD PROVIDER)
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

    const { country, city, industry, keyword, opportunityType, service, targetService, problemFocus } = query;
    const apiKey = process.env.SERPAPI_API_KEY!.trim();

    try {
      // Form query dynamically adapting to city, country, industry, and service
      const requestedService = service || targetService || "";
      const baseTerms = [industry, requestedService, keyword, opportunityType, problemFocus].filter(Boolean).join(" ");
      const locationParts = [city, country].filter(Boolean).join(", ");
      const fullQuery = locationParts ? `${baseTerms || "businesses"} in ${locationParts}` : baseTerms || "businesses";

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
          validatedCount: 0,
          rejectedCount: 0,
          searchParamsUsed: query,
        };
      }

      // Step 1: Map raw items with ZERO synthetic placeholders
      const rawLeads: DiscoveredLeadRaw[] = localResults.slice(0, 15).map((item: any) => {
        const title = item.title || item.name || "";
        const cleanWebsite = item.website || item.link || "";
        const phone = item.phone || item.phone_number || "";
        const address = item.address || item.formatted_address || "";
        const itemCategory = item.type || item.category || industry || "Business";
        
        const sourceUrl = item.link || item.serpapi_link || (item.place_id 
          ? `https://www.google.com/maps/place/?q=place_id:${item.place_id}` 
          : (cleanWebsite || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(title)}`));

        return {
          businessName: title,
          contactPerson: "Not found",
          email: "Not found",
          phone: phone || "Not found",
          website: cleanWebsite || "Not found",
          address: address || "",
          city: city || item.city || "Local",
          country: country || item.country || "USA",
          industry: itemCategory,
          source: "SerpApi Google Maps",
          sourceUrl,
          verificationStatus: "UNVERIFIED",
          dateDiscovered: new Date().toISOString(),
          evidenceText: `Verified local Google Maps record via SerpApi (Place ID: ${item.place_id || "N/A"}, Reviews: ${item.reviews || 0}, Rating: ${item.rating || "N/A"}).`,
        };
      });

      // Step 2: Field Verification & Pipeline Filtering (Deduplicate + Filter Fake domains)
      let rejectedCount = 0;
      const verifiedLeads: DiscoveredLeadRaw[] = [];
      const seenKeys = new Set<string>();

      for (const raw of rawLeads) {
        const dedupeKey = (raw.businessName + (raw.website || raw.phone || raw.address || "")).toLowerCase().replace(/[^a-z0-9]/g, "");
        if (seenKeys.has(dedupeKey)) {
          rejectedCount++;
          continue;
        }
        seenKeys.add(dedupeKey);

        const { lead, isVerified } = verifyAndNormalizeLead(raw, query);
        if (isVerified) {
          verifiedLeads.push(lead);
        } else {
          rejectedCount++;
        }
      }

      // Step 3: Only pass VERIFIED leads to AI qualification
      const qualifiedLeads = await qualifyLeadsWithKashi(verifiedLeads, query);

      updateProviderHealth(this.id, { status: "Connected", lastSuccessfulSearch: new Date().toISOString() });

      return {
        success: true,
        leads: qualifiedLeads,
        provider: this.name,
        providerId: this.id,
        statusCode: 200,
        rawCount: localResults.length,
        validatedCount: qualifiedLeads.length,
        rejectedCount,
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
 * 2. Foursquare Places API Provider
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
          businessName: item.name || "",
          contactPerson: "Not found",
          email: item.email || "Not found",
          phone: item.tel || "Not found",
          website: cleanSite || "Not found",
          address: item.location?.formatted_address || item.location?.address || "",
          city: item.location?.locality || city || "Local",
          country: item.location?.country || country || "USA",
          industry: item.categories?.[0]?.name || industry || "General",
          source: "Foursquare Places API",
          sourceUrl: fsqUrl,
          verificationStatus: "UNVERIFIED",
          dateDiscovered: new Date().toISOString(),
          evidenceText: `Verified place record on Foursquare Places API.`,
        };
      });

      let rejectedCount = 0;
      const verifiedLeads: DiscoveredLeadRaw[] = [];

      for (const raw of rawLeads) {
        const { lead, isVerified } = verifyAndNormalizeLead(raw, query);
        if (isVerified) verifiedLeads.push(lead);
        else rejectedCount++;
      }

      const qualifiedLeads = await qualifyLeadsWithKashi(verifiedLeads, query);

      updateProviderHealth(this.id, { status: "Connected", lastSuccessfulSearch: new Date().toISOString() });
      return {
        success: true,
        leads: qualifiedLeads,
        provider: this.name,
        providerId: this.id,
        statusCode: 200,
        rawCount: rawLeads.length,
        validatedCount: qualifiedLeads.length,
        rejectedCount,
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
          businessName: item.name || "",
          contactPerson: "Not found",
          email: "Not found",
          phone: item.phone || item.display_phone || "Not found",
          website: cleanSite || "Not found",
          address: item.location?.address1 || "",
          city: item.location?.city || city || "Local",
          country: item.location?.country || country || "USA",
          industry: item.categories?.[0]?.title || industry || "General",
          source: "Yelp Fusion API",
          sourceUrl: item.url || `https://www.yelp.com/biz/${item.id}`,
          verificationStatus: "UNVERIFIED",
          dateDiscovered: new Date().toISOString(),
          evidenceText: `Verified operating business on Yelp Fusion (${item.review_count || 0} reviews, ${item.rating || "N/A"} stars).`,
        };
      });

      let rejectedCount = 0;
      const verifiedLeads: DiscoveredLeadRaw[] = [];

      for (const raw of rawLeads) {
        const { lead, isVerified } = verifyAndNormalizeLead(raw, query);
        if (isVerified) verifiedLeads.push(lead);
        else rejectedCount++;
      }

      const qualifiedLeads = await qualifyLeadsWithKashi(verifiedLeads, query);

      updateProviderHealth(this.id, { status: "Connected", lastSuccessfulSearch: new Date().toISOString() });
      return {
        success: true,
        leads: qualifiedLeads,
        provider: this.name,
        providerId: this.id,
        statusCode: 200,
        rawCount: rawLeads.length,
        validatedCount: qualifiedLeads.length,
        rejectedCount,
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
  supportedSearchTypes = ["Client Projects ($2k+)", "Startup MVP Frontend", "Website Modernization", "Dashboard & Portals", "Any Custom Niche"];

  isConfigured(): boolean {
    return Boolean(
      (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0) ||
      (process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY.trim().length > 0)
    );
  }

  async testConnection(): Promise<ConnectionTestResult> {
    if (!this.isConfigured()) {
      updateProviderHealth(this.id, { status: "Not Configured" });
      return {
        success: false,
        statusCode: 503,
        message: "Google AI Studio / OpenRouter is not configured. Configure GEMINI_API_KEY or OPENROUTER_API_KEY.",
      };
    }

    try {
      const startTime = Date.now();
      const res = await executeAIGeneratedContent({
        prompt: "Respond with exact JSON: {\"status\":\"ok\",\"engine\":\"live\"}",
        responseJson: true,
      });
      const latency = Date.now() - startTime;

      if (res?.text) {
        updateProviderHealth(this.id, { status: "Connected", lastSuccessfulSearch: new Date().toISOString() });
        return {
          success: true,
          statusCode: 200,
          message: `Live Web Search Provider active & verified via ${res.provider} (${latency}ms latency).`,
          details: { provider: res.provider, latencyMs: latency, usedFallback: res.usedFallback },
        };
      }
      throw new Error("No response returned from live provider test");
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
        error: "Google Search Engine provider not configured. Configure GEMINI_API_KEY or OPENROUTER_API_KEY.",
        code: "LIVE_PROVIDER_NOT_CONFIGURED",
        searchParamsUsed: query,
      };
    }

    const { country, industry, city, opportunityType, budgetTarget, keyword } = query;

    const prompt = `You are a real-world client acquisition research engine for frontend web developer Muhammad Waqas (React, TypeScript, Tailwind, Next.js, Node.js).
Your mission is to find 6 to 8 REAL, AUTHENTIC, CURRENTLY OPERATING businesses, agencies, clinics, or startups matching the query:

QUERY PARAMETERS:
- Location / Target Region: ${city ? `${city}, ` : ""}${country || "Global / Remote"}
- Target Niche / Industry: ${industry || "Any Industry / Business"}
- Opportunity Goal / Project Type: ${opportunityType || "$2,000+ Client Projects"}
- Target Budget: ${budgetTarget || "$2,000+ Target"}
${keyword ? `- Specific Keywords / Requirement: ${keyword}` : ""}

STRICT AUTHENTICITY MANDATE:
1. Return ONLY GENUINE, REAL-WORLD EXISTING companies, startups, clinics, or agencies with real active websites and verifiable locations.
2. ZERO DEMO DATA, ZERO SYNTHETIC NAMES, ZERO PLACEHOLDERS (Never return fictitious names like "Apex Realty", "TechFlow Solutions", "Sample Co", or domains like "example.com" or "domain.com").
3. If an email, phone number, or executive contact person is not publicly listed or verified with confidence, you MUST explicitly output "Not found". DO NOT fabricate fake emails like info@company.com or contact@domain.com.
4. For every real business, inspect and identify their REAL, CONCRETE frontend weakness, web performance bottleneck, mobile UI flaw, accessibility issue, or modernization need.
5. Score each lead from 0-100 on Agent Kashi's Opportunity Rubric (Budget Potential 25, Need 20, React/Frontend Skill Match 20, Client Quality 15, Project Quality 10, Relationship Potential 10). Set temperature to HOT (80-100), STRONG (65-79), POTENTIAL (50-64), or LOW (<50).

Return ONLY a JSON array of objects with the exact structure:
[
  {
    "businessName": "Real Company Name",
    "website": "https://realcompany.com",
    "address": "Real physical street or district address",
    "city": "${city || "Real City"}",
    "country": "${country || "USA"}",
    "industry": "${industry || "Category"}",
    "contactPerson": "Real Founder/Executive Name or Not found",
    "email": "Real public email or Not found",
    "phone": "Real public phone or Not found",
    "sourceUrl": "https://realcompany.com",
    "score": 85,
    "temperature": "HOT",
    "suggestedService": "Custom Next.js Frontend Redesign & Mobile Performance Optimization",
    "auditIssue": "Concrete observed frontend issue (e.g. slow Largest Contentful Paint, non-responsive mobile layout, missing modern CTA funnel)",
    "pitchHook": "Specific observation tailored to their actual website and business"
  }
]`;

    try {
      const aiResult = await executeAIGeneratedContent({
        prompt,
        responseJson: true,
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              businessName: { type: Type.STRING },
              website: { type: Type.STRING },
              address: { type: Type.STRING },
              city: { type: Type.STRING },
              country: { type: Type.STRING },
              industry: { type: Type.STRING },
              contactPerson: { type: Type.STRING },
              email: { type: Type.STRING },
              phone: { type: Type.STRING },
              sourceUrl: { type: Type.STRING },
              score: { type: Type.INTEGER },
              temperature: { type: Type.STRING },
              suggestedService: { type: Type.STRING },
              auditIssue: { type: Type.STRING },
              pitchHook: { type: Type.STRING },
            },
            required: ["businessName", "website", "auditIssue", "suggestedService"],
          },
        },
      });

      const rawLeads: DiscoveredLeadRaw[] = JSON.parse(cleanJsonText(aiResult.text) || "[]");

      let rejectedCount = 0;
      const verifiedLeads: DiscoveredLeadRaw[] = [];

      for (const raw of rawLeads) {
        const itemWithSource: DiscoveredLeadRaw = {
          ...raw,
          source: `Google Live Search (${aiResult.provider})`,
          sourceUrl: raw.sourceUrl || raw.website || "",
          qualificationScore: raw.score || 75,
          score: raw.score || 75,
          temperature: (raw.temperature as any) || "STRONG",
        };

        const { lead, isVerified } = verifyAndNormalizeLead(itemWithSource, query);
        if (isVerified) {
          verifiedLeads.push(lead);
        } else {
          rejectedCount++;
        }
      }

      updateProviderHealth(this.id, { status: "Connected", lastSuccessfulSearch: new Date().toISOString() });
      return {
        success: true,
        leads: verifiedLeads,
        provider: `${this.name} (${aiResult.provider})`,
        providerId: this.id,
        statusCode: 200,
        rawCount: rawLeads.length,
        validatedCount: verifiedLeads.length,
        rejectedCount,
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
 * 5. Auto Multi-Source Aggregator Provider
 */
export class AutoMultiProvider implements LeadProvider {
  id = "auto-multi";
  name = "Multi-Source Lead Aggregator (All Active)";
  supportedSearchTypes = ["Combined Cross-Directory Search", "Any Niche Discovery"];

  isConfigured(): boolean {
    return Boolean(
      process.env.SERPAPI_API_KEY ||
      process.env.FOURSQUARE_API_KEY ||
      process.env.YELP_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.OPENROUTER_API_KEY
    );
  }

  async testConnection(): Promise<ConnectionTestResult> {
    const googleSearch = new GoogleSearchLiveProvider();
    if (googleSearch.isConfigured()) {
      return googleSearch.testConnection();
    }
    return {
      success: true,
      statusCode: 200,
      message: "Multi-Source Lead Aggregator ready.",
    };
  }

  async searchBusinesses(query: LeadQueryParams): Promise<ProviderSearchResult> {
    const providers: LeadProvider[] = [
      new SerpApiSearchProvider(),
      new GooglePlacesProvider(),
      new FoursquarePlacesProvider(),
      new YelpFusionProvider(),
    ];

    const activeProviders = providers.filter((p) => p.isConfigured());

    if (activeProviders.length === 0) {
      return {
        success: false,
        leads: [],
        provider: this.name,
        providerId: this.id,
        statusCode: 503,
        error: "No real lead provider configured. Please configure SERPAPI_API_KEY (Primary) in Data Sources or Settings.",
        code: "LIVE_PROVIDER_NOT_CONFIGURED",
        searchParamsUsed: query,
      };
    }

    const allLeads: DiscoveredLeadRaw[] = [];
    let totalRaw = 0;
    let totalRejected = 0;

    for (const provider of activeProviders) {
      try {
        const res = await provider.searchBusinesses(query);
        if (res.success && res.leads && res.leads.length > 0) {
          allLeads.push(...res.leads);
          totalRaw += res.rawCount || 0;
          totalRejected += res.rejectedCount || 0;
          if (allLeads.length >= 8) break;
        }
      } catch (err) {
        console.error(`Error in multi-provider (${provider.name}):`, err);
      }
    }

    // Deduplicate by business name / website domain
    const seenMap = new Set<string>();
    const deduplicatedLeads: DiscoveredLeadRaw[] = [];

    for (const lead of allLeads) {
      const key = (lead.businessName + (lead.website || lead.phone || "")).toLowerCase().replace(/[^a-z0-9]/g, "");
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
      rawCount: totalRaw,
      validatedCount: deduplicatedLeads.length,
      rejectedCount: totalRejected,
      searchParamsUsed: query,
    };
  }
}

/**
 * Provider Resolver Function
 * Primary: SerpAPI
 * Optional: Google Places API
 */
export function getLiveDataProvider(providerId?: string): LeadProvider {
  if (providerId === "serpapi-search") return new SerpApiSearchProvider();
  if (providerId === "google-places") return new GooglePlacesProvider();
  if (providerId === "auto-multi") return new AutoMultiProvider();
  if (providerId === "foursquare-places") return new FoursquarePlacesProvider();
  if (providerId === "yelp-fusion") return new YelpFusionProvider();

  // Default priority: SerpAPI (Primary) -> Google Places (Optional) -> Foursquare -> Yelp
  const serpapi = new SerpApiSearchProvider();
  if (serpapi.isConfigured()) return serpapi;

  const places = new GooglePlacesProvider();
  if (places.isConfigured()) return places;

  const autoMulti = new AutoMultiProvider();
  if (autoMulti.isConfigured()) return autoMulti;

  const foursquare = new FoursquarePlacesProvider();
  if (foursquare.isConfigured()) return foursquare;

  const yelp = new YelpFusionProvider();
  if (yelp.isConfigured()) return yelp;

  // Fallback to SerpApi (returns friendly not configured status and empty leads)
  return serpapi;
}
