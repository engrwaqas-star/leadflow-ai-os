import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { Server } from 'http';
import { app } from '../../src/server-app';

describe('Express API Integration Test Suite', () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      // Listen on ephemeral port (0) for fully isolated integration testing
      server = app.listen(0, '127.0.0.1', () => {
        const address = server.address();
        if (address && typeof address === 'object') {
          baseUrl = `http://127.0.0.1:${address.port}`;
        }
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  describe('Health and System Status Endpoints', () => {
    it('GET /api/health returns ok status and environment metadata', async () => {
      const res = await fetch(`${baseUrl}/api/health`);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.status).toBe('ok');
      expect(data).toHaveProperty('environment');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('hasGeminiKey');
    });

    it('GET /api/provider/status returns provider health metrics', async () => {
      const res = await fetch(`${baseUrl}/api/provider/status?providerId=google-search-live`);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data).toHaveProperty('health');
      expect(data).toHaveProperty('allProviders');
      expect(Array.isArray(data.allProviders)).toBe(true);
    });
  });

  describe('Credential Forwarding Middleware', () => {
    it('intercepts custom API key headers and populates environment variables', async () => {
      const customSerpKey = 'test_forwarded_serp_key_999';
      
      const res = await fetch(`${baseUrl}/api/health`, {
        headers: {
          'x-serpapi-key': customSerpKey,
        },
      });

      expect(res.status).toBe(200);
      expect(process.env.SERPAPI_API_KEY).toBe(customSerpKey);
    });
  });

  describe('Website Audit and Credibility Endpoints', () => {
    it('POST /api/audit/website returns 400 when url is missing', async () => {
      const res = await fetch(`${baseUrl}/api/audit/website`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Website URL is required');
    });

    it('POST /api/audit/credibility handles missing website with default baseline', async () => {
      const res = await fetch(`${baseUrl}/api/audit/credibility`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ website: '' }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.credibility.hasSSL).toBe(false);
      expect(data.credibility.credibilityScore).toBe(20);
      expect(data.credibility.seoGrade).toBe('F');
    });
  });

  describe('Database Cleaning & Integrity Endpoints', () => {
    it('POST /api/leads/clean-database filters out placeholder and fake leads', async () => {
      const rawLeads = [
        { id: '1', businessName: 'Unnamed Business', website: 'https://domain.com', email: 'test@example.com' },
        { id: '2', businessName: 'Placeholder Corp', website: 'https://placeholder.org', email: 'info@placeholder.org' },
        { id: '3', businessName: 'Apex Medical Systems', website: 'https://apexmedical.org', email: 'contact@apexmedical.org' },
        { id: '4', businessName: 'Modern Dental Clinic', website: 'https://moderndental.com', email: 'dr@moderndental.com' },
      ];

      const res = await fetch(`${baseUrl}/api/leads/clean-database`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads: rawLeads }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.summary.totalEvaluated).toBe(4);
      expect(data.summary.removedPlaceholderCount).toBe(2);
      expect(data.summary.cleanedValidCount).toBe(2);
      expect(data.cleanedLeads.map((l: any) => l.businessName)).toEqual([
        'Apex Medical Systems',
        'Modern Dental Clinic',
      ]);
    });
  });

  describe('Gmail Integration Security & Protocol Validation', () => {
    it('POST /api/gmail/send returns 400 for invalid or missing recipient email', async () => {
      const res = await fetch(`${baseUrl}/api/gmail/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: 'not-an-email',
          subject: 'Test Subject',
          body: 'Hello',
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error_code).toBe('INVALID_RECIPIENT');
    });

    it('POST /api/gmail/send returns 400 when subject or body is empty', async () => {
      const res = await fetch(`${baseUrl}/api/gmail/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: 'client@legitdomain.com',
          subject: '',
          body: '',
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error_code).toBe('EMPTY_MESSAGE');
    });

    it('POST /api/gmail/send returns 401 GMAIL_AUTH_REQUIRED when OAuth Bearer token is absent', async () => {
      const res = await fetch(`${baseUrl}/api/gmail/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: 'client@legitdomain.com',
          subject: 'Website audit walkthrough',
          body: 'Hi, I audited your mobile loading speed and noticed some bottlenecks.',
        }),
      });

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error_code).toBe('GMAIL_AUTH_REQUIRED');
    });

    it('GET /api/gmail/profile returns 401 when Bearer header is missing', async () => {
      const res = await fetch(`${baseUrl}/api/gmail/profile`);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error_code).toBe('GMAIL_AUTH_REQUIRED');
    });
  });

  describe('Wildcard 404 Route Catch-All', () => {
    it('guarantees structured JSON 404 response on undefined API endpoints (never returns HTML)', async () => {
      const res = await fetch(`${baseUrl}/api/some/nonexistent/service/route`);
      expect(res.status).toBe(404);

      const contentType = res.headers.get('content-type') || '';
      expect(contentType).toContain('application/json');

      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.code).toBe('ROUTE_NOT_FOUND_404');
      expect(data.error).toContain('not found');
    });
  });
});
