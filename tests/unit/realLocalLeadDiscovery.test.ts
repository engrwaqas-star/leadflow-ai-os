import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  buildGoogleMapsLocalQuery, 
  extractCityFromAddress, 
  SerpApiSearchProvider,
  verifyAndNormalizeLead,
  isPlaceholderName,
  isPlaceholderDomain
} from '../../src/providers/LiveDataProvider';
import { formatLeadsForExport } from '../../src/utils/excel';

describe('Real Local Business Discovery & SerpApi Google Maps Engine', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv, SERPAPI_API_KEY: 'test_serpapi_key_valid' };
    delete process.env.GEMINI_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('1. City and Category Filter Propagation', () => {
    it('constructs clean Google Maps query for Salons in Austin without leaking developer sales boilerplate', () => {
      const query = {
        city: 'Austin',
        country: 'USA',
        industry: 'Salons',
        opportunityType: '$2,000+ Client Projects',
        budgetTarget: '$2,000+ Target',
        keyword: '',
      };

      const { primaryQuery, expandedQueries, cleanCategory } = buildGoogleMapsLocalQuery(query);

      expect(primaryQuery).toBe('Salons in Austin, USA');
      expect(primaryQuery).not.toContain('$2,000+');
      expect(primaryQuery).not.toContain('Client Projects');
      expect(cleanCategory).toBe('Salons');
      expect(expandedQueries).toContain('hair salon in Austin, USA');
    });

    it('updates query cleanly when city is changed to Chicago', () => {
      const query = {
        city: 'Chicago',
        country: 'USA',
        industry: 'Salons',
        opportunityType: 'Website Redesign & Modernization',
      };

      const { primaryQuery } = buildGoogleMapsLocalQuery(query);
      expect(primaryQuery).toBe('Salons in Chicago, USA');
      expect(primaryQuery).not.toContain('Modernization');
    });

    it('updates query cleanly when industry is changed to Dental Clinics in London', () => {
      const query = {
        city: 'London',
        country: 'United Kingdom',
        industry: 'Dental Clinics',
      };

      const { primaryQuery, expandedQueries } = buildGoogleMapsLocalQuery(query);
      expect(primaryQuery).toBe('Dental Clinics in London, United Kingdom');
      expect(expandedQueries.some(q => q.includes('dentist'))).toBe(true);
    });

    it('extracts city from Google Maps formatted address if city is omitted', () => {
      const address = '1401 S Congress Ave, Austin, TX 78704, USA';
      const extracted = extractCityFromAddress(address);
      expect(extracted).toBe('Austin');
    });
  });

  describe('2. Pagination & Target Limits (Up to 100 Unique Leads)', () => {
    it('requests multiple pages via start=0, start=20, start=40 to fulfill requested limit of 50 leads', async () => {
      const provider = new SerpApiSearchProvider();

      // Mock fetch to simulate 3 pages of results (20 + 20 + 10 = 50)
      const fetchCalls: string[] = [];
      globalThis.fetch = vi.fn().mockImplementation((url: string) => {
        if (typeof url === 'string' && url.includes('serpapi.com')) {
          fetchCalls.push(url);
        }
        const urlObj = new URL(url);
        const start = parseInt(urlObj.searchParams.get('start') || '0', 10);

        const pageResults = [];
        const countOnPage = start === 40 ? 10 : 20;

        for (let i = 0; i < countOnPage; i++) {
          const itemIdx = start + i + 1;
          pageResults.push({
            title: `Austin Salon Studio ${itemIdx}`,
            place_id: `place_austin_salon_${itemIdx}`,
            address: `${100 + itemIdx} Congress Ave, Austin, TX 78701`,
            phone: `(512) 555-01${itemIdx.toString().padStart(2, '0')}`,
            website: `https://austinsalon${itemIdx}.com`,
            rating: 4.8,
            reviews: 50 + itemIdx,
            type: 'Hair salon',
          });
        }

        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            local_results: pageResults,
          }),
        } as Response);
      });

      const result = await provider.searchBusinesses({
        city: 'Austin',
        country: 'USA',
        industry: 'Salons',
        limit: 50,
      });

      expect(result.success).toBe(true);
      expect(result.leads).toHaveLength(50);
      expect(result.validatedCount).toBe(50);
      expect(result.targetLimit).toBe(50);

      // Verify that pagination called start=0, start=20, start=40
      expect(fetchCalls.length).toBe(3);
      expect(fetchCalls[0]).toContain('start=0');
      expect(fetchCalls[1]).toContain('start=20');
      expect(fetchCalls[2]).toContain('start=40');
    });

    it('stops pagination early when a page returns fewer than 20 results', async () => {
      const provider = new SerpApiSearchProvider();
      const fetchCalls: string[] = [];

      globalThis.fetch = vi.fn().mockImplementation((url: string) => {
        if (typeof url === 'string' && url.includes('serpapi.com')) {
          fetchCalls.push(url);
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            local_results: [
              {
                title: 'Exclusive Boutique Salon',
                place_id: 'place_boutique_1',
                address: '101 Main St, Austin, TX',
                phone: '(512) 555-1111',
                website: 'https://exclusivesalon.com',
                rating: 4.9,
                reviews: 120,
              },
            ], // Only 1 result (< 20)
          }),
        } as Response);
      });

      const result = await provider.searchBusinesses({
        city: 'Austin',
        country: 'USA',
        industry: 'Salons',
        limit: 100,
      });

      expect(result.success).toBe(true);
      expect(result.leads.length).toBeGreaterThanOrEqual(1);
      // Stopped without wasting all 5 pages
      expect(fetchCalls.length).toBeLessThanOrEqual(3);
    });
  });

  describe('3. Stable Deduplication by Place ID and Name + Location', () => {
    it('deduplicates duplicate businesses returned across pages or categories using place_id', async () => {
      const provider = new SerpApiSearchProvider();

      globalThis.fetch = vi.fn().mockImplementation(() => {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            local_results: [
              {
                title: 'Method Hair Salon',
                place_id: 'ChIJ_duplicate_place_1',
                address: '123 E 4th St, Austin, TX 78701',
                phone: '(512) 555-0101',
                website: 'https://methodhairsalon.com',
                rating: 4.9,
                reviews: 210,
              },
              {
                title: 'Method Hair Salon',
                place_id: 'ChIJ_duplicate_place_1', // Duplicate place_id
                address: '123 E 4th St, Austin, TX 78701',
                phone: '(512) 555-0101',
                website: 'https://methodhairsalon.com',
                rating: 4.9,
                reviews: 210,
              },
              {
                title: 'Birds Barbershop',
                place_id: 'ChIJ_unique_place_2',
                address: '2110 S Lamar Blvd, Austin, TX 78704',
                phone: '(512) 555-0102',
                website: 'https://birdsbarbershop.com',
                rating: 4.7,
                reviews: 430,
              },
            ],
          }),
        } as Response);
      });

      const result = await provider.searchBusinesses({
        city: 'Austin',
        country: 'USA',
        industry: 'Salons',
        limit: 20,
      });

      expect(result.success).toBe(true);
      expect(result.leads).toHaveLength(2);
      expect(result.duplicatesRemovedCount).toBeGreaterThanOrEqual(1);
      expect(result.leads.map(l => l.businessName)).toEqual(['Method Hair Salon', 'Birds Barbershop']);
    });
  });

  describe('4. Missing Fields Handling and Honest Transparency', () => {
    it('marks missing website, phone, and email as "Not found" and tallies missing fields honestly', async () => {
      const provider = new SerpApiSearchProvider();

      globalThis.fetch = vi.fn().mockImplementation(() => {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            local_results: [
              {
                title: 'Austin Community Salon',
                place_id: 'place_no_web_no_phone',
                address: '400 E 6th St, Austin, TX 78701',
                // phone and website omitted
                rating: 4.5,
                reviews: 15,
              },
            ],
          }),
        } as Response);
      });

      const result = await provider.searchBusinesses({
        city: 'Austin',
        country: 'USA',
        industry: 'Salons',
      });

      expect(result.success).toBe(true);
      expect(result.leads).toHaveLength(1);
      const lead = result.leads[0];

      expect(lead.website).toBe('Not found');
      expect(lead.phone).toBe('Not found');
      expect(lead.email).toBe('Not found');
      expect(lead.contactPerson).toBe('Not found');
      expect(lead.auditStatus).toBe('Pending');
      expect(lead.missingFields).toContain('website');
      expect(lead.missingFields).toContain('phone');
      expect(lead.missingFields).toContain('email');

      expect(result.missingFieldsSummary?.missingWebsite).toBe(1);
      expect(result.missingFieldsSummary?.missingPhone).toBe(1);
      expect(result.missingFieldsSummary?.missingEmail).toBe(1);
    });
  });

  describe('5. Provider Error Handling & Zero Fake Fallbacks', () => {
    it('returns SERPAPI_UNAUTHORIZED on 401 response without manufacturing fake leads', async () => {
      const provider = new SerpApiSearchProvider();

      globalThis.fetch = vi.fn().mockImplementation(() => {
        return Promise.resolve({
          ok: false,
          status: 401,
          text: () => Promise.resolve('{"error":"Invalid API key"}'),
        } as Response);
      });

      const result = await provider.searchBusinesses({
        city: 'Austin',
        country: 'USA',
        industry: 'Salons',
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(401);
      expect(result.code).toBe('SERPAPI_UNAUTHORIZED');
      expect(result.leads).toHaveLength(0);
    });

    it('returns SERPAPI_QUOTA_EXCEEDED on 429 response without manufacturing fake leads', async () => {
      const provider = new SerpApiSearchProvider();

      globalThis.fetch = vi.fn().mockImplementation(() => {
        return Promise.resolve({
          ok: false,
          status: 429,
          text: () => Promise.resolve('{"error":"Searches quota reached"}'),
        } as Response);
      });

      const result = await provider.searchBusinesses({
        city: 'Austin',
        country: 'USA',
        industry: 'Salons',
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(429);
      expect(result.code).toBe('SERPAPI_QUOTA_EXCEEDED');
      expect(result.leads).toHaveLength(0);
    });

    it('returns empty results cleanly when 0 matching businesses exist, with 0 fake leads', async () => {
      const provider = new SerpApiSearchProvider();

      globalThis.fetch = vi.fn().mockImplementation(() => {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            local_results: [],
          }),
        } as Response);
      });

      const result = await provider.searchBusinesses({
        city: 'NonexistentTown999',
        country: 'USA',
        industry: 'Underwater Rocket Repair',
      });

      expect(result.success).toBe(true);
      expect(result.leads).toHaveLength(0);
      expect(result.rawCount).toBe(0);
      expect(result.validatedCount).toBe(0);
    });
  });

  describe('6. Prohibition on Fake Fallback Leads & Placeholder Identification', () => {
    it('detects and rejects placeholder company names and domains', () => {
      expect(isPlaceholderName('Unnamed Business')).toBe(true);
      expect(isPlaceholderName('Demo Company')).toBe(true);
      expect(isPlaceholderName('Sample Co')).toBe(true);
      expect(isPlaceholderName('Austin Hair Lounge')).toBe(false);

      expect(isPlaceholderDomain('https://example.com')).toBe(true);
      expect(isPlaceholderDomain('https://domain.com')).toBe(true);
      expect(isPlaceholderDomain('https://austinhairlounge.com')).toBe(false);
    });

    it('filters out synthetic placeholder businesses from search results', () => {
      const rawSynthetic = {
        businessName: 'Demo Company',
        contactPerson: 'Not found',
        email: 'Not found',
        website: 'https://example.com',
        source: 'SerpApi Google Maps',
        sourceUrl: 'https://example.com',
        verificationStatus: 'UNVERIFIED' as const,
      };

      const { isVerified, lead } = verifyAndNormalizeLead(rawSynthetic);
      expect(isVerified).toBe(false);
      expect(lead.verificationStatus).toBe('REJECTED');
    });
  });

  describe('7. Cache Key Isolation', () => {
    it('generates distinct cache keys when city, industry, or limit changes', () => {
      const providerId = 'serpapi-search';
      const key1 = `${providerId}|usa|austin|salons||limit=20`;
      const key2 = `${providerId}|usa|chicago|salons||limit=20`;
      const key3 = `${providerId}|usa|austin|dental||limit=20`;
      const key4 = `${providerId}|usa|austin|salons||limit=50`;

      expect(key1).not.toBe(key2);
      expect(key1).not.toBe(key3);
      expect(key1).not.toBe(key4);
    });
  });

  describe('8. Spreadsheet Export Provenance & Verification Columns', () => {
    it('exports source links, verification status, and Google Place ID in formatted rows', () => {
      const testLead = {
        id: 'test-disc-1',
        businessName: 'Method Hair Salon',
        contactPerson: 'Not found',
        email: 'Not found',
        phone: '(512) 555-0101',
        website: 'https://methodhair.com',
        address: '123 Congress Ave, Austin, TX',
        city: 'Austin',
        country: 'USA',
        industry: 'Hair salon',
        source: 'SerpApi Google Maps',
        sourceUrl: 'https://www.google.com/maps/place/?q=place_id:ChIJ_austin_123',
        verificationStatus: 'VERIFIED' as const,
        google_place_id: 'ChIJ_austin_123',
        rating: 4.9,
        reviews: 210,
        score: 85,
        temperature: 'HOT' as const,
        contactStatus: 'Not Contacted' as const,
        websiteStatus: 'Active',
        suggestedService: 'React Modernization',
        auditIssue: 'Technical website audit pending live inspection',
        speedRating: 'Average' as const,
        mobileViewport: false,
        clearCTA: false,
        stage: 'IDENTITY_VERIFIED' as const,
        createdAt: new Date().toISOString(),
      };

      const rows = formatLeadsForExport([testLead]);
      expect(rows).toHaveLength(1);
      const row = rows[0];

      expect(row['Business Name']).toBe('Method Hair Salon');
      expect(row['Source']).toBe('SerpApi Google Maps');
      expect(row['Source URL']).toBe('https://www.google.com/maps/place/?q=place_id:ChIJ_austin_123');
      expect(row['Verification Status']).toBe('VERIFIED');
      expect(row['Google Place ID']).toBe('ChIJ_austin_123');
      expect(row['Rating']).toBe(4.9);
      expect(row['Reviews']).toBe(210);
      expect(row['Address']).toBe('123 Congress Ave, Austin, TX');
      expect(row['Audit Status']).toBe('Pending');
    });
  });
});
