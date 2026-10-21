/**
 * Real Server-Side Website Audit Engine
 * Performs genuine HTTP fetch, latency measurement, SSL verification,
 * and HTML DOM inspection for responsive viewports, CTA elements, and technology stack.
 */

import { FindingItem } from '../types';

export interface WebsiteAuditResult {
  url: string;
  cleanUrl: string;
  isReachable: boolean;
  httpStatus?: number;
  statusText?: string;
  responseTimeMs?: number;
  hasSSL: boolean;
  hasMobileViewport: boolean;
  viewportContent?: string;
  pageTitle?: string;
  metaDescription?: string;
  h1Count?: number;
  h1Text?: string;
  hasCTA: boolean;
  ctaElementsFound: string[];
  hasPhoneLink: boolean;
  hasEmailLink: boolean;
  hasContactForm: boolean;
  detectedTech: string[];
  speedRating: 'Fast' | 'Average' | 'Slow' | 'Unreachable';
  auditIssues: string[];
  technicalStrengths: string[];
  findings: FindingItem[];
  auditedAt: string;
  rawPayloadBytes?: number;
  errorMessage?: string;
}

export async function auditWebsiteLive(rawUrl: string): Promise<WebsiteAuditResult> {
  const timestamp = new Date().toISOString();
  
  if (!rawUrl || rawUrl === 'Not found' || rawUrl.trim().length === 0) {
    return {
      url: rawUrl || '',
      cleanUrl: '',
      isReachable: false,
      hasSSL: false,
      hasMobileViewport: false,
      hasCTA: false,
      ctaElementsFound: [],
      hasPhoneLink: false,
      hasEmailLink: false,
      hasContactForm: false,
      detectedTech: [],
      speedRating: 'Unreachable',
      auditIssues: ['No valid website URL provided'],
      technicalStrengths: [],
      findings: [],
      auditedAt: timestamp,
      errorMessage: 'Missing URL',
    };
  }

  let cleanUrl = rawUrl.trim();
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = `https://${cleanUrl}`;
  }

  const hasSSL = cleanUrl.startsWith('https://');
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6500);

  const startTime = Date.now();
  let html = '';
  let httpStatus = 0;
  let statusText = '';
  let responseTimeMs = 0;
  let rawPayloadBytes = 0;

  try {
    const res = await fetch(cleanUrl, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LeadFlowAuditBot/2.0; +https://leadflow-ai-os.com/bot)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    clearTimeout(timeoutId);
    responseTimeMs = Date.now() - startTime;
    httpStatus = res.status;
    statusText = res.statusText;

    if (!res.ok && res.status >= 400) {
      return {
        url: rawUrl,
        cleanUrl,
        isReachable: false,
        httpStatus,
        statusText,
        responseTimeMs,
        hasSSL,
        hasMobileViewport: false,
        hasCTA: false,
        ctaElementsFound: [],
        hasPhoneLink: false,
        hasEmailLink: false,
        hasContactForm: false,
        detectedTech: [],
        speedRating: 'Unreachable',
        auditIssues: [`Server returned HTTP ${httpStatus} (${statusText || 'Error'})`],
        technicalStrengths: [],
        findings: [],
        auditedAt: timestamp,
        errorMessage: `HTTP error ${httpStatus}`,
      };
    }

    html = await res.text();
    rawPayloadBytes = Buffer.byteLength(html, 'utf8');
  } catch (err: any) {
    clearTimeout(timeoutId);
    responseTimeMs = Date.now() - startTime;
    const isTimeout = err?.name === 'AbortError' || err?.message?.includes('aborted');
    return {
      url: rawUrl,
      cleanUrl,
      isReachable: false,
      responseTimeMs,
      hasSSL,
      hasMobileViewport: false,
      hasCTA: false,
      ctaElementsFound: [],
      hasPhoneLink: false,
      hasEmailLink: false,
      hasContactForm: false,
      detectedTech: [],
      speedRating: 'Unreachable',
      auditIssues: [isTimeout ? 'Website connection timed out (>6.5s)' : `Connection failed: ${err.message || 'Host unreachable'}`],
      technicalStrengths: [],
      findings: [],
      auditedAt: timestamp,
      errorMessage: err.message,
    };
  }

  // --- Real HTML DOM Inspection ---
  const lowerHtml = html.toLowerCase();
  const auditIssues: string[] = [];
  const technicalStrengths: string[] = [];
  const detectedTech: string[] = [];
  const ctaElementsFound: string[] = [];

  // 1. Mobile Viewport Check
  const viewportMatch = html.match(/<meta[^>]*name=["']viewport["'][^>]*content=["']([^"']+)["']/i) ||
                        html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']viewport["']/i);
  const hasMobileViewport = Boolean(viewportMatch);
  const viewportContent = viewportMatch ? viewportMatch[1] : undefined;

  if (hasMobileViewport) {
    technicalStrengths.push('Responsive viewport meta tag declared');
  } else {
    auditIssues.push('CRITICAL: Missing mobile viewport meta tag (unresponsive on mobile devices)');
  }

  // 2. Title & Meta Description
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const pageTitle = titleMatch ? titleMatch[1].trim() : undefined;
  if (!pageTitle || pageTitle.length < 5) {
    auditIssues.push('Missing or empty <title> tag affecting SEO rankings');
  } else {
    technicalStrengths.push(`Page title configured: "${pageTitle.slice(0, 40)}${pageTitle.length > 40 ? '...' : ''}"`);
  }

  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
                    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
  const metaDescription = descMatch ? descMatch[1].trim() : undefined;
  if (!metaDescription) {
    auditIssues.push('Missing meta description tag');
  }

  // 3. Headings
  const h1Matches = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi) || [];
  const h1Count = h1Matches.length;
  let h1Text: string | undefined = undefined;
  if (h1Count === 0) {
    auditIssues.push('Missing primary <h1> heading for clear value proposition');
  } else if (h1Count > 1) {
    auditIssues.push(`Multiple <h1> tags (${h1Count}) found; structure should be streamlined`);
  } else {
    const rawH1 = h1Matches[0].replace(/<[^>]+>/g, '').trim();
    h1Text = rawH1.slice(0, 80);
    technicalStrengths.push('Clean single <h1> hierarchy');
  }

  // 4. Contact & Conversion Signals (CTAs)
  const hasPhoneLink = lowerHtml.includes('href="tel:') || lowerHtml.includes("href='tel:");
  const hasEmailLink = lowerHtml.includes('href="mailto:') || lowerHtml.includes("href='mailto:");
  const hasContactForm = lowerHtml.includes('<form') && (lowerHtml.includes('submit') || lowerHtml.includes('input'));

  if (hasPhoneLink) ctaElementsFound.push('Direct tap-to-call link');
  if (hasEmailLink) ctaElementsFound.push('Direct mailto link');
  if (hasContactForm) ctaElementsFound.push('Interactive lead capture form');

  // Button keyword search
  const ctaKeywords = ['book now', 'schedule', 'get a quote', 'free quote', 'contact us', 'get started', 'request estimate', 'consultation'];
  ctaKeywords.forEach((kw) => {
    if (lowerHtml.includes(kw)) {
      ctaElementsFound.push(`Action trigger: "${kw}"`);
    }
  });

  const hasCTA = ctaElementsFound.length > 0;
  if (!hasCTA) {
    auditIssues.push('Lacks prominent Call-To-Action (CTA) or contact funnel above the fold');
  } else {
    technicalStrengths.push(`Lead conversion pathways found (${ctaElementsFound.length})`);
  }

  // 5. Tech Stack Detection
  if (lowerHtml.includes('wp-content') || lowerHtml.includes('wordpress')) detectedTech.push('WordPress');
  if (lowerHtml.includes('shopify')) detectedTech.push('Shopify');
  if (lowerHtml.includes('wix.com')) detectedTech.push('Wix');
  if (lowerHtml.includes('squarespace')) detectedTech.push('Squarespace');
  if (lowerHtml.includes('webflow')) detectedTech.push('Webflow');
  if (lowerHtml.includes('next-data') || lowerHtml.includes('/_next/')) detectedTech.push('Next.js');
  if (lowerHtml.includes('react') || lowerHtml.includes('data-reactroot')) detectedTech.push('React');
  if (lowerHtml.includes('tailwind')) detectedTech.push('Tailwind CSS');
  if (lowerHtml.includes('jquery')) detectedTech.push('jQuery (Legacy)');
  if (detectedTech.length === 0) detectedTech.push('Custom HTML/JS');

  if (detectedTech.includes('WordPress') || detectedTech.includes('Wix') || detectedTech.includes('jQuery (Legacy)')) {
    auditIssues.push(`Legacy CMS/script architecture detected (${detectedTech.join(', ')}); prime candidate for modern React rewrite`);
  }

  // 6. Speed Rating based on measured latency and payload
  let speedRating: 'Fast' | 'Average' | 'Slow' = 'Average';
  if (responseTimeMs < 800 && rawPayloadBytes < 500000) {
    speedRating = 'Fast';
    technicalStrengths.push(`Fast initial server response (${responseTimeMs}ms)`);
  } else if (responseTimeMs > 2200 || rawPayloadBytes > 2500000) {
    speedRating = 'Slow';
    auditIssues.push(`High latency (${responseTimeMs}ms) and heavy payload (${Math.round(rawPayloadBytes / 1024)}KB) impairs mobile retention`);
  } else {
    speedRating = 'Average';
  }

  // 7. Structured Evidence-Based Findings (No Hallucinations)
  const findings: FindingItem[] = [];

  // Mobile viewport finding
  if (!hasMobileViewport) {
    findings.push({
      observation: 'Missing mobile viewport meta tag',
      evidence: 'HTML head does not contain <meta name="viewport"> declaration',
      source: 'HTML DOM Inspection',
      severity: 'CRITICAL',
      confidence: 100,
      suggestedImprovement: 'Implement responsive mobile viewport meta tag and fluid responsive CSS layout.',
      timestamp,
    });
  }

  // Latency finding
  if (responseTimeMs > 2000) {
    findings.push({
      observation: `High server response latency (${responseTimeMs}ms)`,
      evidence: `HTTP GET response time measured at ${responseTimeMs}ms over wire`,
      source: 'Network Timing Probe',
      severity: 'WARNING',
      confidence: 95,
      suggestedImprovement: 'Optimize server response time, static assets, and consider edge caching or Next.js static generation.',
      timestamp,
    });
  }

  // SSL finding
  if (!hasSSL) {
    findings.push({
      observation: 'Website lacks HTTPS / SSL encryption',
      evidence: `URL protocol resolved to unencrypted HTTP (${cleanUrl})`,
      source: 'Transport Layer Security Check',
      severity: 'CRITICAL',
      confidence: 100,
      suggestedImprovement: 'Install SSL certificate and enforce HTTPS redirect to protect visitor security and SEO trust.',
      timestamp,
    });
  }

  // CTA finding
  if (!hasCTA) {
    findings.push({
      observation: 'No high-converting Call-To-Action (CTA) elements detected on landing page',
      evidence: 'No telephone links (tel:), mailto links, lead capture forms, or booking action keywords found in HTML',
      source: 'Conversion Element Scan',
      severity: 'WARNING',
      confidence: 90,
      suggestedImprovement: 'Add prominent conversion pathways: tap-to-call header button, lead capture form, or booking scheduler.',
      timestamp,
    });
  }

  // Legacy stack finding
  if (detectedTech.includes('WordPress') || detectedTech.includes('Wix') || detectedTech.includes('jQuery (Legacy)')) {
    findings.push({
      observation: `Legacy platform detected: ${detectedTech.join(', ')}`,
      evidence: `Detected signatures: ${detectedTech.join(', ')} in source code`,
      source: 'Tech Stack Fingerprinting',
      severity: 'INFO',
      confidence: 95,
      suggestedImprovement: 'Migrate to a modern, lightning-fast React / Tailwind frontend architecture for superior performance.',
      timestamp,
    });
  }

  return {
    url: rawUrl,
    cleanUrl,
    isReachable: true,
    httpStatus,
    statusText,
    responseTimeMs,
    hasSSL,
    hasMobileViewport,
    viewportContent,
    pageTitle,
    metaDescription,
    h1Count,
    h1Text,
    hasCTA,
    ctaElementsFound,
    hasPhoneLink,
    hasEmailLink,
    hasContactForm,
    detectedTech,
    speedRating,
    auditIssues,
    technicalStrengths,
    findings,
    auditedAt: timestamp,
    rawPayloadBytes,
  };
}
