import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { auditWebsiteLive } from '../../src/services/websiteAuditEngine';

describe('Website Audit Engine (Real DOM & Transport Verification)', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('URL input validation & edge cases', () => {
    it('handles empty or missing URLs gracefully without crashing', async () => {
      const result = await auditWebsiteLive('');
      expect(result.isReachable).toBe(false);
      expect(result.speedRating).toBe('Unreachable');
      expect(result.errorMessage).toBe('Missing URL');
      expect(result.findings).toEqual([]);
      expect(result.auditIssues).toContain('No valid website URL provided');
    });

    it('handles "Not found" placeholder URLs gracefully', async () => {
      const result = await auditWebsiteLive('Not found');
      expect(result.isReachable).toBe(false);
      expect(result.errorMessage).toBe('Missing URL');
      expect(result.findings).toHaveLength(0);
    });

    it('auto-prepends https:// when protocol is missing', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => '<html><head><meta name="viewport" content="width=device-width"><title>Valid Site</title></head><body><h1>Hello</h1></body></html>',
      }) as any;

      const result = await auditWebsiteLive('mybusiness.com');
      expect(result.cleanUrl).toBe('https://mybusiness.com');
      expect(result.hasSSL).toBe(true);
      expect(result.isReachable).toBe(true);
    });
  });

  describe('HTML DOM Inspection and Signal Extraction', () => {
    it('detects responsive viewport, clean SEO title, single h1, conversion triggers, and modern tech', async () => {
      const mockHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>NextGen SaaS Solutions - Scale Your Business</title>
          <meta name="description" content="NextGen provides cutting-edge cloud infrastructure and analytics." />
          <link rel="stylesheet" href="/tailwind.css" />
          <script src="/_next/static/chunks/main.js"></script>
        </head>
        <body>
          <header>
            <a href="tel:+15551234567">Call Us</a>
            <a href="mailto:hello@nextgensaas.io">Email Team</a>
            <button>Get Started</button>
          </header>
          <main>
            <h1>Next-Generation Cloud Analytics</h1>
            <div id="__next">
              <div data-reactroot="">Content here</div>
            </div>
            <form action="/signup" method="POST">
              <input type="email" name="email" placeholder="Work email" />
              <button type="submit">Book Demo</button>
            </form>
          </main>
        </body>
        </html>
      `;

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => mockHtml,
      }) as any;

      const result = await auditWebsiteLive('https://nextgensaas.io');

      expect(result.isReachable).toBe(true);
      expect(result.hasMobileViewport).toBe(true);
      expect(result.viewportContent).toContain('width=device-width');
      expect(result.pageTitle).toBe('NextGen SaaS Solutions - Scale Your Business');
      expect(result.metaDescription).toBe('NextGen provides cutting-edge cloud infrastructure and analytics.');
      expect(result.h1Count).toBe(1);
      expect(result.h1Text).toBe('Next-Generation Cloud Analytics');

      // Conversion checks
      expect(result.hasPhoneLink).toBe(true);
      expect(result.hasEmailLink).toBe(true);
      expect(result.hasContactForm).toBe(true);
      expect(result.hasCTA).toBe(true);
      expect(result.ctaElementsFound).toEqual(
        expect.arrayContaining([
          'Direct tap-to-call link',
          'Direct mailto link',
          'Interactive lead capture form',
          'Action trigger: "get started"',
        ])
      );

      // Tech Stack
      expect(result.detectedTech).toContain('React');
      expect(result.detectedTech).toContain('Next.js');
      expect(result.detectedTech).toContain('Tailwind CSS');

      // Strengths populated
      expect(result.technicalStrengths).toEqual(
        expect.arrayContaining([
          'Responsive viewport meta tag declared',
          'Clean single <h1> hierarchy',
        ])
      );
    });

    it('identifies critical defects: missing viewport, missing title, legacy CMS, no CTAs', async () => {
      const legacyHtml = `
        <html>
        <head>
          <!-- No viewport tag! -->
          <!-- No meta description! -->
          <script src="/wp-content/themes/old-theme/jquery.min.js"></script>
        </head>
        <body>
          <div>
            <!-- Missing h1 entirely -->
            <h2>Welcome to our local shop</h2>
            <p>We have been here since 1999.</p>
          </div>
        </body>
        </html>
      `;

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => legacyHtml,
      }) as any;

      const result = await auditWebsiteLive('http://oldshop.net');

      expect(result.isReachable).toBe(true);
      expect(result.hasSSL).toBe(false);
      expect(result.hasMobileViewport).toBe(false);
      expect(result.hasCTA).toBe(false);
      expect(result.h1Count).toBe(0);

      // Legacy tech detection
      expect(result.detectedTech).toContain('WordPress');
      expect(result.detectedTech).toContain('jQuery (Legacy)');

      // Critical issues logged
      expect(result.auditIssues).toEqual(
        expect.arrayContaining([
          expect.stringContaining('CRITICAL: Missing mobile viewport'),
          expect.stringContaining('Missing or empty <title> tag'),
          expect.stringContaining('Missing meta description tag'),
          expect.stringContaining('Missing primary <h1> heading'),
          expect.stringContaining('Lacks prominent Call-To-Action (CTA)'),
        ])
      );

      // Structured Findings (Evidence-based, zero hallucinations)
      const viewportFinding = result.findings.find(f => f.observation.includes('Missing mobile viewport'));
      expect(viewportFinding).toBeDefined();
      expect(viewportFinding?.severity).toBe('CRITICAL');
      expect(viewportFinding?.confidence).toBe(100);
      expect(viewportFinding?.source).toBe('HTML DOM Inspection');

      const sslFinding = result.findings.find(f => f.observation.includes('SSL'));
      expect(sslFinding).toBeDefined();
      expect(sslFinding?.severity).toBe('CRITICAL');

      const ctaFinding = result.findings.find(f => f.observation.includes('Call-To-Action'));
      expect(ctaFinding).toBeDefined();
      expect(ctaFinding?.severity).toBe('WARNING');

      const legacyFinding = result.findings.find(f => f.observation.includes('Legacy platform'));
      expect(legacyFinding).toBeDefined();
      expect(legacyFinding?.evidence).toContain('WordPress');
    });
  });

  describe('Network Errors and HTTP Failures', () => {
    it('handles HTTP 404 or 500 error responses correctly', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      }) as any;

      const result = await auditWebsiteLive('https://deadlink.com');
      expect(result.isReachable).toBe(false);
      expect(result.httpStatus).toBe(404);
      expect(result.speedRating).toBe('Unreachable');
      expect(result.auditIssues[0]).toContain('HTTP 404');
    });

    it('handles connection timeout / aborts gracefully', async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';

      globalThis.fetch = vi.fn().mockRejectedValue(abortError);

      const result = await auditWebsiteLive('https://super-slow-hanging-site.org');
      expect(result.isReachable).toBe(false);
      expect(result.speedRating).toBe('Unreachable');
      expect(result.auditIssues[0]).toContain('Website connection timed out');
      expect(result.errorMessage).toBe('The operation was aborted');
    });
  });
});
