import { GoogleGenAI, Type } from "@google/genai";

export interface AIOptions {
  prompt: string;
  responseJson?: boolean;
  responseSchema?: any;
  model?: string;
}

export interface AIResult {
  text: string;
  provider: string;
  usedFallback: boolean;
}

// Utility to safely extract JSON string from raw markdown fences if present
export function cleanJsonText(rawText: string): string {
  if (!rawText) return "{}";
  let cleaned = rawText.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  }
  return cleaned;
}

// OpenRouter API Direct Caller
export async function callOpenRouter(prompt: string, responseJson: boolean = false): Promise<string> {
  const openRouterKey = (process.env.OPENROUTER_API_KEY || "").trim();
  if (!openRouterKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is missing.");
  }

  const model = process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash";
  const body: any = {
    model,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  };

  if (responseJson) {
    body.response_format = { type: "json_object" };
  }

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openRouterKey}`,
      "HTTP-Referer": process.env.APP_URL || "https://leadflow-ai-os.com",
      "X-Title": "LeadFlow AI OS",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    let parsedErr = errText;
    try {
      const errObj = JSON.parse(errText);
      parsedErr = errObj?.error?.message || errText;
    } catch (_) {}
    throw new Error(`OpenRouter API error (${res.status}): ${parsedErr}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error("OpenRouter API returned empty response.");
  }

  return text;
}

// Unified AI Execution Engine with Automatic Gemini -> OpenRouter Fallback
export async function executeAIGeneratedContent(options: AIOptions): Promise<AIResult> {
  const geminiKey = (process.env.GEMINI_API_KEY || "").trim();
  const openRouterKey = (process.env.OPENROUTER_API_KEY || "").trim();

  let geminiError: any = null;

  // 1. Attempt Primary Execution via Gemini API
  if (geminiKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey: geminiKey,
        httpOptions: {
          headers: {
            "User-Agent": "leadflow-ai-os",
          },
        },
      });

      const config: any = {};
      if (options.responseJson) {
        config.responseMimeType = "application/json";
      }
      if (options.responseSchema) {
        config.responseSchema = options.responseSchema;
      }

      const response = await ai.models.generateContent({
        model: options.model || "gemini-3.6-flash",
        contents: options.prompt,
        config: Object.keys(config).length > 0 ? config : undefined,
      });

      if (response?.text) {
        return {
          text: response.text,
          provider: "gemini-3.6-flash",
          usedFallback: false,
        };
      }
    } catch (err: any) {
      console.warn("Gemini API call failed or rate-limited. Checking OpenRouter fallback...", err?.message || err);
      geminiError = err;
    }
  }

  // 2. Automatic Fallback to OpenRouter if Gemini failed / limit ended / key missing
  if (openRouterKey) {
    try {
      let openRouterPrompt = options.prompt;
      if (options.responseJson && !openRouterPrompt.includes("JSON")) {
        openRouterPrompt += "\n\nIMPORTANT: Return valid, parseable JSON matching the requested fields.";
      }

      const text = await callOpenRouter(openRouterPrompt, options.responseJson);
      return {
        text,
        provider: `openrouter (${process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash"})`,
        usedFallback: true,
      };
    } catch (openRouterErr: any) {
      console.error("OpenRouter API fallback also failed:", openRouterErr?.message || openRouterErr);
      const combinedMsg = geminiError
        ? `Primary Gemini API failed (${geminiError.message || "quota/error"}) AND OpenRouter fallback failed (${openRouterErr.message}).`
        : `OpenRouter API failed: ${openRouterErr.message}`;
      const err: any = new Error(combinedMsg);
      err.code = "ALL_AI_PROVIDERS_FAILED";
      throw err;
    }
  }

  // If Gemini failed and OpenRouter key is missing
  if (geminiError) {
    throw geminiError;
  }

  const noKeysErr: any = new Error("Neither GEMINI_API_KEY nor OPENROUTER_API_KEY is configured.");
  noKeysErr.code = "API_KEY_MISSING";
  throw noKeysErr;
}
