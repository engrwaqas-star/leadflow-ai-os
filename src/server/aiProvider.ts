/**
 * Centralized AI client with fallback:
 * Priority: OpenRouter -> Gemini -> Groq
 *
 * Exports:
 * - generateAI(request)
 * - getAIProvidersStatus()
 *
 * Notes:
 * - Uses server-side env vars: OPENROUTER_API_KEY, GEMINI_API_KEY, GROQ_API_KEY
 * - Does not put API keys in frontend code
 * - Does minimal probe requests for status; adjust endpoints/models to match your account if needed
 */

type Role = 'system' | 'user' | 'assistant';

export type AIMessage = {
  role: Role;
  content: string;
};

export type AIRequest = {
  messages: AIMessage[];      // canonical message list
  model?: string;             // optional preferred model name
  temperature?: number;
  maxTokens?: number;
};

export type AIProviderResult = {
  success: boolean;
  provider: 'openrouter' | 'gemini' | 'groq' | 'none';
  model?: string | null;
  text?: string | null;       // unified best-effort text output
  raw?: any;                  // raw provider response for debugging
  error?: {
    code?: number;
    message: string;
  } | null;
};

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

const DEFAULT_TIMEOUT_MS = 10_000;

// Utility: join messages into a single prompt for providers that don't accept structured messages
function messagesToPrompt(messages: AIMessage[]) {
  return messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');
}

function timeoutSignal(timeoutMs = DEFAULT_TIMEOUT_MS) {
  const ctl = new AbortController();
  const id = setTimeout(() => ctl.abort(), timeoutMs);
  return { signal: ctl.signal, clear: () => clearTimeout(id) };
}

function isTransientProviderError(status?: number, bodyText?: string) {
  // Consider status codes and response bodies that indicate rate-limit/quota/temporary trouble
  if (!status) return true; // treat unknown as transient
  if ([429, 500, 502, 503, 504].includes(status)) return true;
  if (bodyText) {
    const lower = bodyText.toLowerCase();
    if (lower.includes('quota') || lower.includes('rate limit') || lower.includes('rate_limit') ||
        lower.includes('model not found') || lower.includes('model unavailable') ||
        lower.includes('temporarily') || lower.includes('unavailable')) {
      return true;
    }
  }
  return false;
}

/* ------------------------
   Provider-specific calls
   ------------------------ */

// OpenRouter: https://openrouter.ai/ (example)
async function callOpenRouter(req: AIRequest): Promise<AIProviderResult> {
  if (!OPENROUTER_API_KEY) {
    return {
      success: false,
      provider: 'openrouter',
      model: req.model ?? 'openai/gpt-4o-mini', // placeholder default
      text: null,
      raw: null,
      error: { message: 'Missing OPENROUTER_API_KEY' }
    };
  }

  const model = req.model ?? 'gpt-4o-mini'; // adapt to what you have access to
  const body = {
    model,
    messages: req.messages.map(m => ({ role: m.role, content: m.content })),
    temperature: req.temperature ?? 0.7,
    max_tokens: req.maxTokens ?? 768
  };

  const { signal, clear } = timeoutSignal(DEFAULT_TIMEOUT_MS);
  try {
    const resp = await fetch('https://api.openrouter.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify(body),
      signal
    });
    clear();

    const text = await resp.text();
    let parsed: any = null;
    try { parsed = JSON.parse(text); } catch (_) { parsed = text; }

    if (!resp.ok) {
      return {
        success: false,
        provider: 'openrouter',
        model,
        text: null,
        raw: parsed,
        error: { code: resp.status, message: (parsed?.error?.message ?? parsed?.message ?? String(text)) }
      };
    }

    // attempt to extract the text reply
    const content = parsed?.choices?.[0]?.message?.content
      ?? parsed?.choices?.[0]?.text
      ?? (typeof parsed === 'string' ? parsed : null);

    return {
      success: true,
      provider: 'openrouter',
      model,
      text: content ?? null,
      raw: parsed,
      error: null
    };
  } catch (err: any) {
    return {
      success: false,
      provider: 'openrouter',
      model,
      text: null,
      raw: String(err),
      error: { message: err?.message ?? String(err) }
    };
  }
}

// Gemini (Google): best-effort minimal wrapper.
// NOTE: Adjust endpoint/model name to your environment (PaLM/Generative API may use different path).
async function callGemini(req: AIRequest): Promise<AIProviderResult> {
  if (!GEMINI_API_KEY) {
    return {
      success: false,
      provider: 'gemini',
      model: req.model ?? 'gemini-default',
      text: null,
      raw: null,
      error: { message: 'Missing GEMINI_API_KEY' }
    };
  }

  // Convert structured messages into a single prompt for a single-text generate call.
  const prompt = messagesToPrompt(req.messages);
  const model = req.model ?? 'models/text-bison-001'; // update if your project uses a different path

  const body = {
    // For Google generative models: `prompt` or `input` shape may differ in real API.
    // This is a minimal generic request; adjust to the exact API you have access to.
    prompt: { text: prompt },
    temperature: req.temperature ?? 0.7,
    max_output_tokens: req.maxTokens ?? 512
  };

  const { signal, clear } = timeoutSignal(DEFAULT_TIMEOUT_MS);
  try {
    // using API key in query param is common for lightweight server calls; you can also use Authorization header
    const url = `https://generativelanguage.googleapis.com/v1beta2/${encodeURIComponent(model)}:generate?key=${encodeURIComponent(GEMINI_API_KEY)}`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal
    });
    clear();

    const text = await resp.text();
    let parsed: any = null;
    try { parsed = JSON.parse(text); } catch (_) { parsed = text; }

    if (!resp.ok) {
      return {
        success: false,
        provider: 'gemini',
        model,
        text: null,
        raw: parsed,
        error: { code: resp.status, message: (parsed?.error?.message ?? parsed?.message ?? String(text)) }
      };
    }

    const content = parsed?.candidates?.[0]?.content
      ?? parsed?.output?.[0]?.content
      ?? (typeof parsed === 'string' ? parsed : null);

    return {
      success: true,
      provider: 'gemini',
      model,
      text: content ?? null,
      raw: parsed,
      error: null
    };
  } catch (err: any) {
    return {
      success: false,
      provider: 'gemini',
      model,
      text: null,
      raw: String(err),
      error: { message: err?.message ?? String(err) }
    };
  }
}

// Groq: example minimal wrapper for Groq API
async function callGroq(req: AIRequest): Promise<AIProviderResult> {
  if (!GROQ_API_KEY) {
    return {
      success: false,
      provider: 'groq',
      model: req.model ?? 'groq-default',
      text: null,
      raw: null,
      error: { message: 'Missing GROQ_API_KEY' }
    };
  }

  const prompt = messagesToPrompt(req.messages);
  const model = req.model ?? 'groq-1.5'; // update if you have a different model

  const body = {
    model,
    prompt,
    max_tokens: req.maxTokens ?? 512,
    temperature: req.temperature ?? 0.7
  };

  const { signal, clear } = timeoutSignal(DEFAULT_TIMEOUT_MS);
  try {
    const resp = await fetch('https://api.groq.com/v1/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify(body),
      signal
    });
    clear();

    const text = await resp.text();
    let parsed: any = null;
    try { parsed = JSON.parse(text); } catch (_) { parsed = text; }

    if (!resp.ok) {
      return {
        success: false,
        provider: 'groq',
        model,
        text: null,
        raw: parsed,
        error: { code: resp.status, message: (parsed?.error?.message ?? parsed?.message ?? String(text)) }
      };
    }

    const content = parsed?.choices?.[0]?.text
      ?? parsed?.completion
      ?? (typeof parsed === 'string' ? parsed : null);

    return {
      success: true,
      provider: 'groq',
      model,
      text: content ?? null,
      raw: parsed,
      error: null
    };
  } catch (err: any) {
    return {
      success: false,
      provider: 'groq',
      model,
      text: null,
      raw: String(err),
      error: { message: err?.message ?? String(err) }
    };
  }
}

/* ------------------------
   High-level generateAI
   ------------------------ */

// Attempts providers in order; uses transient detection to decide fallback.
export async function generateAI(req: AIRequest): Promise<AIProviderResult> {
  // Try OpenRouter first
  const open = await callOpenRouter(req);
  if (open.success) return open;

  // Decide whether we should fallback on OpenRouter failure
  const openBodyText = JSON.stringify(open.raw ?? open.error ?? '');
  if (isTransientProviderError(open.error?.code, openBodyText)) {
    // fallback to Gemini
    const gem = await callGemini(req);
    if (gem.success) return gem;

    const gemBodyText = JSON.stringify(gem.raw ?? gem.error ?? '');
    if (isTransientProviderError(gem.error?.code, gemBodyText)) {
      // fallback to Groq
      const groq = await callGroq(req);
      if (groq.success) return groq;

      // All providers failed
      return {
        success: false,
        provider: 'none',
        model: null,
        text: null,
        raw: {
          open,
          gem,
          groq
        },
        error: { message: 'AI_UNAVAILABLE: All providers failed or are rate-limited/quota-limited.' }
      };
    }

    // Gemini failed but was non-transient: return Gemini error (no further fallback)
    return {
      success: false,
      provider: gem.provider,
      model: gem.model,
      text: null,
      raw: gem.raw,
      error: { message: gem.error?.message ?? 'Gemini returned an error' }
    };
  }

  // OpenRouter failed but non-transient (e.g., bad key). In this case we return the OpenRouter error without trying other providers.
  return {
    success: false,
    provider: open.provider,
    model: open.model,
    text: null,
    raw: open.raw,
    error: { message: open.error?.message ?? 'OpenRouter returned an error' }
  };
}

/* ------------------------
   Provider status probe
   ------------------------ */

// A small probe that tries a cheap request and returns a string: 'Available', 'Quota Limited', 'Unavailable'
async function probeOpenRouter(): Promise<'Available' | 'Quota Limited' | 'Unavailable'> {
  if (!OPENROUTER_API_KEY) return 'Unavailable';
  const body = { model: 'gpt-4o-mini', messages: [{ role: 'system', content: 'ping' }, { role: 'user', content: 'ping' }], max_tokens: 1 };
  try {
    const { signal, clear } = timeoutSignal(3000);
    const resp = await fetch('https://api.openrouter.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENROUTER_API_KEY}` },
      body: JSON.stringify(body),
      signal
    });
    clear();

    if (resp.status === 429) return 'Quota Limited';
    if (resp.ok) return 'Available';
    return 'Unavailable';
  } catch (_err) {
    return 'Unavailable';
  }
}

async function probeGemini(): Promise<'Available' | 'Quota Limited' | 'Unavailable'> {
  if (!GEMINI_API_KEY) return 'Unavailable';
  try {
    const body = { prompt: { text: 'ping' }, max_output_tokens: 1 };
    const { signal, clear } = timeoutSignal(3000);
    const url = `https://generativelanguage.googleapis.com/v1beta2/models/text-bison-001:generate?key=${encodeURIComponent(GEMINI_API_KEY)}`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal
    });
    clear();

    if (resp.status === 429) return 'Quota Limited';
    if (resp.ok) return 'Available';
    return 'Unavailable';
  } catch (_err) {
    return 'Unavailable';
  }
}

async function probeGroq(): Promise<'Available' | 'Quota Limited' | 'Unavailable'> {
  if (!GROQ_API_KEY) return 'Unavailable';
  try {
    const body = { model: 'groq-1.5', prompt: 'ping', max_tokens: 1 };
    const { signal, clear } = timeoutSignal(3000);
    const resp = await fetch('https://api.groq.com/v1/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify(body),
      signal
    });
    clear();

    if (resp.status === 429) return 'Quota Limited';
    if (resp.ok) return 'Available';
    return 'Unavailable';
  } catch (_err) {
    return 'Unavailable';
  }
}

export async function getAIProvidersStatus(): Promise<{
  openrouter: string;
  gemini: string;
  groq: string;
}> {
  const [open, gem, groq] = await Promise.all([probeOpenRouter(), probeGemini(), probeGroq()]);
  return { openrouter: open, gemini: gem, groq: groq };
}
