export interface ApiLogEntry {
  id: string;
  timestamp: string;
  endpoint: string;
  method: string;
  status: number;
  provider: string;
  durationMs: number;
  cacheHit: boolean;
  dataSource: string;
  errorCode?: string;
  errorMessage?: string;
  rawCount?: number;
  validatedCount?: number;
  rejectedCount?: number;
  duplicateCount?: number;
}

type Listener = (logs: ApiLogEntry[]) => void;

let apiLogs: ApiLogEntry[] = [];
const listeners: Set<Listener> = new Set();

export const addApiLog = (entry: Omit<ApiLogEntry, 'id' | 'timestamp'>) => {
  const newEntry: ApiLogEntry = {
    ...entry,
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
  };
  apiLogs = [newEntry, ...apiLogs.slice(0, 49)]; // keep latest 50
  listeners.forEach((fn) => fn(apiLogs));
};

export const getApiLogs = () => apiLogs;

export const clearApiLogs = () => {
  apiLogs = [];
  listeners.forEach((fn) => fn(apiLogs));
};

export const subscribeApiLogs = (fn: Listener) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};

/**
  Robust fetch wrapper that logs diagnostic metadata and parses JSON safely without throwing HTML syntax errors.
*/
export async function loggedFetch(url: string, options?: RequestInit): Promise<{
  ok: boolean;
  status: number;
  data: any;
  error?: string;
  code?: string;
  durationMs: number;
}> {
  const startTime = performance.now();
  let status = 0;
  let cacheHit = false;
  let provider = 'Netlify Serverless';
  let data: any = null;
  let errorMsg: string | undefined = undefined;
  let errorCode: string | undefined = undefined;

  // Extract client-side saved provider keys from localStorage
  const forwardedHeaders: Record<string, string> = {};
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const rawKeys = localStorage.getItem('leadflow_provider_keys');
      if (rawKeys) {
        const parsed = JSON.parse(rawKeys);
        if (parsed.serpapiKey) forwardedHeaders['x-serpapi-key'] = parsed.serpapiKey;
        if (parsed.geminiKey) forwardedHeaders['x-gemini-key'] = parsed.geminiKey;
        if (parsed.openrouterKey) forwardedHeaders['x-openrouter-key'] = parsed.openrouterKey;
        if (parsed.googlePlacesKey) forwardedHeaders['x-google-places-key'] = parsed.googlePlacesKey;
      }
    } catch (e) {
      // Ignore localStorage parse errors
    }
  }

  const mergedHeaders = {
    ...forwardedHeaders,
    ...(options?.headers || {}),
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers: mergedHeaders,
    });
    status = res.status;
    const durationMs = Math.round(performance.now() - startTime);

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await res.text();
      errorMsg = `Server returned non-JSON response (${res.status}): ${text.substring(0, 100)}...`;
      errorCode = res.status === 404 ? 'ROUTE_NOT_FOUND_404' : 'INVALID_JSON_RESPONSE';

      addApiLog({
        endpoint: url,
        method: options?.method || 'GET',
        status,
        provider: 'Netlify SPA Fallback (HTML)',
        durationMs,
        cacheHit: false,
        dataSource: 'HTML 404',
        errorCode,
        errorMessage: errorMsg,
      });

      return {
        ok: false,
        status,
        data: null,
        error: errorMsg,
        code: errorCode,
        durationMs,
      };
    }

    data = await res.json();
    provider = data.provider || 'Gemini 3.6 Flash / Netlify';
    cacheHit = Boolean(data.cacheHit);

    if (!data.success) {
      errorMsg = data.error || 'API returned failure status';
      errorCode = data.code || 'API_FAILURE';
    }

    addApiLog({
      endpoint: url,
      method: options?.method || 'GET',
      status,
      provider,
      durationMs,
      cacheHit,
      dataSource: data.leads ? 'Live Search Engine' : 'AI Service',
      errorCode,
      errorMessage: errorMsg,
      rawCount: data.leads?.length || data.prospects?.length,
      validatedCount: data.leads?.length || data.prospects?.length,
    });

    return {
      ok: res.ok && Boolean(data.success),
      status,
      data,
      error: errorMsg,
      code: errorCode,
      durationMs,
    };
  } catch (err: any) {
    const durationMs = Math.round(performance.now() - startTime);
    errorMsg = err.message || 'Network request failed';
    errorCode = 'NETWORK_ERROR';

    addApiLog({
      endpoint: url,
      method: options?.method || 'GET',
      status: 0,
      provider: 'Client Network',
      durationMs,
      cacheHit: false,
      dataSource: 'Client',
      errorCode,
      errorMessage: errorMsg,
    });

    return {
      ok: false,
      status: 0,
      data: null,
      error: errorMsg,
      code: errorCode,
      durationMs,
    };
  }
}
