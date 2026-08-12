import { GoogleGenAI, Type } from "@google/genai";

export interface LeadQueryParams {
  country?: string;
  city?: string;
  industry?: string;
  opportunityType?: string;
  budgetTarget?: string;
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
  source?: string;
}

export interface LiveDataProviderResult {
  success: boolean;
  leads: DiscoveredLeadRaw[];
  provider: string;
  error?: string;
  code?: string;
}

/**
 * Provider-agnostic interface for live lead discovery services
 */
export interface LiveDataProvider {
  id: string;
  name: string;
  isConfigured(): boolean;
  fetchLeads(query: LeadQueryParams): Promise<LiveDataProviderResult>;
}

/**
 * Gemini-powered Live Data Provider implementation
 */
export class GeminiLiveDataProvider implements LiveDataProvider {
  id = "gemini-live-provider";
  name = "Google Gemini 3.6 Flash Engine";

  private getApiKey(): string {
    return process.env.GEMINI_API_KEY || "";
  }

  isConfigured(): boolean {
    const key = this.getApiKey();
    return Boolean(key && key.trim().length > 0);
  }

  async fetchLeads(query: LeadQueryParams): Promise<LiveDataProviderResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        leads: [],
        provider: this.name,
        error: "Live lead provider not configured. Please set the GEMINI_API_KEY environment variable in server/Netlify settings.",
        code: "LIVE_PROVIDER_NOT_CONFIGURED",
      };
    }

    const apiKey = this.getApiKey();
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "leadflow-ai-os",
        },
      },
    });

    const { country, industry, city, opportunityType, budgetTarget } = query;

    const prompt = `You are an expert B2B lead generation engine for freelance web developers.
Find 6 REAL or highly realistic prospect businesses for freelance outreach matching these parameters:
- Country: ${country || "USA"}
- Industry: ${industry || "Real Estate"}
- City/Keyword: ${city || "General"}
- Opportunity Type: ${opportunityType || "Client Projects"}
- Budget Target: ${budgetTarget || "All Ranges"}

Requirements:
1. Provide accurate business names and location details strictly belonging to ${city || country}.
2. Identify a realistic website flaw or weakness (mobile responsiveness, slow load time, missing CTA, outdated design).
3. Do NOT reuse generic templated company names. Each search must return unique leads tailored to ${city || country} and ${industry}.
4. Return zero sample/mock records if no matching real businesses can be identified.

Return JSON matching this exact structure:
[
  {
    "businessName": "Business Name",
    "contactPerson": "Full Name (Role)",
    "email": "contact@example.com",
    "phone": "+1 555-0123",
    "website": "www.example.com",
    "address": "123 Main St, City",
    "city": "${city || "Local"}",
    "country": "${country || "USA"}",
    "industry": "${industry || "Real Estate"}",
    "score": 85,
    "temperature": "WARM",
    "websiteStatus": "Needs Mobile Redesign & CTA",
    "suggestedService": "Modern Responsive Redesign & Booking Engine",
    "auditIssue": "Lacks mobile responsiveness, no direct appointment CTA button.",
    "pitchHook": "I noticed your site takes over 4 seconds to load on mobile viewports."
  }
]`;

    try {
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
              },
              required: [
                "businessName",
                "contactPerson",
                "email",
                "website",
                "score",
                "temperature",
                "suggestedService",
                "auditIssue",
                "pitchHook",
              ],
            },
          },
        },
      });

      const text = response.text || "[]";
      const leads: DiscoveredLeadRaw[] = JSON.parse(text);

      return {
        success: true,
        leads,
        provider: "gemini-3.6-flash",
      };
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      return {
        success: false,
        leads: [],
        provider: this.name,
        error: errMsg || "Failed to fetch leads from live Gemini provider",
        code: err?.code || "LIVE_PROVIDER_FETCH_ERROR",
      };
    }
  }
}

/**
 * Null/Unconfigured Live Data Provider stub
 */
export class UnconfiguredLiveDataProvider implements LiveDataProvider {
  id = "unconfigured-provider";
  name = "Live Lead Provider (Unconfigured)";

  isConfigured(): boolean {
    return false;
  }

  async fetchLeads(): Promise<LiveDataProviderResult> {
    return {
      success: false,
      leads: [],
      provider: this.name,
      error: "Live lead provider not configured. Please configure a live data source or API key in your environment settings.",
      code: "LIVE_PROVIDER_NOT_CONFIGURED",
    };
  }
}

/**
 * Provider-agnostic provider resolver function
 */
export function getLiveDataProvider(): LiveDataProvider {
  const geminiProvider = new GeminiLiveDataProvider();
  if (geminiProvider.isConfigured()) {
    return geminiProvider;
  }
  return new UnconfiguredLiveDataProvider();
}
